const expertiseService = require("../services/expertiseService");
const responseHandler = require("../utils/responseHandler");

exports.getExpertises = async (req, res) => {
  try {
    const expertises = await expertiseService.getExpertises(req.query);
    responseHandler.setSuccess(200, "Expertises retrieved successfully", expertises);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.createExpertise = async (req, res) => {
  try {
    const result = await expertiseService.createExpertise(req.body);

    if (!result.success) {
      responseHandler.setError(400, result.message);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(201, result.message, result.expertise);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, "Internal server error");
    return responseHandler.send(res);
  }
};

exports.updateExpertise = async (req, res) => {
  try {
    const { expertiseCode } = req.params;
    const result = await expertiseService.updateExpertise(expertiseCode, req.body);

    if (!result.success) {
      responseHandler.setError(404, result.message);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, result.message, result.expertise);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, "Internal server error");
    return responseHandler.send(res);
  }
};

exports.deleteExpertise = async (req, res) => {
  try {
    const { expertiseCode } = req.params;
    const result = await expertiseService.deleteExpertise(expertiseCode);

    if (!result.success) {
      responseHandler.setError(404, result.message);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, result.message);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, "Internal server error");
    return responseHandler.send(res);
  }
};