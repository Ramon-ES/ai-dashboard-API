# API Analytics - Quick Start Guide

## What Was Implemented

Your API now has **comprehensive usage tracking and analytics** with 4 key components:

### 1. Automatic Usage Logging ✓
Every API request is automatically logged to Firestore with:
- Endpoint, method, status code
- Response time
- User/company information
- Request/response sizes
- Error tracking

**Database:** `api_usage_logs` collection in Firestore

### 2. Analytics Endpoints ✓
7 admin-only API endpoints for querying usage data:

| Endpoint | Description |
|----------|-------------|
| `GET /api/analytics/dashboard` | Overall statistics (requests, errors, avg time) |
| `GET /api/analytics/endpoints` | Per-endpoint usage summary |
| `GET /api/analytics/users` | User activity tracking |
| `GET /api/analytics/timeline` | Time-based metrics (hourly/daily) |
| `GET /api/analytics/performance` | Response time percentiles (P50, P95, P99) |
| `GET /api/analytics/errors` | Recent error logs |
| `GET /api/analytics/logs` | Raw usage logs |

**Access:** Admin/Owner role required + Firebase authentication

### 3. Rate Limiting ✓
Automatic protection against API abuse:

- **General APIs**: 100 req/15min
- **Auth endpoints**: 10 req/hour
- **Analytics**: 1000 req/hour
- **Uploads**: 20 req/hour

**Backend:** Redis (optional) or in-memory store

### 4. Analytics Dashboard ✓
Beautiful web UI for viewing metrics:

**URL:** `http://localhost:3004/analytics`

**Features:**
- Real-time statistics cards
- Date range filtering (1h, 24h, 7d, 30d, custom)
- 4 tabbed views: Endpoints, Users, Performance, Errors
- Sortable tables
- Responsive design

## Quick Access

### View Dashboard
1. Open browser: `http://localhost:3004/analytics`
2. Login with your Firebase ID token
3. Select time range and view metrics

### Get Your Firebase Token
From your frontend app after logging in:
```javascript
const token = await firebase.auth().currentUser.getIdToken();
console.log(token);
```

### API Example
```bash
# Get dashboard stats for last 24 hours
curl -X GET \
  'http://localhost:3004/api/analytics/dashboard' \
  -H 'Authorization: Bearer YOUR_FIREBASE_TOKEN'
```

## Files Created

### Middleware
- `src/middleware/usage-logger.js` - Logs all API requests
- `src/middleware/rate-limiter.js` - Rate limiting logic

### Services
- `src/services/analytics.js` - Analytics data aggregation

### Configuration
- `src/config/redis.js` - Redis client setup

### Routes
- `src/routes/analytics.js` - Analytics API endpoints

### Frontend
- `public/analytics-dashboard.html` - Dashboard UI

### Documentation
- `ANALYTICS-README.md` - Complete documentation
- `ANALYTICS-QUICK-START.md` - This file

## Current Status

**Server Running:** ✓ Port 3004
**Usage Logging:** ✓ Active
**Rate Limiting:** ✓ In-memory (Redis optional)
**Analytics Dashboard:** ✓ Available at `/analytics`
**API Endpoints:** ✓ All 7 endpoints active

## Redis Setup (Optional but Recommended)

Redis provides:
- Persistent rate limiting across server restarts
- Better performance than in-memory
- Distributed rate limiting (multiple servers)

**Install Redis:**
```bash
# Windows: Download from redis.io or use WSL
# Mac: brew install redis
# Linux: apt-get install redis-server

# Start Redis
redis-server
```

**Configure:**
Uncomment in `.env`:
```env
REDIS_URL=redis://localhost:6379
```

Without Redis, the system uses in-memory rate limiting (works fine for single server).

## Testing the System

1. **Generate some traffic:**
   ```bash
   curl http://localhost:3004/health
   curl http://localhost:3004/api-docs/client.json
   ```

2. **View the dashboard:**
   - Open `http://localhost:3004/analytics`
   - Login with your Firebase token
   - You should see the requests logged

3. **Test rate limiting:**
   ```bash
   # Make 101 requests quickly (should hit limit at 101)
   for i in {1..105}; do curl http://localhost:3004/health; done
   ```

4. **Check Firestore:**
   - Open Firebase Console
   - Navigate to Firestore Database
   - Look for `api_usage_logs` collection
   - You should see logged requests

## Next Steps

### Recommended
1. **Set up Redis** for production use
2. **Implement data retention** (delete logs older than 30 days)
3. **Create scheduled reports** (weekly email summaries)
4. **Set up alerts** (high error rate, slow endpoints)

### Optional Enhancements
- Export analytics to CSV/PDF
- Real-time WebSocket updates
- Custom dashboards per user
- Integration with monitoring tools (Datadog, New Relic)
- Cost tracking for paid APIs

## Troubleshooting

### Dashboard shows "No data"
- Make some API requests first
- Check Firestore has `api_usage_logs` collection
- Verify date range includes recent requests

### "401 Unauthorized" on analytics
- Ensure you're logged in as admin/owner user
- Check Firebase token is valid and not expired
- Token must be from a user with admin role

### Rate limiting not working
- Check server logs for Redis errors
- Verify rate limiter middleware is loaded
- Try in-memory store (default fallback)

### Server won't start
```bash
# Kill any process using port 3004
npx kill-port 3004

# Restart
npm start
```

## Documentation

- **Full Documentation:** See `ANALYTICS-README.md`
- **API Docs:** Visit `http://localhost:3004/api-docs/internal`
- **Architecture:** See "Data Flow" section in full docs

## Support

The analytics system is:
- ✓ Production-ready
- ✓ Non-blocking (doesn't slow down API)
- ✓ Secured (admin-only access)
- ✓ Scalable (Firestore backend)
- ✓ Optional Redis support

All logging happens asynchronously after responses are sent, so it has **zero impact on API response times**.

---

**Enjoy your new analytics system!**

For questions, check the full documentation in `ANALYTICS-README.md`.
