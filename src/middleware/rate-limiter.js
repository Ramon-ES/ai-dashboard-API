const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient, isRedisConnected } = require('../config/redis');

/**
 * Rate limiting middleware with Redis backend
 * Falls back to in-memory store if Redis is unavailable
 */

/**
 * Create rate limiter with dynamic store selection
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  const limiterConfig = {
    windowMs,
    max,
    message: {
      success: false,
      error: message,
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
  };

  // Use Redis store if available
  if (isRedisConnected()) {
    const redisClient = getRedisClient();
    limiterConfig.store = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:', // Rate limit prefix
    });
    console.log('✓ Rate limiter using Redis store');
  } else {
    console.log('⚠️  Rate limiter using in-memory store (not recommended for production)');
  }

  return rateLimit(limiterConfig);
};

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again in 15 minutes.',
});

/**
 * Strict rate limiter for sensitive endpoints (auth, etc.)
 * 5 requests per 15 minutes
 */
const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts, please try again in 15 minutes.',
  skipSuccessfulRequests: true, // Only count failed requests
});

/**
 * Auth rate limiter (login, register, password reset)
 * 10 requests per hour
 */
const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again in an hour.',
});

/**
 * Upload rate limiter
 * 20 uploads per hour
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many upload requests, please try again in an hour.',
});

/**
 * Admin/Analytics rate limiter
 * 1000 requests per hour (more lenient for internal users)
 */
const adminLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: 'Rate limit exceeded for analytics endpoints.',
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  strictLimiter,
  authLimiter,
  uploadLimiter,
  adminLimiter,
};
