const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireCompanyAccess, requireWrite } = require('../middleware/rbac');
const { validateData, sanitizeData } = require('../utils/validator');
const firestoreService = require('../services/firestore');
const storageService = require('../services/storage');

const COLLECTION = 'environments';
const TYPE = 'environment';

/**
 * @swagger
 * /api/environments:
 *   get:
 *     summary: Get all environments
 *     description: Retrieve all virtual environments for your company
 *     tags: [Environments]
 *     responses:
 *       200:
 *         description: List of environments
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
 *                     $ref: '#/components/schemas/Environment'
 *                 count:
 *                   type: integer
 *   post:
 *     summary: Create a new environment
 *     description: Create a new virtual environment
 *     tags: [Environments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - status
 *             properties:
 *               name:
 *                 type: string
 *                 example: Corporate Office
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               ambientAudio:
 *                 type: string
 *     responses:
 *       201:
 *         description: Environment created successfully
 */
router.get('/', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const result = await firestoreService.getAll(COLLECTION, req.companyId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching environments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environments',
    });
  }
});

/**
 * @swagger
 * /api/environments/{id}:
 *   get:
 *     summary: Get environment by ID
 *     tags: [Environments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Environment details
 *   put:
 *     summary: Update environment
 *     tags: [Environments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Environment updated successfully
 *   delete:
 *     summary: Delete environment
 *     tags: [Environments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Environment deleted successfully
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
    console.error('Error fetching environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environment',
    });
  }
});

/**
 * POST /api/environments
 * Create a new environment
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

    // Create the environment
    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.create(COLLECTION, sanitized, userId, req.companyId);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create environment',
    });
  }
});

/**
 * PUT /api/environments/:id
 * Update an environment
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

    // Update the environment
    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.update(COLLECTION, id, sanitized, userId, req.companyId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update environment',
    });
  }
});

/**
 * DELETE /api/environments/:id
 * Delete an environment
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
    console.error('Error deleting environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete environment',
    });
  }
});

/**
 * @swagger
 * /api/environments/{id}/duplicate:
 *   post:
 *     summary: Duplicate environment
 *     description: Create a copy of an existing environment
 *     tags: [Environments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Environment duplicated successfully
 *       404:
 *         description: Environment not found
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
    console.error('Error duplicating environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate environment',
    });
  }
});

/**
 * @swagger
 * /api/environments/{id}/image:
 *   post:
 *     summary: Upload environment image
 *     description: Upload an image for an environment
 *     tags: [Environments]
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
 *         description: Environment not found
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
      const uploadResult = await storageService.uploadFile(file, 'environments', req.companyId);

      // Update the environment with the image URL
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
      console.error('Error uploading environment image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image',
      });
    }
  }
);

module.exports = router;
