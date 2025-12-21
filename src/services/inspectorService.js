const {
  User,
  Case,
  InspectorPayment,
  BankDetails,
  NotificationSettings,
  PrivacyPolicySettings,
  Expertise,
  UserExpertise,
} = require("../models/index");
const { Op, Sequelize } = require("sequelize");
const bcrypt = require("bcryptjs");

const createInspector = async (inspectorData, inspectorExpertiseCodes) => {
  const newInspector = await User.create(inspectorData);
  if (inspectorExpertiseCodes && inspectorExpertiseCodes.length > 0) {
    const expertiseEntries = inspectorExpertiseCodes.map((code) => ({
      userId: newInspector.userId,
      expertiseCode: code,
    }));

    await UserExpertise.bulkCreate(expertiseEntries, {
      ignoreDuplicates: true,
    });
  }
  return newInspector;
};

const getInspectorDasboard = async (inspectorId) => {
  try {
    if (!inspectorId) {
      throw new Error("Inspector ID is required");
    }

  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
    attributes: ["userFirstName", "userLastName"],
  });

    if (!inspector) {
      throw new Error("Inspector not found");
    }

    // Count active cases - includes open, in-progress, and on-hold (excludes completed and cancelled)
  const activeCases = await Case.count({
    where: {
      inspectorId,
        caseStatus: {
          [Op.in]: ["open", "in-progress", "on-hold"],
        },
      },
    }) || 0;

    let totalEarnings = 0;
    try {
      const isPostgres = InspectorPayment.sequelize.getDialect() === "postgres";
      let earningsSum;
      
      if (isPostgres) {
        // For PostgreSQL, cast VARCHAR to numeric before summing
        const result = await InspectorPayment.sequelize.query(
          `SELECT COALESCE(SUM(CAST("paymentAmount" AS numeric)), 0) AS "sum" FROM "InspectorPayment" WHERE "inspectorId" = :inspectorId`,
          {
            replacements: { inspectorId },
            type: Sequelize.QueryTypes.SELECT,
            plain: true,
          }
        );
        earningsSum = result?.sum || 0;
      } else {
        // For other databases, use regular sum
        earningsSum = await InspectorPayment.sum("paymentAmount", {
          where: { inspectorId },
        });
      }
      
      totalEarnings = earningsSum ? parseFloat(earningsSum) : 0;
    } catch (earningsError) {
      console.error("Error calculating total earnings:", earningsError);
      // If InspectorPayment model doesn't exist or has issues, default to 0
      totalEarnings = 0;
    }

    // Get prioritized cases (active cases with deadlines - open, in-progress, on-hold)
    const prioritizedCasesRaw = await Case.findAll({
      where: {
        inspectorId,
        caseStatus: {
          [Op.in]: ["open", "in-progress", "on-hold"],
        },
      },
      attributes: [
        "caseId",
        "caseDescription",
        "caseStatus",
        "caseDeadline",
        "caseUrgencyLevel",
        "createdAt",
      ],
      include: [
        {
          model: User,
          as: "tenant",
          attributes: [
            ["userId", "tenantId"],
            "userFirstName",
            "userLastName",
          ],
          required: false,
        },
      ],
      order: [["caseDeadline", "ASC NULLS LAST"]],
      limit: 10,
    }) || [];

    // Helper function to calculate time remaining
    const calculateTimeRemaining = (deadline) => {
      if (!deadline) return null;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      
      if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return { expired: false, days, hours, minutes };
    };

    // Transform cases to match frontend expectations
    const prioritizedCases = prioritizedCasesRaw.map((caseItem) => {
      const caseData = caseItem.get({ plain: true });
      const tenant = caseData.tenant;
      const timeRemaining = calculateTimeRemaining(caseData.caseDeadline);
      
      return {
        caseId: caseData.caseId,
        caseDescription: caseData.caseDescription,
        caseStatus: caseData.caseStatus,
        caseDeadline: caseData.caseDeadline,
        caseUrgencyLevel: caseData.caseUrgencyLevel,
        createdAt: caseData.createdAt,
        timeRemaining: timeRemaining,
        tenantName: tenant 
          ? `${tenant.userFirstName || ""} ${tenant.userLastName || ""}`.trim()
          : "N/A",
        tenant: tenant || null,
      };
    });

    // Calculate total work hours and minutes from TrackingTime
    let totalWorkHours = 0;
    let totalWorkMinutes = 0;
    
    try {
      const { TrackingTime } = require("../models/index");
      const { Op } = require("sequelize");
      
      // Get all completed timer sessions for this inspector
      // Handle case where caseId or isActive columns might not exist
      let completedTimers = [];
      
      try {
        // Try with all new columns first
        completedTimers = await TrackingTime.findAll({
          where: {
            inspectorId,
            isActive: false,
            trackingTimeEnd: { [Op.ne]: null },
          },
          attributes: ["trackingTimeStart", "trackingTimeEnd"],
        });
      } catch (dbError) {
        const errorMsg = dbError.message || String(dbError);
        const hasIsActiveError = errorMsg.includes("isActive") && (errorMsg.includes("does not exist") || errorMsg.includes("column") || errorMsg.includes("unknown column") || errorMsg.includes("of relation"));
        
        if (hasIsActiveError) {
          // Fallback: get timers where trackingTimeEnd is not null
          try {
            completedTimers = await TrackingTime.findAll({
              where: {
                inspectorId,
                trackingTimeEnd: { [Op.ne]: null },
              },
              attributes: ["trackingTimeStart", "trackingTimeEnd"],
            });
          } catch (fallbackError) {
            console.warn("Could not fetch work hours:", fallbackError.message);
            completedTimers = [];
          }
        } else {
          console.warn("Error fetching work hours:", errorMsg);
          completedTimers = [];
        }
      }
      
      // Calculate total time from completed sessions
      let totalSeconds = 0;
      completedTimers.forEach((timer) => {
        if (timer.trackingTimeStart && timer.trackingTimeEnd) {
          const start = new Date(timer.trackingTimeStart);
          const end = new Date(timer.trackingTimeEnd);
          const duration = Math.floor((end - start) / 1000); // seconds
          totalSeconds += duration;
        }
      });
      
      const totalMinutesCalc = Math.floor(totalSeconds / 60);
      totalWorkHours = Math.floor(totalMinutesCalc / 60);
      totalWorkMinutes = totalMinutesCalc % 60; // Remaining minutes after hours
      
      console.log(`Calculated work hours for inspector ${inspectorId}: ${totalWorkHours}h ${totalWorkMinutes}m (${totalMinutesCalc} total minutes)`);
    } catch (timerError) {
      console.error("Error calculating work hours:", timerError);
      // Default to 0 if TrackingTime doesn't exist or has issues
      totalWorkHours = 0;
      totalWorkMinutes = 0;
    }

  return {
    welcomeMessage: `Welcome back ${inspector?.userFirstName || "User"} 👋`,
      totalEarnings: totalEarnings || 0,
      activeCases: activeCases || 0,
      prioritizedCases: prioritizedCases || [],
      totalWorkHours: totalWorkHours || 0,
      totalWorkMinutes: totalWorkMinutes || 0,
    };
  } catch (error) {
    console.error("Error in getInspectorDasboard:", error);
    throw error;
  }
};

const getInspectorById = async (inspectorId, includePassword = false) => {
  const attributes = includePassword 
    ? {} 
    : { exclude: ["userPassword"] };
    
  return await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
    attributes,
    include: [
      {
        model: Expertise,
        as: "expertises",
        attributes: ["expertiseCode", "expertiseArea", "expertiseDescription"],
        through: { attributes: [] },
      },
    ],
  });
};

const updateInspectorPassword = async (inspectorId, hashedPassword) => {
  return await User.update(
    { userPassword: hashedPassword },
    { where: { userId: inspectorId, userType: "inspector" } }
  );
};

const getAllInspectors = async ({ search, page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const whereClause = { userType: "inspector" };

  if (search) {
    whereClause[Op.or] = [
      { userFirstName: { [Op.like]: `%${search}%` } },
      { userLastName: { [Op.like]: `%${search}%` } },
      { userEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows: inspectors, count: totalInspectors } =
    await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ["userPassword"] },
      include: [
        {
          model: Expertise,
          as: "expertises",
          attributes: ["expertiseCode", "expertiseArea", "expertiseDescription"],
          through: { attributes: [] },
          required: false, // Left join - don't require expertise to exist
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["createdAt", "DESC"]],
      distinct: true, // Important for PostgreSQL when using includes with count
    });

  return {
    inspectors,
    totalInspectors,
    totalPages: Math.ceil(totalInspectors / limit),
    currentPage: parseInt(page),
  };
};

const exportInspectors = async () => {
  return await User.findAll({
    where: { userType: "inspector" },
    attributes: [
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userPhone", "phone"],
      ["userCity", "city"],
      ["userAddress", "address"],
      ["userPostcode", "postcode"],
      ["userCountry", "country"],
      ["createdAt", "dateRegistered"],
    ],
    order: [["createdAt", "DESC"]],
    raw: true,
  });
};

const deactivateInspector = async (inspectorId) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
  });

  if (!inspector) return null;

  await inspector.update({ userStatus: "inactive" });
  return inspector;
};

const getInspectorCases = async ({
  search,
  status,
  page,
  limit,
  sortBy,
  sortOrder,
  userId,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = { inspectorId: userId };

  if (status) {
    whereClause.caseStatus = status;
  }

  if (search) {
    whereClause.caseDescription = { [Op.like]: `%${search}%` };
  }

  const { rows: cases, count: totalCases } = await Case.findAndCountAll({
    where: whereClause,
    attributes: [
      ["caseId", "caseID"],
      ["caseDescription", "caseDescription"],
      ["caseStatus", "status"],
    ],
    include: [
      {
        model: User,
        as: "tenant",
        attributes: [
          ["userId", "tenantId"],
          "userFirstName",
          "userLastName",
          "userProfilePic",
        ],
      },
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    cases,
    totalCases,
    totalPages: Math.ceil(totalCases / limit),
    currentPage: parseInt(page),
  };
};

const getInspectorEarnings = async (inspectorId) => {
  try {
    const { Case, Report, AssessmentSummary } = require("../models/index");
    const isPostgres = InspectorPayment.sequelize.getDialect() === "postgres";
    
    // Total Balance: Estimated earnings for cases being worked on (not yet submitted/requested)
    // This is the sum of pending payments (cases completed but payment not yet requested/processed)
    let totalBalance = 0;
    
    if (isPostgres) {
      // For PostgreSQL, cast VARCHAR to numeric before summing
      const result = await InspectorPayment.sequelize.query(
        `SELECT COALESCE(SUM(CAST("paymentAmount" AS numeric)), 0) AS "sum" FROM "InspectorPayment" WHERE "inspectorId" = :inspectorId AND "paymentStatus" = :status`,
        {
          replacements: { inspectorId, status: "pending" },
          type: Sequelize.QueryTypes.SELECT,
          plain: true,
        }
      );
      totalBalance = result?.sum || 0;
    } else {
      // For other databases, use regular sum
      totalBalance = await InspectorPayment.sum("paymentAmount", {
        where: {
          inspectorId,
          paymentStatus: "pending",
        },
      }) || 0;
    }

    // Total Earnings: Sum of processed + requested payments
    let totalEarnings = 0;
    if (isPostgres) {
      const earningsResult = await InspectorPayment.sequelize.query(
        `SELECT COALESCE(SUM(CAST("paymentAmount" AS numeric)), 0) AS "sum" FROM "InspectorPayment" WHERE "inspectorId" = :inspectorId AND "paymentStatus" IN (:status1, :status2)`,
        {
          replacements: { 
            inspectorId, 
            status1: "processed", 
            status2: "requested" 
          },
          type: Sequelize.QueryTypes.SELECT,
          plain: true,
        }
      );
      totalEarnings = earningsResult?.sum || 0;
    } else {
      totalEarnings = await InspectorPayment.sum("paymentAmount", {
        where: {
          inspectorId,
          paymentStatus: { [Op.in]: ["processed", "requested"] },
        },
      }) || 0;
    }

    // Get all payments with case details
    const payments = await InspectorPayment.findAll({
      where: { inspectorId },
      include: [
        {
          model: Case,
          as: "case",
          attributes: ["caseId", "caseDescription", "caseStatus", "createdAt"],
          required: false,
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    // Format case earnings list (only pending payments for individual case earnings)
    const caseEarnings = payments
      .filter((p) => p.paymentStatus === "pending")
      .map((payment) => {
        const paymentData = payment.toJSON ? payment.toJSON() : payment;
        return {
          paymentId: paymentData.paymentId,
          caseId: paymentData.caseId,
          caseDescription: paymentData.case?.caseDescription || "N/A",
          earnings: parseFloat(paymentData.paymentAmount) || 0,
          status: paymentData.paymentStatus,
          completedDate: paymentData.case?.createdAt || paymentData.paymentDate,
        };
      });

    // Format payout history (all statuses)
    const payoutHistory = payments.map((payment) => {
      const paymentData = payment.toJSON ? payment.toJSON() : payment;
      return {
        date: paymentData.paymentDate,
        referenceNumber: paymentData.paymentId,
        amount: parseFloat(paymentData.paymentAmount) || 0,
        status: paymentData.paymentStatus,
        caseId: paymentData.caseId,
        caseDescription: paymentData.case?.caseDescription || null,
      };
    });

    return {
      totalBalance: parseFloat(totalBalance) || 0,
      totalEarnings: parseFloat(totalEarnings) || 0,
      caseEarnings,
      payoutHistory,
    };
  } catch (error) {
    console.error("Error in getInspectorEarnings:", error);
    throw error;
  }
};

const sendEarningsReport = async ({ inspectorId, month, year }) => {
  try {
    const { User, InspectorPayment, Case } = require("../models/index");
    const { generateEarningsReportPDF } = require("../utils/generateEarningsReportPDF");
    
    // Get inspector details
    const inspector = await User.findOne({
      where: { userId: inspectorId, userType: "inspector" },
      attributes: ["userEmail", "userFirstName", "userLastName"],
    });

    if (!inspector) {
      throw new Error("Inspector not found");
    }

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get earnings for the specified month
    const payments = await InspectorPayment.findAll({
      where: {
        inspectorId,
        paymentDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Case,
          as: "case",
          attributes: ["caseId", "caseDescription", "caseStatus"],
          required: false,
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    // Calculate totals
    const isPostgres = InspectorPayment.sequelize.getDialect() === "postgres";
    let totalEarnings = 0;
    let pendingEarnings = 0;
    let processedEarnings = 0;

    payments.forEach((payment) => {
      const amount = parseFloat(payment.paymentAmount) || 0;
      totalEarnings += amount;
      if (payment.paymentStatus === "pending") {
        pendingEarnings += amount;
      } else if (payment.paymentStatus === "processed") {
        processedEarnings += amount;
      }
    });

    // Format month name
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[month - 1];

    // Generate PDF report
    const reportData = {
      inspector,
      payments,
      totalEarnings,
      pendingEarnings,
      processedEarnings,
    };

    const pdfBuffer = await generateEarningsReportPDF(reportData, month, year);
    
    console.log(`✅ Earnings report PDF generated for ${inspector.userFirstName} ${inspector.userLastName} - ${monthName} ${year}`);
    
    return {
      success: true,
      pdfBuffer,
      filename: `Earnings-Report-${monthName}-${year}.pdf`,
    };
  } catch (error) {
    console.error("Error in sendEarningsReport:", error);
    throw error;
  }
};

const getPayoutDetails = async (paymentId, inspectorId) => {
  try {
    const { InspectorPayment, Case, User } = require("../models/index");
    
    const payment = await InspectorPayment.findOne({
      where: {
        paymentId,
        inspectorId,
      },
      include: [
        {
          model: Case,
          as: "case",
          attributes: ["caseId", "caseDescription", "caseStatus"],
          required: false,
        },
      ],
    });

    if (!payment) {
      return null;
    }

    const inspector = await User.findOne({
      where: { userId: inspectorId, userType: "inspector" },
      attributes: ["userFirstName", "userLastName", "userEmail", "userPhone"],
    });

    const paymentData = payment.toJSON ? payment.toJSON() : payment;
    
    return {
      paymentId: paymentData.paymentId,
      referenceNumber: paymentData.paymentId,
      date: paymentData.paymentDate,
      paymentDate: paymentData.paymentDate,
      amount: parseFloat(paymentData.paymentAmount) || 0,
      paymentAmount: parseFloat(paymentData.paymentAmount) || 0,
      status: paymentData.paymentStatus,
      caseId: paymentData.caseId,
      caseDescription: paymentData.case?.caseDescription || null,
      inspector: inspector ? inspector.toJSON() : null,
    };
  } catch (error) {
    console.error("Error in getPayoutDetails:", error);
    throw error;
  }
};

const requestPayout = async ({ inspectorId, amount, userPassword, paymentId }) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
    attributes: ["userPassword"],
  });

  if (!inspector) {
    return {
      success: false,
      message: "Inspector not found",
    };
  }

  const isPasswordValid = await bcrypt.compare(
    userPassword,
    inspector.userPassword
  );
  if (!isPasswordValid) {
    return {
      success: false,
      message: "Incorrect password",
    };
  }

  // If paymentId is provided, request payout for specific payment
  if (paymentId) {
    const payment = await InspectorPayment.findOne({
      where: {
        paymentId,
        inspectorId,
        paymentStatus: "pending",
      },
    });

    if (!payment) {
      return {
        success: false,
        message: "Payment not found or not available for payout",
      };
    }

    const paymentAmount = parseFloat(payment.paymentAmount);
    if (parseFloat(amount) !== paymentAmount) {
      return {
        success: false,
        message: `Invalid payout amount. Expected ${paymentAmount} kr for this payment.`,
      };
    }

    await payment.update({ paymentStatus: "requested" });

    return {
      success: true,
      message: `Payout request successful for ${paymentAmount} kr. Your payment is being processed.`,
    };
  }

  // Otherwise, request payout for all pending payments (backward compatibility)
  const isPostgres = InspectorPayment.sequelize.getDialect() === "postgres";
  let pendingBalance;
  
  if (isPostgres) {
    // For PostgreSQL, cast VARCHAR to numeric before summing
    const result = await InspectorPayment.sequelize.query(
      `SELECT COALESCE(SUM(CAST("paymentAmount" AS numeric)), 0) AS "sum" FROM "InspectorPayment" WHERE "inspectorId" = :inspectorId AND "paymentStatus" = :status`,
      {
        replacements: { inspectorId, status: "pending" },
        type: Sequelize.QueryTypes.SELECT,
        plain: true,
      }
    );
    pendingBalance = result?.sum || 0;
  } else {
    // For other databases, use regular sum
    pendingBalance = await InspectorPayment.sum("paymentAmount", {
      where: {
        inspectorId,
        paymentStatus: "pending",
      },
    });
  }

  if (!pendingBalance) {
    return {
      success: false,
      message: "You currently have no pending balance",
    };
  }

  if (parseFloat(amount) !== parseFloat(pendingBalance)) {
    return {
      success: false,
      message: `Invalid payout amount requested. You can only request a payout of ${pendingBalance} which is your pending balance.`,
    };
  }

  await InspectorPayment.update(
    { paymentStatus: "requested" },
    {
      where: { inspectorId, paymentStatus: "pending" },
    }
  );

  return {
    success: true,
    message: "Payout request successful. Your payment is being processed.",
  };
};

const getInspectorSettings = async (inspectorId) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId },
    attributes: [
      "userFirstName",
      "userLastName",
      "userEmail",
      "userPhone",
      "userCity",
      "userPostcode",
      "userAddress",
      "userCountry",
      "userProfilePic",
      "userSignature",
      "userStatus",
    ],
    include: [
      {
        model: BankDetails,
        as: "bankDetails",
        attributes: [
          "bankName",
          "accountNumber",
          "sortCode",
          "userFirstName",
          "userLastName",
        ],
      },
      {
        model: NotificationSettings,
        as: "notifications",
        attributes: [
          "deadlineNotifications",
          "newCaseAlerts",
          "tenantsUpdates",
          "messageNotifications",
        ],
      },
      {
        model: PrivacyPolicySettings,
        as: "privacyPolicy",
        attributes: ["essentialCookies", "thirdPartySharing"],
      },
      {
        model: Expertise,
        as: "expertises",
        attributes: ["expertiseCode", "expertiseArea", "expertiseDescription"],
        through: { attributes: [] },
      },
    ],
  });

  if (!inspector) return null;

  return {
    account: {
      userFirstName: inspector.userFirstName,
      userLastName: inspector.userLastName,
      userEmail: inspector.userEmail,
      userPhone: inspector.userPhone,
      expertiseCode: inspector.expertiseCode,
      language: "English",
      userAddress: inspector.userAddress,
      userPostcode: inspector.userPostcode,
      userCountry: inspector.userCountry,
      userProfilePic: inspector.userProfilePic,
      userSignature: inspector.userSignature,
      expertises: inspector.expertises.map((expertise) => ({
        expertiseCode: expertise.expertiseCode,
        expertiseArea: expertise.expertiseArea,
        expertiseDescription: expertise.expertiseDescription,
      })),
    },
    notifications: inspector.notifications,
    payment: inspector.bankDetails,
    privacySecurity: {
      mfaEnabled: false,
      pauseMode: inspector.userStatus === "active" ? false : true,
    },
  };
};

const updateInspectorSettings = async (inspectorId, data) => {
  try {
    console.log("updateInspectorSettings called with:", { inspectorId, dataKeys: Object.keys(data) });
    const { notifications, payment, privacySecurity, expertises, userProfilePic, userSignature } = data;

  const inspector = await User.findOne({
    where: { userId: inspectorId },
    include: [{ model: Expertise, as: "expertises" }],
  });

  if (!inspector) {
      console.error("Inspector not found:", inspectorId);
    return { success: false, message: "Inspector not found" };
  }
    
    console.log("Inspector found, proceeding with updates");

  if (notifications) {
      try {
        // Check if NotificationSettings record exists, create if not
        const existingSettings = await NotificationSettings.findOne({
          where: { userId: inspectorId },
        });
        
        if (existingSettings) {
    await NotificationSettings.update(
      { ...notifications },
      { where: { userId: inspectorId } }
    );
        } else {
          await NotificationSettings.create({
            userId: inspectorId,
            ...notifications,
          });
        }
      } catch (notifError) {
        console.error("Error updating notifications:", notifError);
        // Continue with other updates even if notifications fail
      }
  }

  if (payment) {
      try {
        // Check if BankDetails record exists, create if not
        const existingBank = await BankDetails.findOne({
          where: { userId: inspectorId },
        });
        
        if (existingBank) {
    await BankDetails.update(
      {
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        userFirstName: payment.userFirstName,
        userLastName: payment.userLastName,
      },
      { where: { userId: inspectorId } }
    );
        } else {
          await BankDetails.create({
            userId: inspectorId,
            bankName: payment.bankName,
            accountNumber: payment.accountNumber,
            userFirstName: payment.userFirstName,
            userLastName: payment.userLastName,
          });
        }
      } catch (bankError) {
        console.error("Error updating bank details:", bankError);
        // Continue with other updates even if bank details fail
      }
    }

    if (privacySecurity && privacySecurity.pauseMode !== undefined) {
      try {
        inspector.userStatus = privacySecurity.pauseMode ? "inactive" : "active";
    await inspector.save();
      } catch (statusError) {
        console.error("Error updating user status:", statusError);
      }
    }

    // Update profile picture and signature if provided
    if (userProfilePic !== undefined || userSignature !== undefined) {
      try {
        const updateFields = {};
        if (userProfilePic !== undefined) {
          updateFields.userProfilePic = userProfilePic;
        }
        if (userSignature !== undefined) {
          updateFields.userSignature = userSignature;
        }
        await User.update(updateFields, { where: { userId: inspectorId } });
      } catch (profileError) {
        console.error("Error updating profile picture/signature:", profileError);
      }
    }

    if (expertises && Array.isArray(expertises)) {
      try {
        // Ensure all expertise codes are numbers
        const expertiseCodes = expertises
          .map((code) => (typeof code === 'string' ? parseInt(code, 10) : code))
          .filter((code) => !isNaN(code) && code !== null && code !== undefined);
        
        console.log("Updating expertises:", expertiseCodes);
        
        const existingExpertises = (inspector.expertises || []).map((e) => e.expertiseCode);

        const codesToAdd = expertiseCodes.filter(
      (code) => !existingExpertises.includes(code)
    );
    const codesToRemove = existingExpertises.filter(
          (code) => !expertiseCodes.includes(code)
    );

        console.log("Expertises to add:", codesToAdd);
        console.log("Expertises to remove:", codesToRemove);

    if (codesToRemove.length > 0) {
      await UserExpertise.destroy({
        where: {
          userId: inspectorId,
          expertiseCode: codesToRemove,
        },
      });
          console.log("Removed expertises:", codesToRemove);
    }

    if (codesToAdd.length > 0) {
      const newExpertiseMappings = codesToAdd.map((code) => ({
        userId: inspectorId,
        expertiseCode: code,
      }));
          await UserExpertise.bulkCreate(newExpertiseMappings, {
            ignoreDuplicates: true,
          });
          console.log("Added expertises:", codesToAdd);
        }
      } catch (expertiseError) {
        console.error("Error updating expertises:", expertiseError);
        console.error("Expertise error details:", {
          message: expertiseError.message,
          name: expertiseError.name,
          code: expertiseError.code,
        });
        // Re-throw to be caught by outer try-catch
        throw new Error(`Failed to update expertises: ${expertiseError.message}`);
    }
  }

  return { success: true, message: "Inspector settings updated successfully" };
  } catch (error) {
    console.error("Error in updateInspectorSettings:", error);
    throw error;
  }
};

const deleteInspector = async (inspectorId) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
  });
  if (!inspector) return null;

  await inspector.destroy();
  return inspector;
};

const getInspectorReports = async ({ inspectorId, page, limit, search }) => {
  const { Report, Case, AssessmentSummary, Property } = require("../models/index");
  const offset = (page - 1) * limit;
  const whereClause = { inspectorId };

  if (search) {
    whereClause.reportDescription = { [Op.like]: `%${search}%` };
  }

  const { rows: reports, count: totalReports } = await Report.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Case,
        attributes: [
          ["caseId", "caseID"],
          ["caseDescription", "caseDescription"],
        ],
        include: [
          {
            model: Property,
            as: "property",
            attributes: ["propertyAddress"],
            required: false,
          },
        ],
      },
      {
        model: AssessmentSummary,
        as: "assessmentSummary",
        attributes: [
          ["sumInclVAT", "total"],
        ],
        required: false,
      },
    ],
    attributes: [
      ["reportId", "reportId"],
      ["caseId", "caseId"],
      ["reportDescription", "description"],
      ["pdfUrl", "pdfUrl"],
      ["createdAt", "date"],
    ],
    limit: parseInt(limit),
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    reports,
    totalReports,
    totalPages: Math.ceil(totalReports / limit),
    currentPage: parseInt(page),
  };
};

const getReportPreview = async (caseId, inspectorId) => {
  const { Report, Case, AssessmentItem, AssessmentSummary, ReportPhoto } = require("../models/index");
  
  // Verify case exists and is assigned to this inspector
  const caseItem = await Case.findOne({
    where: { caseId, inspectorId },
  });

  if (!caseItem) {
    return null;
  }

  // Get the latest report for this case
  const report = await Report.findOne({
    where: { caseId, inspectorId },
    include: [
      {
        model: AssessmentItem,
        as: "assessmentItems",
      },
      {
        model: AssessmentSummary,
        as: "assessmentSummary",
      },
      {
        model: ReportPhoto,
        as: "reportPhotos",
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return report;
};

const deleteReport = async (reportId, inspectorId) => {
  try {
    const { Report, AssessmentItem, AssessmentSummary, ReportPhoto } = require("../models/index");
    
    const report = await Report.findOne({
      where: { reportId, inspectorId },
    });

    if (!report) {
      return null;
    }

    // Delete related data - check if models exist before destroying
    if (AssessmentItem && typeof AssessmentItem.destroy === 'function') {
      await AssessmentItem.destroy({ where: { reportId } });
    }
    if (AssessmentSummary && typeof AssessmentSummary.destroy === 'function') {
      await AssessmentSummary.destroy({ where: { reportId } });
    }
    if (ReportPhoto && typeof ReportPhoto.destroy === 'function') {
      await ReportPhoto.destroy({ where: { reportId } });
    }
    
    // Delete the report
    if (report && typeof report.destroy === 'function') {
      await report.destroy();
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteReport service:", error);
    throw error;
  }
};

const getReportPdf = async (reportId, inspectorId) => {
  const { Report } = require("../models/index");
  
  const report = await Report.findOne({
    where: { reportId, inspectorId },
    attributes: ["pdfUrl"],
  });

  if (!report) {
    return null;
  }

  // Return the PDF URL if it exists
  return report.pdfUrl || null;
};

module.exports = {
  getInspectorById,
  getAllInspectors,
  createInspector,
  exportInspectors,
  deactivateInspector,
  updateInspectorPassword,
  getInspectorDasboard,
  getInspectorCases,
  getInspectorEarnings,
  requestPayout,
  sendEarningsReport,
  getPayoutDetails,
  getInspectorSettings,
  updateInspectorSettings,
  deleteInspector,
  getInspectorReports,
  getReportPreview,
  deleteReport,
  getReportPdf,
};
