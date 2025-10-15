const { createClient } = require('redis');

/**
 * Redis client for rate limiting and caching
 * Falls back gracefully if Redis is not available
 */

let redisClient = null;
let isRedisAvailable = false;

// Initialize Redis client
const initRedis = async () => {
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          // Stop retrying after 3 attempts
          if (retries > 3) {
            console.warn('⚠️  Redis unavailable - rate limiting will use in-memory store');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      isRedisAvailable = false;
    });

    client.on('connect', () => {
      console.log('✓ Redis connected');
      isRedisAvailable = true;
    });

    await client.connect();
    redisClient = client;
    isRedisAvailable = true;

    return client;
  } catch (error) {
    console.warn('⚠️  Redis initialization failed:', error.message);
    console.warn('⚠️  Continuing without Redis - rate limiting will use in-memory store');
    isRedisAvailable = false;
    return null;
  }
};

const getRedisClient = () => redisClient;
const isRedisConnected = () => isRedisAvailable;

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
};
