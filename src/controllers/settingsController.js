const inspectorService = require("../services/inspectorService");
const responseHandler = require("../utils/responseHandler");

exports.getBankDetails = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const inspectorsData = await inspectorService.getAllInspectors({
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    responseHandler.setSuccess(
      200,
      "Inspectors retrieved successfully",
      inspectorsData
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};