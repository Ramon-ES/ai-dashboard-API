const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to log API usage metrics to Firestore
 *
 * Tracks:
 * - Endpoint accessed
 * - HTTP method
 * - Response status
 * - Response time
 * - User/Company ID
 * - IP address
 * - User agent
 * - Request size
 * - Response size
 */
const usageLogger = async (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Capture original end function
  const originalEnd = res.end;
  const originalJson = res.json;

  let responseSize = 0;

  // Override res.json to capture response size
  res.json = function(data) {
    responseSize = JSON.stringify(data).length;
    return originalJson.call(this, data);
  };

  // Override res.end to log after response is sent
  res.end = function(chunk, encoding) {
    // Calculate response size if not already set
    if (chunk && !responseSize) {
      responseSize = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Don't log health checks, static files, or swagger docs to reduce noise
    const skipPaths = ['/health', '/favicon.ico', '/api-docs', '.css', '.js', '.json', '.png', '.jpg', '.svg'];
    const shouldSkip = skipPaths.some(path => req.path.includes(path));

    if (!shouldSkip) {
      // Log async (don't block response)
      logUsage({
        id: uuidv4(),
        timestamp,
        method: req.method,
        endpoint: req.path,
        baseEndpoint: extractBaseEndpoint(req.path),
        statusCode: res.statusCode,
        responseTime,
        userId: req.user?.uid || null,
        companyId: req.user?.companyId || null,
        userRole: req.user?.role || null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        requestSize: req.get('content-length') || 0,
        responseSize,
        queryParams: Object.keys(req.query).length > 0 ? req.query : null,
        apiKey: req.headers['x-api-key'] ? 'present' : null,
        error: res.statusCode >= 400 ? true : false,
      }).catch(err => {
        console.error('Error logging usage:', err);
      });
    }

    // Call original end function
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Extract base endpoint pattern (e.g., /api/scenarios/:id -> /api/scenarios)
 */
function extractBaseEndpoint(path) {
  // Remove UUIDs and IDs from path
  const cleaned = path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/[0-9]+/g, '/:id');

  // Get the first two segments (e.g., /api/scenarios)
  const segments = cleaned.split('/').filter(Boolean);
  return segments.length > 2 ? `/${segments.slice(0, 2).join('/')}` : cleaned;
}

/**
 * Log usage data to Firestore
 */
async function logUsage(data) {
  try {
    await db.collection('api_usage_logs').doc(data.id).set(data);
  } catch (error) {
    console.error('Failed to log API usage:', error);
    // Don't throw - logging shouldn't break the API
  }
}

module.exports = usageLogger;
