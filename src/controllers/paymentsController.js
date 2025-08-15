const paymentService = require("../services/paymentService");
const responseHandler = require("../utils/responseHandler");

exports.getPayments = async (req, res) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const payments = await paymentService.getPayments({
      search,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || "paymentDate",
      sortOrder: sortOrder || "desc",
    });

    responseHandler.setSuccess(
      200,
      "Payments retrieved successfully",
      payments
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId);

    if (!payment) {
      responseHandler.setError(404, "Payment not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(
      200,
      "Payment details retrieved successfully",
      payment
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await paymentService.approvePayment(paymentId);

    if (!result) {
      responseHandler.setError(404, "Payment not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Payment approved successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      responseHandler.setError(400, "Rejection reason is required.");
      return responseHandler.send(res);
    }

    const result = await paymentService.rejectPayment(
      paymentId,
      rejectionReason
    );

    if (!result) {
      responseHandler.setError(404, "Payment not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Payment rejected successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.generatePaymentReport = async (req, res) => {
  try {
    const { paymentId } = req.params;
    await paymentService.generatePaymentReportPDF(paymentId, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
