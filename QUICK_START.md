# Quick Start Guide

Get your API server running in 5 minutes!

## Prerequisites

- Node.js installed (v16 or higher)
- Firebase project created
- Firebase Admin SDK service account JSON downloaded

## Step-by-Step Setup

### 1️⃣ Install Dependencies (1 min)

```bash
npm install
```

### 2️⃣ Configure Firebase (2 min)

1. Download Firebase service account:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in project root

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

### 3️⃣ Setup Firestore (30 seconds)

```bash
npm run setup-firestore
```

This automatically creates:
- ✅ All required collections (scenarios, characters, dialogues, environments, etc.)
- ✅ Demo company for testing
- ✅ Indexes recommendations

### 4️⃣ Create Your First User (1 min)

**In Firebase Console:**

1. Go to **Authentication** → Add user
   - Email: `admin@example.com`
   - Password: (choose a password)
   - **Copy the User UID** (you'll need it next)

2. Go to **Firestore** → `users` collection
   - Click "Add document"
   - Document ID: `<paste the User UID>`
   - Fields:
     ```
     uid: <paste the User UID>
     email: admin@example.com
     companyId: demo-company-001
     role: admin
     permissions: ["read", "write", "admin"]
     createdAt: <current timestamp>
     ```

### 5️⃣ Start the Server (5 seconds)

```bash
npm run dev
```

You should see:
```
🚀 AI Dashboard API Server
📡 Running on port 3000
🌍 Environment: development
🔗 Health check: http://localhost:3000/health
```

### 6️⃣ Test It! (30 seconds)

**Test health endpoint:**
```bash
curl http://localhost:3000/health
```

**Get a Firebase token** (for testing with Postman/Insomnia):

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Get token:
   ```bash
   firebase login:ci
   ```
   OR use Firebase Auth REST API to get an ID token

**Test with authentication:**
```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  http://localhost:3000/api/schema
```

## ✅ You're Done!

Your API is now running with:
- ✨ Schema-driven architecture
- 🔐 Firebase authentication
- 🗂️ Multi-tenant data isolation
- 📁 File upload support
- 📊 Activity tracking

## Next Steps

### Test the API Endpoints

```bash
# Get all schema types
GET http://localhost:3000/api/schema

# Get character schema
GET http://localhost:3000/api/schema/character

# Get dashboard stats
GET http://localhost:3000/api/dashboard/stats

# List all characters (empty initially)
GET http://localhost:3000/api/characters
```

### Create Your First Character

```bash
POST http://localhost:3000/api/characters
Headers:
  Authorization: Bearer YOUR_FIREBASE_TOKEN
  Content-Type: application/json

Body:
{
  "name": "John Doe",
  "voiceId": "voice123",
  "status": "draft",
  "description": "A test character"
}
```

### Frontend Integration

Your frontend should:

1. **Get schema** first:
   ```javascript
   const schema = await fetch('/api/schema/character');
   // Build form dynamically based on schema
   ```

2. **Authenticate** users with Firebase Auth:
   ```javascript
   const user = firebase.auth().currentUser;
   const token = await user.getIdToken();
   ```

3. **Make API calls** with token:
   ```javascript
   fetch('/api/characters', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

## Troubleshooting

### "Firebase not initialized"
- Check `firebase-service-account.json` is in root directory
- Verify Firebase project ID in the file

### "Unauthorized: No token provided"
- Make sure you're sending `Authorization: Bearer <token>` header
- Get a fresh Firebase ID token (they expire after 1 hour)

### "User not found in database"
- Create user document in Firestore (see Step 4)
- Make sure document ID matches Firebase Auth UID

### "Collection not found"
- Run `npm run setup-firestore` again
- Check Firestore in Firebase Console

## Development Workflow

```bash
# Start dev server (auto-reload)
npm run dev

# Check migration status
npm run migrate status

# Run migration
npm run migrate run characters

# Setup Firestore again (safe to re-run)
npm run setup-firestore
```

## Production Deployment

See [README.md](./README.md) for:
- Environment variable configuration
- Firebase security rules
- API key management
- Deployment instructions

---

**Need help?** Check the full [README.md](./README.md) or [SCHEMA_EVOLUTION_GUIDE.md](./SCHEMA_EVOLUTION_GUIDE.md)
