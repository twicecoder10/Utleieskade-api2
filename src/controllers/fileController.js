const path = require("path");
const fs = require("fs");
const responseHandler = require("../utils/responseHandler");

exports.uploadFile = async (req, res) => {
  if (!req.file) {
    responseHandler.setError(400, "No file uploaded.");
    return responseHandler.send(res);
  }

  try {
    const relativeFilePath = req.file.path.replace(/^uploads[\\/]/, "");
    responseHandler.setSuccess(201, {
      filePath: process.env.API_BASE_URL + "/files/" + relativeFilePath,
    });
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(500, error.message);
    return responseHandler.send(res);
  }
};

exports.getFile = async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const absolutePath = path.resolve(`uploads/${filePath}`);

    if (!fs.existsSync(absolutePath)) {
      responseHandler.setError(404, "File not found.");
      return responseHandler.send(res);
    }
    return res.status(200).sendFile(absolutePath);
  } catch (error) {
    console.error("Error fetching file:", error);
    responseHandler.setError(500, "An error occurred while fetching the file.");
    return responseHandler.send(res);
  }
};
