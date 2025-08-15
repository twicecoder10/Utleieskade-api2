const { InspectorPayment, User, BankDetails } = require("../models/index");
const { Op, Sequelize } = require("sequelize");
const PDFDocument = require("pdfkit");

const getPayments = async ({
  search,
  status,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (status) whereClause.paymentStatus = status;
  if (search) {
    whereClause[Op.or] = [
      { "$inspector.userFirstName$": { [Op.like]: `%${search}%` } },
      { "$inspector.userLastName$": { [Op.like]: `%${search}%` } },
      { "$inspector.userEmail$": { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows: payments, count: totalPayments } =
    await InspectorPayment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "inspector",
          attributes: [
            ["userFirstName", "firstName"],
            ["userLastName", "lastName"],
            ["userEmail", "email"],
            [
              Sequelize.literal(`(
                SELECT COUNT(*) FROM \`Case\`
                WHERE \`Case\`.\`inspectorId\` = \`inspector\`.\`userId\`
                AND \`Case\`.\`caseStatus\` = 'completed'
              )`),
              "completedCases",
            ],
            [
              Sequelize.literal(`(
                SELECT SUM(paymentAmount) FROM \`InspectorPayment\`
                WHERE \`InspectorPayment\`.\`inspectorId\` = \`inspector\`.\`userId\`
                AND \`InspectorPayment\`.\`paymentStatus\` = 'processed'
              )`),
              "totalPaidAmount",
            ],
          ],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
    });

  return {
    payments,
    totalPayments,
    totalPages: Math.ceil(totalPayments / limit),
    currentPage: parseInt(page),
  };
};

const getPaymentById = async (paymentId) => {
  return await InspectorPayment.findOne({
    where: { paymentId },
    include: [
      {
        model: User,
        as: "inspector",
        attributes: [
          ["userId", "inspectorId"],
          ["userFirstName", "firstName"],
          ["userLastName", "lastName"],
          ["userEmail", "email"],
        ],
        include: [
          {
            model: BankDetails,
            as: "bankDetails",
            attributes: ["bankName", "accountNumber"],
          },
        ],
      },
    ],
    attributes: [
      "paymentId",
      "paymentDate",
      "paymentStatus",
      "rejectionReason",
    ],
  });
};

const approvePayment = async (paymentId) => {
  return await InspectorPayment.update(
    { paymentStatus: "processed" },
    { where: { paymentId } }
  );
};

const rejectPayment = async (paymentId, rejectionReason) => {
  return await InspectorPayment.update(
    { paymentStatus: "rejected", rejectionReason },
    { where: { paymentId } }
  );
};

const generatePaymentReportPDF = async (paymentId, res) => {
  const payment = await getPaymentById(paymentId);
  if (!payment) throw new Error("Payment not found");

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=payment_report_${paymentId}.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);

      doc.fontSize(18).text("Payment Report", { align: "center" });
      doc.moveDown();

      doc.fontSize(12).text(`Payment ID: ${payment.paymentId}`);
      doc.text(`Payment Date: ${payment.paymentDate}`);
      doc.text(`Status: ${payment.paymentStatus}`);
      if (payment.rejectionReason)
        doc.text(`Rejection Reason: ${payment.rejectionReason}`);
      doc.moveDown();

      if (payment.inspector) {
        doc.text(
          `Inspector: ${payment.inspector.firstName} ${payment.inspector.lastName}`
        );
        doc.text(`Email: ${payment.inspector.email}`);
        if (payment.inspector.bankDetails) {
          doc.text(
            `Bank: ${payment.inspector.bankDetails.bankName || ""}`
          );
          doc.text(
            `Account: ${payment.inspector.bankDetails.accountNumber || ""}`
          );
        }
      }

      doc.end();
      res.on("finish", resolve);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getPayments,
  approvePayment,
  rejectPayment,
  getPaymentById,
  generatePaymentReportPDF,
};
