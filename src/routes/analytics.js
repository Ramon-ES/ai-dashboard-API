const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const analyticsService = require('../services/analytics');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: API usage analytics and metrics (Admin only)
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get overall dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics (ISO 8601)
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/dashboard', authenticate, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    const result = await analyticsService.getDashboardStats(companyId, {
      startDate,
      endDate,
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics',
    });
  }
});

/**
 * @swagger
 * /api/analytics/endpoints:
 *   get:
 *     summary: Get endpoint usage summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Endpoint usage summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/endpoints', authenticate, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    const result = await analyticsService.getEndpointSummary(companyId, {
      startDate,
      endDate,
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting endpoint summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get endpoint summary',
    });
  }
});

/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get user activity summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: User activity summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/users', authenticate, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    const result = await analyticsService.getUserActivity(companyId, {
      startDate,
      endDate,
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user activity',
    });
  }
});

/**
 * @swagger
 * /api/analytics/timeline:
 *   get:
 *     summary: Get time-based usage metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, day]
 *         description: Time interval for aggregation
 *     responses:
 *       200:
 *         description: Usage timeline retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/timeline', authenticate, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { startDate, endDate, interval } = req.query;
    const companyId = req.user.companyId;

    const result = await analyticsService.getUsageTimeline(companyId, {
      startDate,
      endDate,
      interval: interval || 'hour',
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting usage timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage timeline',
    });
  }
});

/**
 * @swagger
 * /api/analytics/errors:
 *   get:
 *     summary: Get error logs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for error logs
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for error logs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of error logs to return
 *     responses:
 *       200:
 *         description: Error logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/errors', authenticate, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const companyId = req.user.companyId;

    const result = await analyticsService.getErrorLogs(companyId, {
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 100,
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting error logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get error logs',
    });
  }
});

/**
 * @swagger
 * /api/analytics/performance:
 *   get:
 *     summary: Get performance metrics (response times)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for performance metrics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for performance metrics
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/performance', authenticate, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.user.companyId;

    const result = await analyticsService.getPerformanceMetrics(companyId, {
      startDate,
      endDate,
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
    });
  }
});

/**
 * @swagger
 * /api/analytics/logs:
 *   get:
 *     summary: Get raw usage logs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for logs
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for logs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Maximum number of logs to return
 *     responses:
 *       200:
 *         description: Usage logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/logs', authenticate, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const companyId = req.user.companyId;

    const result = await analyticsService.getUsageStats(companyId, {
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 1000,
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting usage logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage logs',
    });
  }
});

module.exports = router;
