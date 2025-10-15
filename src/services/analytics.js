const { db } = require('../config/firebase');

/**
 * Analytics service for querying API usage data
 */

/**
 * Get usage statistics for a date range
 */
const getUsageStats = async (companyId, options = {}) => {
  try {
    const {
      startDate,
      endDate = new Date().toISOString(),
      limit = 1000,
    } = options;

    let query = db.collection('api_usage_logs');

    // Filter by company if provided
    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }

    // Filter by date range
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    query = query.where('timestamp', '<=', endDate);

    // Order and limit
    query = query.orderBy('timestamp', 'desc').limit(limit);

    const snapshot = await query.get();
    const logs = [];

    snapshot.forEach(doc => {
      logs.push(doc.data());
    });

    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
};

/**
 * Get endpoint usage summary
 */
const getEndpointSummary = async (companyId, options = {}) => {
  try {
    const { startDate, endDate = new Date().toISOString() } = options;

    let query = db.collection('api_usage_logs');

    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    query = query.where('timestamp', '<=', endDate);

    const snapshot = await query.get();

    // Aggregate by endpoint
    const endpointStats = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const endpoint = data.baseEndpoint || data.endpoint;

      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {
          endpoint,
          totalCalls: 0,
          totalResponseTime: 0,
          successCount: 0,
          errorCount: 0,
          avgResponseTime: 0,
          methods: {},
        };
      }

      const stats = endpointStats[endpoint];
      stats.totalCalls++;
      stats.totalResponseTime += data.responseTime || 0;

      if (data.statusCode >= 200 && data.statusCode < 400) {
        stats.successCount++;
      } else {
        stats.errorCount++;
      }

      // Track methods
      if (!stats.methods[data.method]) {
        stats.methods[data.method] = 0;
      }
      stats.methods[data.method]++;
    });

    // Calculate averages and sort
    const summary = Object.values(endpointStats)
      .map(stat => ({
        ...stat,
        avgResponseTime: Math.round(stat.totalResponseTime / stat.totalCalls),
        errorRate: ((stat.errorCount / stat.totalCalls) * 100).toFixed(2) + '%',
      }))
      .sort((a, b) => b.totalCalls - a.totalCalls);

    return {
      success: true,
      data: summary,
      totalEndpoints: summary.length,
    };
  } catch (error) {
    console.error('Error getting endpoint summary:', error);
    throw error;
  }
};

/**
 * Get user activity summary
 */
const getUserActivity = async (companyId, options = {}) => {
  try {
    const { startDate, endDate = new Date().toISOString() } = options;

    let query = db.collection('api_usage_logs');

    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    query = query.where('timestamp', '<=', endDate);

    const snapshot = await query.get();

    // Aggregate by user
    const userStats = {};
    const companyIds = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId || 'anonymous';

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          companyId: data.companyId,
          role: data.userRole,
          totalRequests: 0,
          endpoints: new Set(),
          lastActive: data.timestamp,
        };
      }

      const stats = userStats[userId];
      stats.totalRequests++;
      stats.endpoints.add(data.baseEndpoint || data.endpoint);

      // Track company IDs for lookup
      if (data.companyId) {
        companyIds.add(data.companyId);
      }

      // Track most recent activity
      if (data.timestamp > stats.lastActive) {
        stats.lastActive = data.timestamp;
      }
    });

    // Fetch company names for all companies
    const companyNames = {};
    if (companyIds.size > 0) {
      const companiesSnapshot = await db.collection('companies')
        .where('__name__', 'in', Array.from(companyIds))
        .get();

      companiesSnapshot.forEach(doc => {
        const companyData = doc.data();
        companyNames[doc.id] = companyData.name || doc.id;
      });
    }

    // Convert sets to counts and add company names
    const summary = Object.values(userStats)
      .map(stat => ({
        ...stat,
        companyName: stat.companyId ? (companyNames[stat.companyId] || stat.companyId) : 'N/A',
        uniqueEndpoints: stat.endpoints.size,
        endpoints: undefined, // Remove the Set object
      }))
      .sort((a, b) => b.totalRequests - a.totalRequests);

    return {
      success: true,
      data: summary,
      totalUsers: summary.length,
    };
  } catch (error) {
    console.error('Error getting user activity:', error);
    throw error;
  }
};

/**
 * Get time-based usage metrics (hourly/daily aggregation)
 */
const getUsageTimeline = async (companyId, options = {}) => {
  try {
    const {
      startDate,
      endDate = new Date().toISOString(),
      interval = 'hour', // 'hour' or 'day'
    } = options;

    let query = db.collection('api_usage_logs');

    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    query = query.where('timestamp', '<=', endDate);

    const snapshot = await query.get();

    // Aggregate by time interval
    const timeStats = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.timestamp);

      let timeKey;
      if (interval === 'hour') {
        timeKey = `${date.toISOString().slice(0, 13)}:00:00Z`;
      } else {
        timeKey = date.toISOString().slice(0, 10);
      }

      if (!timeStats[timeKey]) {
        timeStats[timeKey] = {
          timestamp: timeKey,
          requests: 0,
          errors: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
        };
      }

      const stats = timeStats[timeKey];
      stats.requests++;
      stats.totalResponseTime += data.responseTime || 0;

      if (data.error) {
        stats.errors++;
      }
    });

    // Calculate averages and sort
    const timeline = Object.values(timeStats)
      .map(stat => ({
        timestamp: stat.timestamp,
        requests: stat.requests,
        errors: stat.errors,
        avgResponseTime: Math.round(stat.totalResponseTime / stat.requests),
        errorRate: ((stat.errors / stat.requests) * 100).toFixed(2) + '%',
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return {
      success: true,
      data: timeline,
      interval,
    };
  } catch (error) {
    console.error('Error getting usage timeline:', error);
    throw error;
  }
};

/**
 * Get error log details
 */
const getErrorLogs = async (companyId, options = {}) => {
  try {
    const {
      startDate,
      endDate = new Date().toISOString(),
      limit = 100,
    } = options;

    let query = db.collection('api_usage_logs').where('error', '==', true);

    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    query = query.where('timestamp', '<=', endDate);

    query = query.orderBy('timestamp', 'desc').limit(limit);

    const snapshot = await query.get();
    const errors = [];

    snapshot.forEach(doc => {
      errors.push(doc.data());
    });

    return {
      success: true,
      data: errors,
      count: errors.length,
    };
  } catch (error) {
    console.error('Error getting error logs:', error);
    throw error;
  }
};

/**
 * Get performance metrics (slowest endpoints)
 */
const getPerformanceMetrics = async (companyId, options = {}) => {
  try {
    const {
      startDate,
      endDate = new Date().toISOString(),
      limit = 1000,
    } = options;

    let query = db.collection('api_usage_logs');

    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    query = query.where('timestamp', '<=', endDate).limit(limit);

    const snapshot = await query.get();

    // Aggregate by endpoint
    const endpointPerf = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const endpoint = data.baseEndpoint || data.endpoint;

      if (!endpointPerf[endpoint]) {
        endpointPerf[endpoint] = {
          endpoint,
          calls: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
          responseTimes: [],
        };
      }

      const perf = endpointPerf[endpoint];
      const time = data.responseTime || 0;

      perf.calls++;
      perf.totalTime += time;
      perf.minTime = Math.min(perf.minTime, time);
      perf.maxTime = Math.max(perf.maxTime, time);
      perf.responseTimes.push(time);
    });

    // Calculate percentiles and sort by avg response time
    const metrics = Object.values(endpointPerf)
      .map(perf => {
        const sorted = perf.responseTimes.sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];

        return {
          endpoint: perf.endpoint,
          calls: perf.calls,
          avgResponseTime: Math.round(perf.totalTime / perf.calls),
          minResponseTime: perf.minTime,
          maxResponseTime: perf.maxTime,
          p50ResponseTime: p50,
          p95ResponseTime: p95,
          p99ResponseTime: p99,
        };
      })
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime);

    return {
      success: true,
      data: metrics,
      count: metrics.length,
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    throw error;
  }
};

/**
 * Get overall dashboard stats
 */
const getDashboardStats = async (companyId, options = {}) => {
  try {
    const { startDate, endDate = new Date().toISOString() } = options;

    let query = db.collection('api_usage_logs');

    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    query = query.where('timestamp', '<=', endDate);

    const snapshot = await query.get();

    let totalRequests = 0;
    let totalErrors = 0;
    let authErrors = 0;
    let clientErrors = 0;
    let serverErrors = 0;
    let totalResponseTime = 0;
    const uniqueUsers = new Set();
    const uniqueEndpoints = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      totalRequests++;

      if (data.error) {
        totalErrors++;

        // Count by error type
        if (data.isAuthError || data.errorType === 'auth') {
          authErrors++;
        } else if (data.isServerError || data.errorType === 'server') {
          serverErrors++;
        } else if (data.isClientError || data.errorType === 'client') {
          clientErrors++;
        }
      }

      totalResponseTime += data.responseTime || 0;

      if (data.userId) {
        uniqueUsers.add(data.userId);
      }

      uniqueEndpoints.add(data.baseEndpoint || data.endpoint);
    });

    // Calculate rates excluding auth errors for meaningful error rate
    const nonAuthErrors = serverErrors + (clientErrors - authErrors);
    const meaningfulErrorRate = totalRequests > 0 ? ((nonAuthErrors / totalRequests) * 100).toFixed(2) + '%' : '0%';

    return {
      success: true,
      data: {
        totalRequests,
        totalErrors,
        authErrors,
        clientErrors,
        serverErrors,
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) + '%' : '0%',
        meaningfulErrorRate, // Error rate excluding auth failures
        avgResponseTime: totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
        uniqueUsers: uniqueUsers.size,
        uniqueEndpoints: uniqueEndpoints.size,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};

module.exports = {
  getUsageStats,
  getEndpointSummary,
  getUserActivity,
  getUsageTimeline,
  getErrorLogs,
  getPerformanceMetrics,
  getDashboardStats,
};
