const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireCompanyAccess } = require('../middleware/rbac');
const firestoreService = require('../services/firestore');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Get counts of all entity types (scenarios, characters, dialogues, environments)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics
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
 *                     scenarios:
 *                       type: integer
 *                       example: 15
 *                     characters:
 *                       type: integer
 *                       example: 32
 *                     dialogues:
 *                       type: integer
 *                       example: 24
 *                     environments:
 *                       type: integer
 *                       example: 8
 */
router.get('/stats', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const result = await firestoreService.getCounts(req.companyId);

    res.json(result);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
});

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Get recent activity
 *     description: Get recent activity log for the dashboard
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Recent activity list
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
 *                       type:
 *                         type: string
 *                       action:
 *                         type: string
 *                       entityId:
 *                         type: string
 *                       entityName:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 */
router.get('/recent-activity', authenticate, requireCompanyAccess, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await firestoreService.getRecentActivities(req.companyId, limit);

    res.json(result);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity',
    });
  }
});

module.exports = router;
