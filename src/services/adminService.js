const {
  User,
  UserExpertise,
  Payment,
  InspectorPayment,
  Refund,
  Case,
  sequelize,
} = require("../models/index");
const { Op, Sequelize } = require("sequelize");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

const getAdminDashboardData = async () => {
  const totalUsers = await User.count();
  const totalInspectors = await User.count({
    where: { userType: "inspector" },
  });
  const totalTenants = await User.count({ where: { userType: "tenant" } });
  const totalLandlords = await User.count({ where: { userType: "landlord" } });

  // Use EXTRACT for PostgreSQL, MONTH for MySQL
  const isPostgres = sequelize.getDialect() === "postgres";

  // Cast to numeric for PostgreSQL if columns are VARCHAR
  const totalRevenue = isPostgres
    ? await Payment.findAll({
        attributes: [
          [
            Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("paymentAmount"), "numeric")),
            "total",
          ],
        ],
        where: { paymentStatus: "processed" },
        raw: true,
      }).then((result) => parseFloat(result[0]?.total || 0))
    : await Payment.sum("paymentAmount", {
        where: { paymentStatus: "processed" },
      });

  const totalPayouts = isPostgres
    ? await InspectorPayment.findAll({
        attributes: [
          [
            Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("paymentAmount"), "numeric")),
            "total",
          ],
        ],
        where: { paymentStatus: "processed" },
        raw: true,
      }).then((result) => parseFloat(result[0]?.total || 0))
    : await InspectorPayment.sum("paymentAmount", {
        where: { paymentStatus: "processed" },
      });

  const totalRefunds = isPostgres
    ? await Refund.findAll({
        attributes: [
          [
            Sequelize.fn("SUM", Sequelize.cast(Sequelize.col("amount"), "numeric")),
            "total",
          ],
        ],
        where: { refundStatus: "processed" },
        raw: true,
      }).then((result) => parseFloat(result[0]?.total || 0))
    : await Refund.sum("amount", {
        where: { refundStatus: "processed" },
      });

  const totalCases = await Case.count();
  const totalCompleted = await Case.count({
    where: { caseStatus: "completed" },
  });
  const totalCancelled = await Case.count({
    where: { caseStatus: "cancelled" },
  });

  const monthExpr = isPostgres 
    ? Sequelize.literal(`EXTRACT(MONTH FROM "User"."createdAt")`)
    : Sequelize.fn("MONTH", Sequelize.col("createdAt"));
  
  const groupByMonth = isPostgres 
    ? Sequelize.literal(`EXTRACT(MONTH FROM "User"."createdAt")`)
    : Sequelize.literal(`MONTH(createdAt)`);

  const usersOverview = await User.findAll({
    attributes: [
      [monthExpr, "month"],
      [Sequelize.fn("COUNT", Sequelize.col("userId")), "totalUsers"],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(`CASE WHEN "userType"='inspector' THEN 1 ELSE 0 END`)
        ),
        "totalInspectors",
      ],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(`CASE WHEN "userType"='tenant' THEN 1 ELSE 0 END`)
        ),
        "totalTenants",
      ],
    ],
    group: [groupByMonth],
    raw: true,
  });

  const paymentMonthExpr = isPostgres
    ? Sequelize.literal(`EXTRACT(MONTH FROM "Payment"."paymentDate")`)
    : Sequelize.fn("MONTH", Sequelize.col("paymentDate"));

  const refundSubquery = isPostgres
    ? `(SELECT COALESCE(SUM(CAST("amount" AS numeric)), 0)::numeric FROM "Refund" WHERE EXTRACT(MONTH FROM "Refund"."requestDate") = EXTRACT(MONTH FROM "Payment"."paymentDate") AND EXTRACT(YEAR FROM "Refund"."requestDate") = EXTRACT(YEAR FROM "Payment"."paymentDate"))`
    : `(SELECT COALESCE(SUM(amount), 0) FROM Refund WHERE MONTH(requestDate) = MONTH(Payment.paymentDate) AND YEAR(requestDate) = YEAR(Payment.paymentDate))`;

  const groupByPaymentMonth = isPostgres
    ? Sequelize.literal(`EXTRACT(MONTH FROM "Payment"."paymentDate")`)
    : Sequelize.literal(`MONTH(paymentDate)`);

  const revenueOverview = await Payment.findAll({
    attributes: [
      [paymentMonthExpr, "month"],
      [
        Sequelize.fn(
          "SUM",
          isPostgres
            ? Sequelize.cast(Sequelize.col("paymentAmount"), "numeric")
            : Sequelize.col("paymentAmount")
        ),
        "totalRevenue",
      ],
      [
        Sequelize.fn(
          "MAX",
          isPostgres
            ? Sequelize.cast(Sequelize.literal(`(${refundSubquery})`), "numeric")
            : Sequelize.literal(`(${refundSubquery})`)
        ),
        "totalRefunds",
      ],
    ],
    group: [groupByPaymentMonth],
    raw: true,
  });

  const caseMonthExpr = isPostgres
    ? Sequelize.literal(`EXTRACT(MONTH FROM "Case"."createdAt")`)
    : Sequelize.fn("MONTH", Sequelize.col("createdAt"));

  const groupByCaseMonth = isPostgres
    ? Sequelize.literal(`EXTRACT(MONTH FROM "Case"."createdAt")`)
    : Sequelize.literal(`MONTH(createdAt)`);

  const casesOverview = await Case.findAll({
    attributes: [
      [caseMonthExpr, "month"],
      [Sequelize.fn("COUNT", Sequelize.col("caseId")), "totalCases"],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(
            `CASE WHEN "caseStatus"='completed' THEN 1 ELSE 0 END`
          )
        ),
        "totalCompleted",
      ],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal(
            `CASE WHEN "caseStatus"='cancelled' THEN 1 ELSE 0 END`
          )
        ),
        "totalCancelled",
      ],
    ],
    group: [groupByCaseMonth],
    raw: true,
  });

  return {
    totalUsers,
    totalInspectors,
    totalTenants,
    totalLandlords,
    totalRevenue,
    totalPayouts,
    totalRefunds,
    totalCases,
    totalCompleted,
    totalCancelled,
    overviewGraphs: {
      users: usersOverview,
      revenue: revenueOverview.map((r) => ({
        ...r,
        totalRevenue: parseFloat(r.totalRevenue || 0),
        totalRefunds: parseFloat(r.totalRefunds || 0),
        totalPayouts: parseFloat(totalPayouts || 0),
      })),
      cases: casesOverview,
    },
  };
};

const getAllAdmins = async ({
  search,
  status,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  reqUserId,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = {
    userType: { [Op.in]: ["admin", "sub-admin"] },
  };

  if (search) {
    whereClause[Op.or] = [
      { userFirstName: { [Op.like]: `%${search}%` } },
      { userLastName: { [Op.like]: `%${search}%` } },
      { userEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) {
    whereClause.userStatus = status;
  }
  if (reqUserId) {
    whereClause.userId = { [Op.not]: reqUserId };
  }

  const { rows: admins, count: totalAdmins } = await User.findAndCountAll({
    where: whereClause,
    attributes: [
      ["userId", "adminId"],
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userStatus", "status"],
      ["createdAt", "dateRegistered"],
    ],
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder]],
  });

  return {
    admins,
    totalAdmins,
    totalPages: Math.ceil(totalAdmins / limit),
    currentPage: parseInt(page),
  };
};

const getAdminById = async (adminId) => {
  return await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
    attributes: [
      ["userId", "adminId"],
      ["userFirstName", "firstName"],
      ["userLastName", "lastName"],
      ["userEmail", "email"],
      ["userStatus", "status"],
      ["createdAt", "dateRegistered"],
    ],
  });
};

const updateAdmin = async (adminId, { firstName, lastName, email }) => {
  const admin = await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
  });
  if (!admin) return null;

  await admin.update({
    userFirstName: firstName || admin.userFirstName,
    userLastName: lastName || admin.userLastName,
    userEmail: email || admin.userEmail,
  });

  return await User.findOne({
    where: { userId: adminId },
    attributes: { exclude: ["userPassword"] },
  });
};

const deleteAdmin = async (adminId) => {
  const admin = await User.findOne({
    where: { userId: adminId, userType: "sub-admin" },
  });
  if (!admin) return null;

  await admin.destroy();
  return admin;
};

const generateDashboardCSV = (dashboardData) => {
  const keyMap = {
    totalUsers: "Total Users",
    totalInspectors: "Total Inspectors",
    totalTenants: "Total Tenants",
    totalLandlords: "Total Landlords",
    totalRevenue: "Total Revenue",
    totalPayouts: "Total Payouts",
    totalRefunds: "Total Refunds",
    totalCases: "Total Cases",
    totalCompleted: "Total Completed Cases",
    totalCancelled: "Total Cancelled Cases",
  };

  const formattedData = [
    Object.fromEntries(
      Object.entries(dashboardData).map(([key, value]) => [
        keyMap[key] || key,
        value || "N/A",
      ])
    ),
  ];

  const fields = Object.values(keyMap);

  const parser = new Parser({ fields });
  return parser.parse(formattedData);
};

const generateDashboardPDF = (dashboardData, res) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=dashboard_report.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);

      doc.fontSize(18).text("Admin Dashboard Report", { align: "center" });
      doc.moveDown();

      Object.keys(dashboardData).forEach((key) => {
        doc.fontSize(12).text(`${key}: ${dashboardData[key] || "N/A"}`);
        doc.moveDown(0.5);
      });

      doc.end();
      res.on("finish", resolve);
    } catch (error) {
      reject(error);
    }
  });
};

const updateInspectorDetails = async (inspectorId, data) => {
  const inspector = await User.findOne({
    where: { userId: inspectorId, userType: "inspector" },
  });

  if (!inspector) return { success: false, message: "Inspector not found" };

  const {
    userFirstName,
    userLastName,
    userEmail,
    userPhone,
    userCity,
    userPostcode,
    userAddress,
    userCountry,
    userGender,
    expertiseCodes,
  } = data;

  await inspector.update({
    userFirstName,
    userLastName,
    userEmail,
    userPhone,
    userCity,
    userPostcode,
    userAddress,
    userCountry,
    userGender,
  });

  if (Array.isArray(expertiseCodes)) {
    await UserExpertise.destroy({ where: { userId: inspectorId } });
    const expertiseLinks = expertiseCodes.map((code) => ({
      userId: inspectorId,
      expertiseCode: code,
    }));
    await UserExpertise.bulkCreate(expertiseLinks);
  }

  return { success: true, data: inspector };
};

const getPerformanceMetrics = async ({ startDate, endDate }) => {
  const isPostgres = sequelize.getDialect() === "postgres";
  
  // Build where clause for date filtering
  const caseWhereClause = {};
  if (startDate && endDate) {
    caseWhereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // Case Metrics
  const totalSubmitted = await Case.count({ where: caseWhereClause });
  const totalCompleted = await Case.count({
    where: {
      ...caseWhereClause,
      caseStatus: "completed",
    },
  });
  const totalCanceled = await Case.count({
    where: {
      ...caseWhereClause,
      caseStatus: "cancelled",
    },
  });

  // Calculate average resolution time (in days)
  const completedCases = await Case.findAll({
    where: {
      ...caseWhereClause,
      caseStatus: "completed",
      caseCompletedDate: { [Op.ne]: null },
    },
    attributes: [
      "caseId",
      "createdAt",
      "caseCompletedDate",
    ],
    raw: true,
  });

  let averageResolutionTime = 0;
  if (completedCases.length > 0) {
    const totalDays = completedCases.reduce((sum, caseItem) => {
      const created = new Date(caseItem.createdAt);
      const completed = new Date(caseItem.caseCompletedDate);
      const days = (completed - created) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    averageResolutionTime = totalDays / completedCases.length;
  }

  // Inspector Performance - Get all inspectors and their stats
  const inspectors = await User.findAll({
    where: { userType: "inspector" },
    attributes: ["userId", "userFirstName", "userLastName"],
  });

  const formattedInspectorPerformance = await Promise.all(
    inspectors.map(async (inspector) => {
      const inspectorId = inspector.userId;
      
      // Count cases handled by this inspector
      const casesHandled = await Case.count({
        where: {
          inspectorId,
          ...caseWhereClause,
        },
      });

      // Calculate total earnings
      const earningsWhereClause = { inspectorId };
      if (startDate && endDate) {
        earningsWhereClause.paymentDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const totalEarnings = isPostgres
        ? await InspectorPayment.findAll({
            attributes: [
              [
                Sequelize.fn(
                  "SUM",
                  Sequelize.cast(Sequelize.col("paymentAmount"), "numeric")
                ),
                "total",
              ],
            ],
            where: {
              ...earningsWhereClause,
              paymentStatus: "processed",
            },
            raw: true,
          }).then((result) => parseFloat(result[0]?.total || 0))
        : await InspectorPayment.sum("paymentAmount", {
            where: {
              ...earningsWhereClause,
              paymentStatus: "processed",
            },
          });

      // Calculate time spent (estimate 2 hours per case, or use TrackingTime if available)
      const timeSpentHours = casesHandled * 2;

      return {
        inspectorId,
        inspectorName: `${inspector.userFirstName} ${inspector.userLastName}`,
        casesHandled,
        totalEarnings: parseFloat(totalEarnings || 0),
        timeSpentHours: parseFloat(timeSpentHours.toFixed(2)),
      };
    })
  );

  return {
    caseMetrics: {
      totalSubmitted,
      totalCompleted,
      totalCanceled,
      averageResolutionTime: parseFloat(averageResolutionTime.toFixed(2)),
    },
    inspectorPerformance: formattedInspectorPerformance,
  };
};

const getEarningsReport = async ({ period = "monthly", startDate, endDate }) => {
  const isPostgres = sequelize.getDialect() === "postgres";

  // Build where clause for date filtering
  const paymentWhereClause = { paymentStatus: "processed" };
  const payoutWhereClause = { paymentStatus: "processed" };
  const refundWhereClause = { refundStatus: "processed" };

  if (startDate && endDate) {
    paymentWhereClause.paymentDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
    payoutWhereClause.paymentDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
    refundWhereClause.requestDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // Calculate platform revenue (from tenant payments)
  const platformRevenue = isPostgres
    ? await Payment.findAll({
        attributes: [
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(Sequelize.col("paymentAmount"), "numeric")
            ),
            "total",
          ],
        ],
        where: paymentWhereClause,
        raw: true,
      }).then((result) => parseFloat(result[0]?.total || 0))
    : await Payment.sum("paymentAmount", {
        where: paymentWhereClause,
      });

  // Calculate total payouts (to inspectors)
  const totalPayouts = isPostgres
    ? await InspectorPayment.findAll({
        attributes: [
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(Sequelize.col("paymentAmount"), "numeric")
            ),
            "total",
          ],
        ],
        where: payoutWhereClause,
        raw: true,
      }).then((result) => parseFloat(result[0]?.total || 0))
    : await InspectorPayment.sum("paymentAmount", {
        where: payoutWhereClause,
      });

  // Calculate refunds issued
  const refundsIssued = isPostgres
    ? await Refund.findAll({
        attributes: [
          [
            Sequelize.fn(
              "SUM",
              Sequelize.cast(Sequelize.col("amount"), "numeric")
            ),
            "total",
          ],
        ],
        where: refundWhereClause,
        raw: true,
      }).then((result) => parseFloat(result[0]?.total || 0))
    : await Refund.sum("amount", {
        where: refundWhereClause,
      });

  // Calculate net revenue
  const netRevenue = platformRevenue - totalPayouts - refundsIssued;

  return {
    platformRevenue: parseFloat(platformRevenue || 0),
    totalPayouts: parseFloat(totalPayouts || 0),
    refundsIssued: parseFloat(refundsIssued || 0),
    netRevenue: parseFloat(netRevenue || 0),
  };
};

const exportReport = async ({ reportType, format, period, startDate, endDate, res }) => {
  try {
    let data;
    
    if (reportType === "performance") {
      data = await getPerformanceMetrics({ startDate, endDate });
    } else if (reportType === "earnings") {
      data = await getEarningsReport({ period, startDate, endDate });
    }

    if (format === "csv") {
      const { Parser } = require("json2csv");
      const fields = reportType === "performance"
        ? ["inspectorName", "casesHandled", "totalEarnings", "timeSpentHours"]
        : ["platformRevenue", "totalPayouts", "refundsIssued", "netRevenue"];
      
      const parser = new Parser({ fields });
      const csv = reportType === "performance"
        ? parser.parse(data.inspectorPerformance || [])
        : parser.parse([data]);
      
      res.setHeader("Content-Disposition", `attachment; filename=${reportType}_report.csv`);
      res.setHeader("Content-Type", "text/csv");
      return res.status(200).send(csv);
    }

    if (format === "pdf" || format === "excel") {
      // For PDF/Excel, use similar approach as dashboard export
      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument();
      
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${reportType}_report.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");
      
      doc.pipe(res);
      doc.fontSize(18).text(`${reportType.toUpperCase()} Report`, { align: "center" });
      doc.moveDown();
      
      if (reportType === "performance") {
        doc.fontSize(14).text("Case Metrics", { underline: true });
        doc.fontSize(12).text(`Total Submitted: ${data.caseMetrics?.totalSubmitted || 0}`);
        doc.text(`Total Completed: ${data.caseMetrics?.totalCompleted || 0}`);
        doc.text(`Total Canceled: ${data.caseMetrics?.totalCanceled || 0}`);
        doc.text(`Average Resolution Time: ${data.caseMetrics?.averageResolutionTime || 0} days`);
        doc.moveDown();
        doc.fontSize(14).text("Inspector Performance", { underline: true });
        data.inspectorPerformance?.forEach((inspector) => {
          doc.fontSize(12).text(
            `${inspector.inspectorName}: ${inspector.casesHandled} cases, ${inspector.totalEarnings} kr`
          );
        });
      } else {
        doc.fontSize(12).text(`Platform Revenue: ${data.platformRevenue || 0} kr`);
        doc.text(`Total Payouts: ${data.totalPayouts || 0} kr`);
        doc.text(`Refunds Issued: ${data.refundsIssued || 0} kr`);
        doc.text(`Net Revenue: ${data.netRevenue || 0} kr`);
      }
      
      doc.end();
      return;
    }

    throw new Error("Unsupported format");
  } catch (error) {
    console.error("Error in exportReport:", error);
    throw error;
  }
};

module.exports = {
  getAdminDashboardData,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  generateDashboardCSV,
  generateDashboardPDF,
  updateInspectorDetails,
  getPerformanceMetrics,
  getEarningsReport,
  exportReport,
};
