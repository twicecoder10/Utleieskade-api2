const express = require("express");
const fileController = require("../controllers/fileController");
const fileUpload = require("../middlewares/fileUpload");
const { authMiddleware } = require("../middlewares/roleMiddleware");
const { sanitizeFilePath } = require("../middlewares/sanitizeFilePath");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File Upload and Retrieval
 */

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload a file
 *     security:
 *       - BearerAuth: []
 *     tags: [Files]
 *     description: Uploads a file and returns the file path.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload.
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filePath:
 *                   type: string
 *                   example: "https://api.example.com/files/uploads/sample.jpg"
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Internal server error
 */
router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    fileUpload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            status: "error",
            message: "File too large. Maximum size is 5MB.",
          });
        }
        if (err.message && err.message.includes("Invalid file type")) {
          return res.status(400).json({
            status: "error",
            message: err.message,
          });
        }
        return res.status(400).json({
          status: "error",
          message: err.message || "File upload failed",
        });
      }
      next();
    });
  },
  fileController.uploadFile
);

/**
 * @swagger
 * /files/{filePath}:
 *   get:
 *     summary: Retrieve a file
 *     tags: [Files]
 *     description: Fetches a file from the server based on the file path.
 *     parameters:
 *       - in: path
 *         name: filePath
 *         required: true
 *         schema:
 *           type: string
 *         description: The relative path of the file to retrieve.
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.get("/:filePath", sanitizeFilePath, fileController.getFile);

module.exports = router;