const { BlobServiceClient } = require("@azure/storage-blob");
const path = require("path");

// Initialize Azure Blob Service Client
let blobServiceClient = null;
let containerClient = null;

const initializeAzureStorage = () => {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "utleieskade-images";

    if (!connectionString) {
      console.warn("⚠️  AZURE_STORAGE_CONNECTION_STRING not set. Azure storage disabled.");
      return false;
    }

    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
    
    console.log("✅ Azure Blob Storage initialized");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Azure Blob Storage:", error.message);
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

    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create({
        access: 'blob', // Public read access
      });
      console.log(`✅ Created Azure container: ${process.env.AZURE_STORAGE_CONTAINER_NAME || "utleieskade-images"}`);
    }
    return true;
  } catch (error) {
    console.error("❌ Error ensuring container exists:", error.message);
    return false;
  }
};

// Upload file to Azure Blob Storage
const uploadToAzure = async (fileBuffer, fileName, contentType) => {
  try {
    if (!containerClient) {
      if (!initializeAzureStorage()) {
        throw new Error("Azure storage not initialized");
      }
    }

    await ensureContainerExists();

    // Generate unique blob name with timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const blobName = uniqueFileName.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType || 'application/octet-stream',
      },
    });

    // Get the blob URL
    const blobUrl = blockBlobClient.url;

    console.log(`✅ File uploaded to Azure: ${blobUrl}`);
    return blobUrl;
  } catch (error) {
    console.error("❌ Error uploading to Azure:", error.message);
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

    // Extract blob name from URL
    const urlParts = blobUrl.split('/');
    const blobName = urlParts[urlParts.length - 1];

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();

    console.log(`✅ File deleted from Azure: ${blobName}`);
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

    // Extract blob name from URL
    const urlParts = blobUrl.split('/');
    const blobName = urlParts[urlParts.length - 1];

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
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

