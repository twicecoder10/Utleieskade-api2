const refundService = require("../services/refundService");
const responseHandler = require("../utils/responseHandler");

exports.getRefunds = async (req, res) => {
  try {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;

    const refunds = await refundService.getRefunds({
      search,
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sortBy: sortBy || "requestDate",
      sortOrder: sortOrder || "desc",
    });

    responseHandler.setSuccess(200, "Refunds retrieved successfully", refunds);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getRefundById = async (req, res) => {
  try {
    const { refundId } = req.params;
    const refund = await refundService.getRefundById(refundId);

    if (!refund) {
      responseHandler.setError(404, "Refund not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(
      200,
      "Refund details retrieved successfully",
      refund
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.approveRefund = async (req, res) => {
  try {
    const { refundId } = req.params;
    const result = await refundService.approveRefund(refundId);

    if (!result) {
      responseHandler.setError(404, "Refund not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Refund approved successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.rejectRefund = async (req, res) => {
  try {
    const { refundId } = req.params;

    const result = await refundService.rejectRefund(refundId);

    if (!result) {
      responseHandler.setError(404, "Refund not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Refund rejected successfully");
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};
