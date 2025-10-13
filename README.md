# AI Dashboard API

A schema-driven REST API server for managing AI training scenarios, characters, dialogues, and environments with Firebase backend.

**🚀 New to the project?** Start with the [QUICK_START.md](./QUICK_START.md) guide!

## Features

- **Schema-Driven Architecture**: Frontend dynamically adapts based on server-defined schemas
- **Multi-Tenant Support**: Complete company isolation with 3-tier hierarchy (Super Admin → Company Admin → Users)
- **Role-Based Access Control**: User roles and permissions (super-admin, admin, editor, viewer)
- **Company Management**: Create and manage multiple companies from super admin dashboard
- **File Upload Support**: Images and documents via Firebase Storage
- **Activity Tracking**: Recent edits and user activity monitoring
- **Flexible Authentication**: Firebase tokens or API keys

## User Hierarchy

```
Super Admin (Platform Owner)
    └── Companies
        └── Company Admins
            └── Company Users (Editors, Viewers)
```

**📚 See:** [MULTI_TENANT_GUIDE.md](./MULTI_TENANT_GUIDE.md) for complete multi-tenant documentation
**🚀 Setup:** [SUPER_ADMIN_SETUP.md](./SUPER_ADMIN_SETUP.md) to create your super admin account

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Authentication

## Project Structure

```
API/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin SDK configuration
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── rbac.js              # Role-based access control
│   ├── routes/
│   │   ├── schema.js            # Schema endpoints
│   │   ├── scenarios.js         # Scenario CRUD
│   │   ├── characters.js        # Character CRUD
│   │   ├── dialogues.js         # Dialogue CRUD
│   │   ├── environments.js      # Environment CRUD
│   │   └── dashboard.js         # Dashboard analytics
│   ├── schemas/
│   │   ├── scenario.schema.js   # Scenario schema definition
│   │   ├── character.schema.js  # Character schema definition
│   │   ├── dialogue.schema.js   # Dialogue schema definition
│   │   ├── environment.schema.js # Environment schema definition
│   │   └── index.js             # Schema exports
│   ├── services/
│   │   ├── firestore.js         # Firestore service layer
│   │   └── storage.js           # Firebase Storage service
│   ├── utils/
│   │   └── validator.js         # Schema validation utilities
│   └── app.js                   # Express app entry point
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Firestore Database** and **Storage**
3. Enable **Authentication** (Email/Password or other providers)
4. Download your Firebase Admin SDK service account JSON:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in the project root

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:

```env
PORT=3000
NODE_ENV=development

# Option 1: Use service account file (easier for development)
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# Option 2: Use environment variables (recommended for production)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Firestore Setup

**Automated setup:**

```bash
npm run setup-firestore
```

This script will:
- ✅ Create all required Firestore collections automatically
- ✅ Create a demo company for testing
- ✅ Show you exactly what to do next

**Manual setup** (if you prefer):

Create the following collections in Firestore Console:
- `users`, `companies`, `scenarios`, `characters`, `dialogues`, `environments`, `activities`, `apiKeys`

### 5. Create Your First User

After running `setup-firestore`, you need to:

1. **Create a user in Firebase Authentication:**
   - Go to Firebase Console → Authentication
   - Click "Add user"
   - Enter email and password
   - Copy the User UID

2. **Create user document in Firestore:**
   - Go to Firestore → `users` collection
   - Create document with ID = User UID
   - Add these fields:

```json
{
  "uid": "your-user-uid-from-auth",
  "email": "user@example.com",
  "companyId": "demo-company-001",
  "role": "admin",
  "permissions": ["read", "write", "admin"],
  "createdAt": "2025-01-08T10:00:00.000Z"
}
```

*Note: Use `demo-company-001` if you ran the setup script, or create your own company document first.*

### 6. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

All endpoints require authentication via:
- **Firebase Token**: `Authorization: Bearer <firebase-id-token>`
- **API Key**: `x-api-key: <your-api-key>`

### Schema Endpoints

- `GET /api/schema` - Get all available schema types
- `GET /api/schema/:type` - Get schema definition for specific type

### Entity Endpoints (CRUD)

Each entity type (scenarios, characters, dialogues, environments) has the same endpoints:

- `GET /api/:entity` - List all entities for company
- `GET /api/:entity/:id` - Get specific entity
- `POST /api/:entity` - Create new entity
- `PUT /api/:entity/:id` - Update entity
- `DELETE /api/:entity/:id` - Delete entity
- `POST /api/:entity/:id/duplicate` - Duplicate entity
- `POST /api/:entity/:id/image` - Upload image (scenarios, characters, environments)
- `POST /api/characters/:id/knowledge-files` - Upload knowledge files (characters only)

### Dashboard Endpoints

- `GET /api/dashboard/stats` - Get entity counts
- `GET /api/dashboard/recent-activity?limit=20` - Get recent activity

### Company Management Endpoints (Super Admin only)

- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create new company with admin user
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id?confirm=true` - Delete company and all users
- `GET /api/companies/:id/users` - List users in specific company
- `POST /api/companies/:id/users` - Create user for specific company

### User Management Endpoints (Admin only)

- `GET /api/users` - List all users in company
- `POST /api/users` - Create new user for company
- `PUT /api/users/:uid` - Update user
- `DELETE /api/users/:uid` - Delete user
- `POST /api/users/:uid/reset-password` - Generate password reset link

### Health Check

- `GET /health` - Server health check

## Schema-Driven Architecture

The frontend dynamically renders UI based on schema definitions from the API:

1. Frontend requests schema: `GET /api/schema/character`
2. Server returns field definitions with types, validation rules, labels
3. Frontend builds forms/UI dynamically
4. User submits data
5. Server validates against schema and saves

This allows schema updates without frontend redeployment.

## Security

- **Company Isolation**: All queries filtered by `companyId`
- **Role-Based Access**: Middleware checks user permissions
- **Firebase Security Rules**: Additional layer of protection
- **Input Validation**: Schema-based validation on all inputs
- **File Type Validation**: Restricted file types for uploads
- **Signed URLs**: Time-limited access to files

## API Key Management

For external applications (non-user access):

Create API key document in `apiKeys` collection:
```json
{
  "key": "generated-api-key",
  "companyId": "company-123",
  "active": true,
  "permissions": ["read", "write"],
  "name": "External Application Name",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "lastUsed": "2025-01-01T00:00:00.000Z"
}
```

## Schema Evolution & Migrations

The API automatically handles schema changes without breaking existing data:

- **New documents**: Strict validation (all required fields)
- **Updates**: Flexible validation (only validates changed fields)
- **Version tracking**: Every document tracks its schema version
- **Migration tools**: Update old data when needed

### Check Migration Status

```bash
npm run migrate status
npm run migrate status characters
```

### Run Migrations

```bash
# Test first (dry run)
npm run migrate run characters --dry-run

# Apply changes
npm run migrate run characters

# Migrate all collections
npm run migrate run all
```

**📚 Full guide:** See [SCHEMA_EVOLUTION_GUIDE.md](./SCHEMA_EVOLUTION_GUIDE.md) for detailed instructions on safe schema changes.

## Development

### Adding a New Schema

1. Create schema file in `src/schemas/newtype.schema.js`
2. Define fields with types, validation, labels
3. Export schema in `src/schemas/index.js`
4. Create routes file in `src/routes/newtypes.js`
5. Add routes to `src/app.js`

### Example Schema Definition

```javascript
const mySchema = {
  type: 'mytype',
  version: '1.0',
  collection: 'mytypes',
  fields: [
    {
      name: 'name',
      type: 'string',
      required: true,
      label: 'Name',
      validation: { minLength: 1, maxLength: 200 }
    },
    // ... more fields
  ]
};
```

## Production Deployment (EC2/VPS)

### Environment Variables Setup

**IMPORTANT: Never commit `firebase-service-account.json` to git.** Instead, use environment variables for production:

1. **On your EC2 server, create a `.env` file:**

```bash
nano .env
```

2. **Add your Firebase credentials** (from the JSON file):

```env
# Firebase Configuration (from firebase-service-account.json)
FIREBASE_PROJECT_ID=enversed-ai-dashboard
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@enversed-ai-dashboard.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=enversed-ai-dashboard.appspot.com

# Server Configuration
PORT=3004
NODE_ENV=production

ALLOWED_ORIGINS=https://yourdomain.com
```

**Note:** The private key must include the `\n` newlines as shown. Copy the entire key from your JSON file.

3. **Secure the `.env` file:**

```bash
chmod 600 .env
```

4. **Start the server:**

```bash
npm install
npm start
# or with pm2
pm2 start npm --name "aidashboard-api" -- start
```

The server will automatically use environment variables if they're present (see src/config/firebase.js:8-17).

### Alternative: Using Service Account File in Production

If you prefer using the JSON file on the server (less secure):

1. **Copy the file to the server** (use SCP, not git):
```bash
scp firebase-service-account.json ec2-user@your-server:/home/ec2-user/ai-dashboard-API/
```

2. **Secure the file:**
```bash
chmod 600 firebase-service-account.json
```

3. **Set only the storage bucket in `.env`:**
```env
FIREBASE_STORAGE_BUCKET=enversed-ai-dashboard.appspot.com
PORT=3004
```

## Troubleshooting

### Firebase Connection Issues
- Verify environment variables are set correctly in `.env`
- Check that `FIREBASE_PRIVATE_KEY` includes `\n` for newlines
- Ensure Firebase project ID matches your Firebase console
- Verify Firestore and Storage are enabled in Firebase console

### Module Not Found: firebase-service-account.json
- This means you're missing environment variables in production
- Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in `.env`
- Or copy the JSON file to the server (less secure)

### Authentication Errors
- Verify user document exists in `users` collection with `companyId`
- Check Firebase token is valid and not expired
- Ensure CORS origins are configured correctly

### File Upload Issues
- Check Firebase Storage bucket name is correct
- Verify storage rules allow uploads
- Ensure file size is under 10MB limit

## License

ISC
