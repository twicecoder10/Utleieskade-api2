const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");

// Ensure crypto is available globally (Azure SDK may require it)
// In Node.js, crypto is built-in but may not be globally available in all environments
if (typeof globalThis.crypto === 'undefined') {
  try {
    const crypto = require('crypto');
    // Make crypto available globally for Azure SDK
    if (typeof globalThis.crypto === 'undefined') {
      globalThis.crypto = crypto;
    }
    if (typeof global.crypto === 'undefined') {
      global.crypto = crypto;
    }
  } catch (e) {
    console.warn('⚠️  crypto module not available, Azure operations may fail:', e.message);
  }
}

// Initialize Azure Blob Service Client
let blobServiceClient = null;
let containerClient = null;

const initializeAzureStorage = () => {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "utleieskade-files";

    if (!connectionString) {
      console.warn("⚠️  AZURE_STORAGE_CONNECTION_STRING not set. Azure storage disabled.");
      return false;
    }

    // Validate connection string format
    if (!connectionString.includes('AccountName') || !connectionString.includes('AccountKey')) {
      console.error("❌ Invalid Azure Storage connection string format");
      return false;
    }

    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
    
    console.log(`✅ Azure Blob Storage initialized with container: ${containerName}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Azure Blob Storage:", error.message);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      name: error.name,
      code: error.code,
      message: error.message
    });
    return false;
  }
};

// Ensure container exists
const ensureContainerExists = async () => {
  try {
    if (!containerClient) {
      if (!initializeAzureStorage()) {
        return false;
      }
    }

    // Verify containerClient is properly initialized
    if (!containerClient) {
      throw new Error("Container client is not initialized");
    }

    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create({
        access: 'blob', // Public read access
      });
      console.log(`✅ Created Azure container: ${process.env.AZURE_STORAGE_CONTAINER_NAME || "utleieskade-files"}`);
    }
    return true;
  } catch (error) {
    console.error("❌ Error ensuring container exists:", error.message);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Container client state:", {
      initialized: !!containerClient,
      blobServiceClientInitialized: !!blobServiceClient,
      connectionStringSet: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || "utleieskade-files"
    });
    return false;
  }
};

// Upload file to Azure Blob Storage with folder organization
const uploadToAzure = async (fileBuffer, fileName, contentType, folder = null) => {
  try {
    // Validate input buffer
    if (!fileBuffer) {
      throw new Error("File buffer is required but was null or undefined");
    }
    
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error("fileBuffer must be a Buffer instance");
    }
    
    if (fileBuffer.length === 0) {
      throw new Error("File buffer is empty - cannot upload empty file");
    }

    if (!containerClient) {
      if (!initializeAzureStorage()) {
        throw new Error("Azure storage not initialized - connection string may be missing or invalid");
      }
    }

    const containerExists = await ensureContainerExists();
    if (!containerExists) {
      throw new Error("Failed to ensure Azure container exists");
    }

    // Determine folder based on file type if not specified
    let targetFolder = folder;
    if (!targetFolder) {
      // Detect file type from content type or file extension
      const isImage = contentType && contentType.startsWith('image/');
      const isPdf = contentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      
      if (isImage) {
        targetFolder = 'photos';
      } else if (isPdf) {
        targetFolder = 'Reports';
      }
      // If neither, upload to root (or you can default to a specific folder)
    }

    // Generate unique blob name with timestamp
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    
    // Construct blob path with folder
    const blobName = targetFolder 
      ? `${targetFolder}/${uniqueFileName}` 
      : uniqueFileName;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType || 'application/octet-stream',
      },
    });

    // Get the blob URL
    const blobUrl = blockBlobClient.url;

    // Validate that we got a valid URL
    if (!blobUrl || typeof blobUrl !== 'string' || !blobUrl.startsWith('http')) {
      throw new Error(`Invalid blob URL returned from Azure: ${blobUrl}`);
    }

    console.log(`✅ File uploaded to Azure: ${blobUrl} (folder: ${targetFolder || 'root'}, size: ${fileBuffer.length} bytes)`);
    return blobUrl;
  } catch (error) {
    console.error("❌ Error uploading to Azure:", {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      fileName: fileName,
      folder: folder,
    });
    throw error;
  }
};

// Delete file from Azure Blob Storage
const deleteFromAzure = async (blobUrl) => {
  try {
    if (!containerClient) {
      if (!initializeAzureStorage()) {
        throw new Error("Azure storage not initialized");
      }
    }

    // Extract blob name (including folder path) from URL
    // Azure blob URLs format: https://[account].blob.core.windows.net/[container]/[folder]/[filename]
    const urlParts = blobUrl.split('/');
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "utleieskade-files";
    
    // Find the container name in the URL and get everything after it
    const containerIndex = urlParts.findIndex(part => part === containerName);
    if (containerIndex === -1) {
      // Fallback: if container name not found, use the last part (old behavior)
      const blobName = urlParts[urlParts.length - 1];
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      console.log(`✅ File deleted from Azure: ${blobName}`);
      return true;
    }
    
    // Get the path after container name (includes folder/ and filename)
    const blobPath = urlParts.slice(containerIndex + 1).join('/');
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.delete();

    console.log(`✅ File deleted from Azure: ${blobPath}`);
    return true;
  } catch (error) {
    console.error("❌ Error deleting from Azure:", error.message);
    throw error;
  }
};

// Get file from Azure Blob Storage
const getFileFromAzure = async (blobUrl) => {
  try {
    if (!containerClient) {
      if (!initializeAzureStorage()) {
        throw new Error("Azure storage not initialized");
      }
    }

    // Extract blob path (including folder) from URL
    // Azure blob URLs format: https://[account].blob.core.windows.net/[container]/[folder]/[filename]
    const urlParts = blobUrl.split('/');
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "utleieskade-files";
    
    // Find the container name in the URL and get everything after it
    const containerIndex = urlParts.findIndex(part => part === containerName);
    if (containerIndex === -1) {
      // Fallback: if container name not found, use the last part (old behavior)
      const blobName = urlParts[urlParts.length - 1];
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const downloadResponse = await blockBlobClient.download();
      return downloadResponse.readableStreamBody;
    }
    
    // Get the path after container name (includes folder/ and filename)
    const blobPath = urlParts.slice(containerIndex + 1).join('/');
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    const downloadResponse = await blockBlobClient.download();

    return downloadResponse.readableStreamBody;
  } catch (error) {
    console.error("❌ Error getting file from Azure:", error.message);
    throw error;
  }
};

// Check if Azure storage is configured
const isAzureConfigured = () => {
  return !!process.env.AZURE_STORAGE_CONNECTION_STRING;
};

module.exports = {
  initializeAzureStorage,
  ensureContainerExists,
  uploadToAzure,
  deleteFromAzure,
  getFileFromAzure,
  isAzureConfigured,
};

