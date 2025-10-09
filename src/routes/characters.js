const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireCompanyAccess, requireWrite } = require('../middleware/rbac');
const { validateData, sanitizeData } = require('../utils/validator');
const firestoreService = require('../services/firestore');
const storageService = require('../services/storage');

const COLLECTION = 'characters';
const TYPE = 'character';

/**
 * @swagger
 * /api/characters:
 *   get:
 *     summary: Get all characters
 *     description: Retrieve all AI characters for your company
 *     tags: [Characters]
 *     responses:
 *       200:
 *         description: List of characters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Character'
 *                 count:
 *                   type: integer
 */
router.get('/', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const result = await firestoreService.getAll(COLLECTION, req.companyId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch characters',
    });
  }
});

/**
 * @swagger
 * /api/characters/{id}:
 *   get:
 *     summary: Get character by ID
 *     description: Retrieve a specific character
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Character ID
 *     responses:
 *       200:
 *         description: Character details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Character'
 *       404:
 *         description: Character not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await firestoreService.getById(COLLECTION, id, req.companyId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch character',
    });
  }
});

/**
 * @swagger
 * /api/characters:
 *   post:
 *     summary: Create a new character
 *     description: Create a new AI character
 *     tags: [Characters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - voiceId
 *               - status
 *             properties:
 *               name:
 *                 type: string
 *                 example: John - Tech Support
 *               description:
 *                 type: string
 *                 example: Technical support specialist
 *               voiceId:
 *                 type: string
 *                 example: voice-male-02
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: draft
 *               personality:
 *                 type: string
 *                 example: Technical, helpful, patient
 *     responses:
 *       201:
 *         description: Character created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Character'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.post('/', authenticate, requireCompanyAccess, requireWrite, async (req, res) => {
  try {
    const data = req.body;

    // Validate data against schema
    const validation = validateData(TYPE, data, false);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Sanitize data
    const sanitized = sanitizeData(TYPE, data);

    // Create the character
    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.create(COLLECTION, sanitized, userId, req.companyId);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create character',
    });
  }
});

/**
 * @swagger
 * /api/characters/{id}:
 *   put:
 *     summary: Update character
 *     description: Update an existing character
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               personality:
 *                 type: string
 *     responses:
 *       200:
 *         description: Character updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Character'
 */
router.put('/:id', authenticate, requireCompanyAccess, requireWrite, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Validate data
    const validation = validateData(TYPE, data, true);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Sanitize data
    const sanitized = sanitizeData(TYPE, data);

    // Update the character
    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.update(COLLECTION, id, sanitized, userId, req.companyId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update character',
    });
  }
});

/**
 * @swagger
 * /api/characters/{id}:
 *   delete:
 *     summary: Delete character
 *     description: Delete a character permanently
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Character deleted successfully
 *       404:
 *         description: Character not found
 */
router.delete('/:id', authenticate, requireCompanyAccess, requireWrite, async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.deleteDoc(COLLECTION, id, userId, req.companyId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete character',
    });
  }
});

/**
 * @swagger
 * /api/characters/{id}/duplicate:
 *   post:
 *     summary: Duplicate character
 *     description: Create a copy of an existing character
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Character duplicated successfully
 *       404:
 *         description: Character not found
 */
router.post('/:id/duplicate', authenticate, requireCompanyAccess, requireWrite, async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.duplicate(COLLECTION, id, userId, req.companyId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error duplicating character:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate character',
    });
  }
});

/**
 * @swagger
 * /api/characters/{id}/image:
 *   post:
 *     summary: Upload character image
 *     description: Upload an image for a character
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, or WebP)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     fileName:
 *                       type: string
 *       400:
 *         description: No file provided or invalid file type
 *       404:
 *         description: Character not found
 */
router.post(
  '/:id/image',
  authenticate,
  requireCompanyAccess,
  requireWrite,
  storageService.uploadSingle('image'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      try {
        storageService.validateFileType(file, allowedTypes);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      // Upload to Firebase Storage
      const uploadResult = await storageService.uploadFile(file, 'characters', req.companyId);

      // Update the character with the image URL
      const userId = req.user?.uid || req.apiClient?.name || 'system';
      const updateResult = await firestoreService.update(
        COLLECTION,
        id,
        { image: uploadResult.data.url, imageFileName: uploadResult.data.fileName },
        userId,
        req.companyId
      );

      if (!updateResult.success) {
        await storageService.deleteFile(uploadResult.data.fileName);
        return res.status(404).json(updateResult);
      }

      res.json({
        success: true,
        data: uploadResult.data,
      });
    } catch (error) {
      console.error('Error uploading character image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image',
      });
    }
  }
);

/**
 * @swagger
 * /api/characters/{id}/knowledge-files:
 *   post:
 *     summary: Upload knowledge files for character
 *     description: Upload PDF, TXT, DOC, or DOCX files to give the character knowledge
 *     tags: [Characters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Knowledge files (PDF, TXT, DOC, DOCX - max 10 files)
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                       fileName:
 *                         type: string
 *       400:
 *         description: No files provided or invalid file type
 *       404:
 *         description: Character not found
 */
router.post(
  '/:id/knowledge-files',
  authenticate,
  requireCompanyAccess,
  requireWrite,
  storageService.uploadMultiple('files', 10),
  async (req, res) => {
    try {
      const { id } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided',
        });
      }

      // Validate file types
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      const uploadedFiles = [];

      // Upload all files
      for (const file of files) {
        try {
          storageService.validateFileType(file, allowedTypes);
          const uploadResult = await storageService.uploadFile(file, 'knowledge', req.companyId);
          uploadedFiles.push(uploadResult.data);
        } catch (error) {
          // Clean up already uploaded files if one fails
          for (const uploaded of uploadedFiles) {
            await storageService.deleteFile(uploaded.fileName);
          }
          return res.status(400).json({
            success: false,
            error: error.message,
          });
        }
      }

      // Get existing character data to append files
      const character = await firestoreService.getById(COLLECTION, id, req.companyId);
      if (!character.success) {
        // Clean up uploaded files
        for (const uploaded of uploadedFiles) {
          await storageService.deleteFile(uploaded.fileName);
        }
        return res.status(404).json(character);
      }

      const existingFiles = character.data.knowledgeFiles || [];
      const updatedFiles = [...existingFiles, ...uploadedFiles];

      // Update character with new files
      const userId = req.user?.uid || req.apiClient?.name || 'system';
      const updateResult = await firestoreService.update(
        COLLECTION,
        id,
        { knowledgeFiles: updatedFiles },
        userId,
        req.companyId
      );

      if (!updateResult.success) {
        // Clean up uploaded files
        for (const uploaded of uploadedFiles) {
          await storageService.deleteFile(uploaded.fileName);
        }
        return res.status(404).json(updateResult);
      }

      res.json({
        success: true,
        data: uploadedFiles,
      });
    } catch (error) {
      console.error('Error uploading knowledge files:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload files',
      });
    }
  }
);

module.exports = router;
