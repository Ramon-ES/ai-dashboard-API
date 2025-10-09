const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireCompanyAccess, requireWrite } = require('../middleware/rbac');
const { validateData, sanitizeData } = require('../utils/validator');
const firestoreService = require('../services/firestore');
const storageService = require('../services/storage');
const { getSchema } = require('../schemas');

const COLLECTION = 'scenarios';
const TYPE = 'scenario';

/**
 * @swagger
 * /api/scenarios:
 *   get:
 *     summary: Get all scenarios
 *     description: Retrieve all scenarios for your company
 *     tags: [Scenarios]
 *     responses:
 *       200:
 *         description: List of scenarios
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
 *                     $ref: '#/components/schemas/Scenario'
 *                 count:
 *                   type: integer
 */
router.get('/', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const result = await firestoreService.getAll(COLLECTION, req.companyId);

    res.json(result);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scenarios',
    });
  }
});

/**
 * @swagger
 * /api/scenarios/{id}:
 *   get:
 *     summary: Get scenario by ID
 *     description: Retrieve a specific scenario
 *     tags: [Scenarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scenario details
 *       404:
 *         description: Scenario not found
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
    console.error('Error fetching scenario:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scenario',
    });
  }
});

/**
 * @swagger
 * /api/scenarios/{id}/full:
 *   get:
 *     summary: Get complete scenario with all details
 *     description: Retrieve scenario with populated dialogue, environment, and character data
 *     tags: [Scenarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complete scenario with all related data
 *       404:
 *         description: Scenario not found
 */
router.get('/:id/full', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = require('../config/firebase');

    // Get the scenario
    const scenarioResult = await firestoreService.getById(COLLECTION, id, req.companyId);
    if (!scenarioResult.success) {
      return res.status(404).json(scenarioResult);
    }

    const scenario = scenarioResult.data;
    const fullScenario = { ...scenario };

    // Populate dialogue if dialogueId exists
    if (scenario.dialogueId) {
      const dialogueResult = await firestoreService.getById('dialogues', scenario.dialogueId, req.companyId);
      if (dialogueResult.success) {
        fullScenario.dialogue = dialogueResult.data;
      }
    }

    // Populate environment if environmentId exists
    if (scenario.environmentId) {
      const environmentResult = await firestoreService.getById('environments', scenario.environmentId, req.companyId);
      if (environmentResult.success) {
        fullScenario.environment = environmentResult.data;
      }
    }

    // Populate characters based on characterRoles array
    if (scenario.characterRoles && Array.isArray(scenario.characterRoles)) {
      fullScenario.characters = [];
      for (const role of scenario.characterRoles) {
        if (role.characterId) {
          const characterResult = await firestoreService.getById('characters', role.characterId, req.companyId);
          if (characterResult.success) {
            fullScenario.characters.push({
              roleId: role.roleId,
              character: characterResult.data
            });
          }
        }
      }
    }

    res.json({
      success: true,
      data: fullScenario
    });
  } catch (error) {
    console.error('Error fetching full scenario:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch full scenario',
    });
  }
});

/**
 * @swagger
 * /api/scenarios:
 *   post:
 *     summary: Create a new scenario
 *     description: Create a new training scenario
 *     tags: [Scenarios]
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
 *                 example: Customer Service Training
 *               description:
 *                 type: string
 *                 example: Handle an upset customer scenario
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: draft
 *               dialogueId:
 *                 type: string
 *               environmentId:
 *                 type: string
 *               characterRoles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     roleId:
 *                       type: string
 *                     characterId:
 *                       type: string
 *     responses:
 *       201:
 *         description: Scenario created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Scenario'
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

    // Sanitize data (remove non-editable fields)
    const sanitized = sanitizeData(TYPE, data);

    // Create the scenario
    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.create(COLLECTION, sanitized, userId, req.companyId);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create scenario',
    });
  }
});

/**
 * @swagger
 * /api/scenarios/{id}:
 *   put:
 *     summary: Update scenario
 *     description: Update an existing scenario
 *     tags: [Scenarios]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scenario updated successfully
 *       404:
 *         description: Scenario not found
 */
router.put('/:id', authenticate, requireCompanyAccess, requireWrite, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Validate data against schema
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

    // Update the scenario
    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.update(COLLECTION, id, sanitized, userId, req.companyId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update scenario',
    });
  }
});

/**
 * @swagger
 * /api/scenarios/{id}:
 *   delete:
 *     summary: Delete scenario
 *     description: Delete a scenario permanently
 *     tags: [Scenarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scenario deleted successfully
 *       404:
 *         description: Scenario not found
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
    console.error('Error deleting scenario:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete scenario',
    });
  }
});

/**
 * @swagger
 * /api/scenarios/{id}/duplicate:
 *   post:
 *     summary: Duplicate scenario
 *     description: Create a copy of an existing scenario
 *     tags: [Scenarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Scenario duplicated successfully
 *       404:
 *         description: Scenario not found
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
    console.error('Error duplicating scenario:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate scenario',
    });
  }
});

/**
 * @swagger
 * /api/scenarios/{id}/image:
 *   post:
 *     summary: Upload scenario image
 *     description: Upload an image for a scenario
 *     tags: [Scenarios]
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
 *         description: Scenario not found
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
      const uploadResult = await storageService.uploadFile(file, 'scenarios', req.companyId);

      // Update the scenario with the image URL
      const userId = req.user?.uid || req.apiClient?.name || 'system';
      const updateResult = await firestoreService.update(
        COLLECTION,
        id,
        { image: uploadResult.data.url, imageFileName: uploadResult.data.fileName },
        userId,
        req.companyId
      );

      if (!updateResult.success) {
        // Clean up uploaded file if update fails
        await storageService.deleteFile(uploadResult.data.fileName);
        return res.status(404).json(updateResult);
      }

      res.json({
        success: true,
        data: uploadResult.data,
      });
    } catch (error) {
      console.error('Error uploading scenario image:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload image',
      });
    }
  }
);

module.exports = router;
