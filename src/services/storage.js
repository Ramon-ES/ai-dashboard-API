const { storage } = require('../config/firebase');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

/**
 * Configure multer for file uploads (memory storage)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * Upload a file to Firebase Storage
 */
const uploadFile = async (file, folder, companyId) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const bucket = storage.bucket();
    const fileId = uuidv4();
    const extension = file.originalname.split('.').pop();
    const fileName = `${folder}/${companyId}/${fileId}.${extension}`;

    const fileUpload = bucket.file(fileName);

    // Create a write stream
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: fileId,
        },
      },
    });

    // Return a promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        // Make the file publicly accessible (optional - adjust based on your security needs)
        // await fileUpload.makePublic();

        // Generate signed URL (expires in 7 days)
        const [url] = await fileUpload.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        resolve({
          success: true,
          data: {
            fileId,
            fileName,
            url,
            contentType: file.mimetype,
            size: file.size,
            originalName: file.originalname,
          },
        });
      });

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 */
const deleteFile = async (fileName) => {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.delete();

    return {
      success: true,
      message: 'File deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get a signed URL for a file
 */
const getSignedUrl = async (fileName, expiresIn = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn,
    });

    return {
      success: true,
      data: {
        url,
      },
    };
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

/**
 * Middleware to handle single file upload
 */
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

/**
 * Middleware to handle multiple file uploads
 */
const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Validate file type
 */
const validateFileType = (file, allowedTypes) => {
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  return true;
};

module.exports = {
  uploadFile,
  deleteFile,
  getSignedUrl,
  uploadSingle,
  uploadMultiple,
  validateFileType,
};
