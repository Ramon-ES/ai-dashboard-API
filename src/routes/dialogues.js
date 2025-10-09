const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireCompanyAccess, requireWrite } = require('../middleware/rbac');
const { validateData, sanitizeData } = require('../utils/validator');
const firestoreService = require('../services/firestore');

const COLLECTION = 'dialogues';
const TYPE = 'dialogue';

/**
 * @swagger
 * /api/dialogues:
 *   get:
 *     summary: Get all dialogues
 *     description: Retrieve all conversation dialogues for your company
 *     tags: [Dialogues]
 *     responses:
 *       200:
 *         description: List of dialogues
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
 *                     $ref: '#/components/schemas/Dialogue'
 *                 count:
 *                   type: integer
 *   post:
 *     summary: Create a new dialogue
 *     description: Create a new conversation flow
 *     tags: [Dialogues]
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
 *                 example: Customer Complaint Resolution
 *               description:
 *                 type: string
 *                 example: Flow for handling customer complaints
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               nodes:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Dialogue created successfully
 *       400:
 *         description: Validation error
 */
router.get('/', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const result = await firestoreService.getAll(COLLECTION, req.companyId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching dialogues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dialogues',
    });
  }
});

/**
 * @swagger
 * /api/dialogues/{id}:
 *   get:
 *     summary: Get dialogue by ID
 *     description: Retrieve a specific dialogue
 *     tags: [Dialogues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dialogue details
 *       404:
 *         description: Dialogue not found
 *   put:
 *     summary: Update dialogue
 *     description: Update an existing dialogue
 *     tags: [Dialogues]
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
 *     responses:
 *       200:
 *         description: Dialogue updated successfully
 *   delete:
 *     summary: Delete dialogue
 *     description: Delete a dialogue permanently
 *     tags: [Dialogues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dialogue deleted successfully
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
    console.error('Error fetching dialogue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dialogue',
    });
  }
});

/**
 * POST /api/dialogues
 * Create a new dialogue
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

    // Create the dialogue
    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.create(COLLECTION, sanitized, userId, req.companyId);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating dialogue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create dialogue',
    });
  }
});

/**
 * PUT /api/dialogues/:id
 * Update a dialogue
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

    // Update the dialogue
    const userId = req.user?.uid || req.apiClient?.name || 'system';
    const result = await firestoreService.update(COLLECTION, id, sanitized, userId, req.companyId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating dialogue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dialogue',
    });
  }
});

/**
 * DELETE /api/dialogues/:id
 * Delete a dialogue
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
    console.error('Error deleting dialogue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete dialogue',
    });
  }
});

/**
 * @swagger
 * /api/dialogues/{id}/duplicate:
 *   post:
 *     summary: Duplicate dialogue
 *     description: Create a copy of an existing dialogue
 *     tags: [Dialogues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Dialogue duplicated successfully
 *       404:
 *         description: Dialogue not found
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
    console.error('Error duplicating dialogue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate dialogue',
    });
  }
});

module.exports = router;
