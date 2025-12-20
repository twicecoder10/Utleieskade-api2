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

    // Check if file was actually saved to disk first
    if (!fs.existsSync(req.file.path)) {
      console.error("Upload error: File not saved to disk", req.file.path);
      responseHandler.setError(500, "File upload failed. File was not saved.");
      return responseHandler.send(res);
    }

    // Try Azure storage first if configured, fallback to local if it fails
    if (isAzureConfigured()) {
      try {
        // Upload to Azure Blob Storage
        const fileBuffer = fs.readFileSync(req.file.path);
        
        // Determine folder based on file type
        // Images go to photos/, PDFs go to Reports/
        const contentType = req.file.mimetype || '';
        const fileName = req.file.originalname || '';
        const isImage = contentType.startsWith('image/');
        const isPdf = contentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
        
        let folder = null;
        if (isImage) {
          folder = 'photos';
        } else if (isPdf) {
          folder = 'Reports';
        }
        
        fileUrl = await uploadToAzure(
          fileBuffer,
          req.file.originalname,
          req.file.mimetype,
          folder
        );

        // Delete local file after successful Azure upload
        try {
          fs.unlinkSync(req.file.path);
          console.log("✅ Local file deleted after Azure upload");
        } catch (deleteError) {
          console.warn("⚠️  Could not delete local file after Azure upload:", deleteError.message);
        }
      } catch (azureError) {
        console.error("❌ Azure upload failed, falling back to local storage:", azureError.message);
        // Fall through to local storage fallback
        fileUrl = null;
      }
    }

    // Fallback to local storage if Azure not configured or failed
    if (!fileUrl) {
      // Get relative path from uploads directory
      const uploadsDir = path.join(process.cwd(), "uploads");
      const relativeFilePath = path.relative(uploadsDir, req.file.path).replace(/\\/g, "/");
      
      const baseUrl = process.env.API_BASE_URL || process.env.UTLEIESKADE_BASE_URL || "";
      fileUrl = baseUrl ? `${baseUrl}/files/${relativeFilePath}` : `/files/${relativeFilePath}`;
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
    let filePath = req.params.filePath;

    // Decode URL-encoded file path
    filePath = decodeURIComponent(filePath);

    // Check if it's an Azure Blob URL (full URL)
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      // For Azure Blob URLs, redirect to the Azure URL directly
      // Azure Blob Storage URLs are publicly accessible if container is set to 'blob' access
      return res.redirect(filePath);
    }

    // Check if it's a relative path that might be an Azure URL (starts with blob.core.windows.net)
    if (filePath.includes('blob.core.windows.net')) {
      // Construct full Azure URL
      const azureUrl = filePath.startsWith('http') ? filePath : `https://${filePath}`;
      return res.redirect(azureUrl);
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
