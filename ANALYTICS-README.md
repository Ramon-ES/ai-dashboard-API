# API Usage Tracking & Analytics

This document describes the comprehensive API usage tracking and analytics system implemented in the AI Dashboard API.

## Features

### 1. Usage Logging
- **Automatic tracking** of all API requests
- Captures:
  - Endpoint and HTTP method
  - Response status and time
  - User and company information
  - Request/response sizes
  - IP address and user agent
  - Error flags

### 2. Analytics Endpoints
Admin-only endpoints for querying usage data:

#### `/api/analytics/dashboard`
Get overall statistics:
- Total requests
- Error rate
- Average response time
- Unique users and endpoints

#### `/api/analytics/endpoints`
Endpoint usage summary with:
- Total calls per endpoint
- Success/error counts
- Average response times
- HTTP methods used

#### `/api/analytics/users`
User activity tracking:
- Requests per user
- Unique endpoints accessed
- Last active timestamp

#### `/api/analytics/timeline`
Time-based metrics (hourly/daily):
- Request volume over time
- Error trends
- Response time trends

#### `/api/analytics/performance`
Performance metrics:
- Average, min, max response times
- P50, P95, P99 percentiles
- Slowest endpoints

#### `/api/analytics/errors`
Recent error logs:
- Failed requests
- Status codes
- Error timestamps

### 3. Rate Limiting
Protects API from abuse with configurable limits:

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per hour
- **Analytics**: 1000 requests per hour (admin users)
- **Uploads**: 20 requests per hour

Rate limiting uses Redis when available, falls back to in-memory store.

### 4. Analytics Dashboard
Web-based visualization at `/analytics`:
- Real-time metrics display
- Filterable by date range
- Tabbed interface for different views
- Authentication required (Firebase token)

## Setup

### 1. Install Dependencies
Already installed:
```bash
npm install redis express-rate-limit rate-limit-redis
```

### 2. Configure Redis (Optional)
Redis provides persistent rate limiting across server restarts.

**Option A: Local Redis**
```bash
# Install Redis (Windows - use WSL or download from Redis website)
# Linux/Mac
brew install redis  # Mac
apt-get install redis  # Ubuntu

# Start Redis
redis-server
```

**Option B: Cloud Redis**
Use a cloud service like:
- Redis Labs
- AWS ElastiCache
- Azure Cache for Redis

Add to `.env`:
```env
REDIS_URL=redis://localhost:6379
# or for cloud: redis://username:password@host:port
```

If Redis is not configured, the system will use an in-memory store with a warning.

### 3. Firestore Collections
The system automatically creates these collections:

**`api_usage_logs`** - Raw usage data
- id, timestamp, method, endpoint
- statusCode, responseTime
- userId, companyId, userRole
- ipAddress, userAgent
- requestSize, responseSize
- error flag

## Usage

### Accessing Analytics Dashboard

1. **Navigate to dashboard**
   ```
   http://localhost:3004/analytics
   # or on production
   https://webplatform.enversedstudios.com/ai-dashboard/analytics
   ```

2. **Authenticate**
   - Get your Firebase ID token (from your app's auth)
   - Enter it in the dashboard login

3. **View metrics**
   - Select time range (1h, 24h, 7d, 30d, custom)
   - Switch between tabs (Endpoints, Users, Performance, Errors)
   - Refresh for latest data

### Using Analytics API

All analytics endpoints require:
- Authentication (Firebase Bearer token)
- Admin or Owner role

**Example: Get dashboard stats**
```bash
curl -X GET \
  'http://localhost:3004/api/analytics/dashboard?startDate=2025-01-01T00:00:00Z&endDate=2025-01-15T23:59:59Z' \
  -H 'Authorization: Bearer YOUR_FIREBASE_TOKEN'
```

**Example: Get endpoint summary**
```bash
curl -X GET \
  'http://localhost:3004/api/analytics/endpoints?startDate=2025-01-14T00:00:00Z' \
  -H 'Authorization: Bearer YOUR_FIREBASE_TOKEN'
```

### Query Parameters

Most endpoints support:
- `startDate` (ISO 8601) - Start of date range
- `endDate` (ISO 8601) - End of date range (defaults to now)
- `limit` (integer) - Maximum results to return

Timeline endpoint also supports:
- `interval` - `hour` or `day` for aggregation

## Rate Limit Headers

When rate limiting is active, responses include:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1642345678
```

When limit exceeded (429 status):
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

## Architecture

### Data Flow

```
Request → Usage Logger Middleware → API Handler → Response
                ↓
         Firestore (api_usage_logs)
                ↓
         Analytics Service → Aggregation → API Response
```

### Middleware Order

1. Helmet (security)
2. CORS
3. Body parser
4. Base path handler
5. Request logger (console)
6. **Usage logger** (Firestore)
7. Swagger docs
8. **Rate limiters** (Redis/memory)
9. API routes
10. Error handler

## Performance Considerations

### 1. Logging is Non-Blocking
Usage logging happens after response is sent, doesn't slow down API.

### 2. Excluded Paths
The following are NOT logged to reduce noise:
- `/health`
- `/favicon.ico`
- `/api-docs/*`
- Static assets (.css, .js, .json, .png, etc.)

### 3. Firestore Limits
- Free tier: 50,000 reads/day, 20,000 writes/day
- Each API call = 1 write to `api_usage_logs`
- Analytics queries read from this collection
- Consider cleanup policy for old logs

### 4. Redis Benefits
- Faster rate limiting
- Distributed rate limiting (multiple servers)
- Persistent across restarts
- Lower memory usage than in-memory store

## Monitoring Best Practices

### 1. Regular Review
- Check error rate trends weekly
- Monitor slowest endpoints monthly
- Review user activity for anomalies

### 2. Alerts Setup
Consider setting up alerts for:
- Error rate > 5%
- Response time > 1000ms (P95)
- Spike in traffic from single IP
- High rate limit violations

### 3. Data Retention
Implement cleanup for old logs:
```javascript
// Example: Delete logs older than 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
db.collection('api_usage_logs')
  .where('timestamp', '<', thirtyDaysAgo.toISOString())
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => doc.ref.delete());
  });
```

## Customization

### Adjust Rate Limits

Edit `src/middleware/rate-limiter.js`:

```javascript
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // Window duration
  max: 100,                   // Max requests
  message: 'Custom message',
});
```

### Add Custom Metrics

Extend `src/middleware/usage-logger.js`:

```javascript
// Add custom fields
logUsage({
  ...data,
  customField: req.headers['x-custom-header'],
});
```

### Create Custom Analytics

Add functions to `src/services/analytics.js`:

```javascript
const getCustomMetric = async (companyId, options) => {
  // Your custom aggregation logic
};
```

## Security Notes

1. **Analytics endpoints are admin-only** - enforced by `requireRole(['admin', 'owner'])`
2. **Dashboard requires authentication** - Firebase token required
3. **Rate limiting protects against abuse** - automatic IP/user blocking
4. **No PII in logs** - user IDs are Firebase UIDs, not personal info
5. **CORS enabled** - only allowed origins can access

## Troubleshooting

### Redis Connection Failed
```
⚠️ Redis unavailable - rate limiting will use in-memory store
```
**Solution**: Install and start Redis, or ignore if using in-memory store.

### 401 Unauthorized on Analytics
**Solution**:
- Ensure valid Firebase token
- Token must be from user with admin/owner role
- Check token hasn't expired

### No Data in Dashboard
**Solution**:
- Make some API requests first to generate logs
- Check Firestore `api_usage_logs` collection exists
- Verify date range includes recent requests

### High Firestore Usage
**Solution**:
- Implement data retention policy
- Reduce logging detail (skip more paths)
- Use sampling (log every Nth request)

## Future Enhancements

Potential additions:
- [ ] Export analytics to CSV/JSON
- [ ] Email reports (weekly/monthly)
- [ ] Anomaly detection
- [ ] Custom dashboards per user
- [ ] Integration with monitoring tools (Datadog, New Relic)
- [ ] GraphQL analytics endpoints
- [ ] Real-time WebSocket updates
- [ ] Cost tracking (if using paid APIs)

## Support

For issues or questions:
1. Check this documentation
2. Review code comments
3. Check Firestore console for data
4. Review server logs for errors

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
