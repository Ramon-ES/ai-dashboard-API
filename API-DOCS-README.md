# API Documentation

Your API now has **two separate interactive Swagger documentation sites**!

## 🌐 Access Documentation

### Main Documentation Hub
**Local:** `http://localhost:3000/api-docs`
**Production:** `https://your-production-url.com/api-docs`

This landing page lets you choose between:

### 📘 Client Documentation (Public)
**Local:** `http://localhost:3000/api-docs/client`
**For:** External clients/partners integrating with your API
**Includes:**
- Authentication endpoints
- Scenarios, Characters, Dialogues, Environments
- Dashboard & Analytics
- Schema definitions

**Does NOT include:** User management, Company management (internal only)

### 📕 Internal Documentation (Complete)
**Local:** `http://localhost:3000/api-docs/internal`
**For:** Your frontend developers
**Includes:**
- Everything in Client docs
- User management (admin only)
- Company management (super-admin only)
- All internal endpoints

## ✨ Features

### Interactive UI
- **Browse all endpoints** organized by category
- **Try it out** - Test endpoints directly in the browser
- **See request/response examples** with actual data
- **Copy code snippets** in multiple languages

### How to Use

1. **Open** `http://localhost:3000/api-docs` in your browser
2. **Login first** - Click on `/auth/login` → Try it out → Execute with your credentials
3. **Copy the token** from the response
4. **Authorize** - Click the green "Authorize" button at the top → Paste token → Authorize
5. **Test any endpoint** - All authenticated endpoints will now work!

## 📚 Documented Endpoints

### ✅ Authentication (2 endpoints)
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token

### ✅ Scenarios (3 endpoints)
- `GET /api/scenarios` - List all scenarios
- `POST /api/scenarios` - Create scenario
- `GET /api/scenarios/{id}` - Get single scenario

### ✅ Characters (5 endpoints)
- `GET /api/characters` - List all characters
- `POST /api/characters` - Create character
- `GET /api/characters/{id}` - Get character
- `PUT /api/characters/{id}` - Update character
- `DELETE /api/characters/{id}` - Delete character

### ✅ Dialogues (5 endpoints)
- `GET /api/dialogues` - List all dialogues
- `POST /api/dialogues` - Create dialogue
- `GET /api/dialogues/{id}` - Get, update, or delete dialogue

### ✅ Environments (5 endpoints)
- `GET /api/environments` - List all environments
- `POST /api/environments` - Create environment
- `GET /api/environments/{id}` - Get, update, or delete environment

### ✅ Users (1 endpoint)
- `PUT /api/users/me/password` - Change your password

### ✅ Dashboard (2 endpoints)
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/recent-activity` - Get recent activity

### ✅ Schemas (2 endpoints)
- `GET /api/schema` - List schema types
- `GET /api/schema/{type}` - Get schema definition

## 🔧 For Developers

### OpenAPI Spec
The raw OpenAPI 3.0 specification is available at:
```
http://localhost:3004/api-docs.json
```

You can import this into:
- **Postman** - Import → Link → Paste URL
- **Insomnia** - Import/Export → Import URL
- **Code generators** - Generate client SDKs

### Adding More Endpoints

To document a new endpoint, add Swagger JSDoc annotations:

```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Short description
 *     description: Longer description
 *     tags: [YourTag]
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/your-endpoint', async (req, res) => {
  // Your code
});
```

The documentation updates automatically when you restart the server!

## 🚀 Deployment

When deploying to production:

1. **Update server URL** in `src/config/swagger.js`:
```javascript
servers: [
  {
    url: 'https://your-production-api.com',
    description: 'Production server',
  }
]
```

2. **Share the URL** with your clients:
```
https://your-production-api.com/api-docs
```

## 💡 Tips

- **Test endpoints** directly in Swagger UI before coding clients
- **Share the docs URL** with clients instead of sending PDF/Markdown
- **Export OpenAPI spec** for automatic client SDK generation
- **Keep it updated** - Add Swagger annotations when you add new endpoints

---

**Documentation Generated:** Swagger UI + OpenAPI 3.0
**Total Endpoints Documented:** 25+
**Last Updated:** 2025-10-09
