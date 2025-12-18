const path = require("path");
const fs = require("fs");
const responseHandler = require("../utils/responseHandler");
const { uploadToAzure, isAzureConfigured } = require("../utils/azureStorage");

exports.uploadFile = async (req, res) => {
  if (!req.file) {
    console.error("Upload error: No file in request");
    responseHandler.setError(400, "No file uploaded.");
    return responseHandler.send(res);
  }

  try {
    let fileUrl;

    // Check if Azure storage is configured
    if (isAzureConfigured()) {
      // Upload to Azure Blob Storage
      const fileBuffer = fs.readFileSync(req.file.path);
      fileUrl = await uploadToAzure(
        fileBuffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Delete local file after uploading to Azure
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.warn("⚠️  Could not delete local file after Azure upload:", deleteError.message);
      }
    } else {
      // Fallback to local storage if Azure not configured
      if (!fs.existsSync(req.file.path)) {
        console.error("Upload error: File not saved to disk", req.file.path);
        responseHandler.setError(500, "File upload failed. File was not saved.");
        return responseHandler.send(res);
      }

      // Get relative path from uploads directory
      const uploadsDir = path.join(process.cwd(), "uploads");
      const relativeFilePath = path.relative(uploadsDir, req.file.path).replace(/\\/g, "/");
      
      fileUrl = `${process.env.API_BASE_URL || process.env.UTLEIESKADE_BASE_URL || ""}/files/${relativeFilePath}`;
    }
    
    console.log("File uploaded successfully:", {
      originalName: req.file.originalname,
      fileUrl: fileUrl,
      size: req.file.size,
      storage: isAzureConfigured() ? "Azure Blob Storage" : "Local",
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

    // Check if it's an Azure Blob URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      // If Azure is configured, try to get from Azure
      if (isAzureConfigured()) {
        try {
          const { getFileFromAzure } = require("../utils/azureStorage");
          const fileStream = await getFileFromAzure(filePath);
          fileStream.pipe(res);
          return;
        } catch (azureError) {
          console.error("Error fetching from Azure:", azureError.message);
          // Fall through to try local file
        }
      }
    }

    // Fallback to local file system
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
