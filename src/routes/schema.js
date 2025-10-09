const express = require('express');
const router = express.Router();
const { getSchema, getSchemaTypes, isValidType } = require('../schemas');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/schema:
 *   get:
 *     summary: Get all schema types
 *     description: Get list of available data schema types
 *     tags: [Schemas]
 *     responses:
 *       200:
 *         description: List of schema types
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
 *                     types:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["scenario", "character", "dialogue", "environment"]
 *                     count:
 *                       type: integer
 */
router.get('/', authenticate, (req, res) => {
  try {
    const types = getSchemaTypes();
    res.json({
      success: true,
      data: {
        types,
        count: types.length,
      },
    });
  } catch (error) {
    console.error('Error fetching schema types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schema types',
    });
  }
});

/**
 * @swagger
 * /api/schema/{type}:
 *   get:
 *     summary: Get schema definition
 *     description: Get validation schema for a specific entity type
 *     tags: [Schemas]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [scenario, character, dialogue, environment]
 *         description: Schema type
 *     responses:
 *       200:
 *         description: Schema definition
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
 *                     type:
 *                       type: string
 *                     name:
 *                       type: string
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Schema type not found
 */
router.get('/:type', authenticate, (req, res) => {
  try {
    const { type } = req.params;

    if (!isValidType(type)) {
      return res.status(404).json({
        success: false,
        error: `Schema type '${type}' not found`,
      });
    }

    const schema = getSchema(type);

    res.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schema',
    });
  }
});

module.exports = router;
