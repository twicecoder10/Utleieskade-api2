const path = require("path");
const fs = require("fs");
const responseHandler = require("../utils/responseHandler");

exports.uploadFile = async (req, res) => {
  if (!req.file) {
    console.error("Upload error: No file in request");
    responseHandler.setError(400, "No file uploaded.");
    return responseHandler.send(res);
  }

  try {
    // Check if file was actually saved
    if (!fs.existsSync(req.file.path)) {
      console.error("Upload error: File not saved to disk", req.file.path);
      responseHandler.setError(500, "File upload failed. File was not saved.");
      return responseHandler.send(res);
    }

    // Get relative path from uploads directory
    const uploadsDir = path.join(process.cwd(), "uploads");
    const relativeFilePath = path.relative(uploadsDir, req.file.path).replace(/\\/g, "/");
    
    const fileUrl = `${process.env.API_BASE_URL || process.env.UTLEIESKADE_BASE_URL || ""}/files/${relativeFilePath}`;
    
    console.log("File uploaded successfully:", {
      originalName: req.file.originalname,
      savedPath: req.file.path,
      fileUrl: fileUrl,
      size: req.file.size,
    });

    responseHandler.setSuccess(201, {
      filePath: fileUrl,
    });
    return responseHandler.send(res);
  } catch (error) {
    console.error("Upload error:", error);
    responseHandler.setError(500, error.message || "Failed to upload file");
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
