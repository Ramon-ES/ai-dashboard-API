# AI Dashboard API Documentation

Welcome to the AI Dashboard API. This RESTful API allows you to programmatically manage AI training scenarios, characters, dialogues, and environments for your applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Base URL & Environments](#base-url--environments)
- [Authentication](#authentication)
- [Making Your First Request](#making-your-first-request)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)
- [Support](#support)

---

## Quick Start

To start using the AI Dashboard API:

1. **Get your account** - Contact us to set up your company account
2. **Login to get a token** - Use your email and password to authenticate
3. **Start making requests** - Use the token to call our API endpoints

**Estimated setup time:** 5 minutes

---

## Base URL & Environments

Use the following base URLs for your API requests:

```
Production: https://your-production-api-url.com
Staging: https://your-staging-api-url.com (if available)
```

> **Note:** Replace with the actual API URL provided by your account manager.

All endpoints documented below should be prefixed with the base URL.

**Example:**
```
Full URL: https://your-api-url.com/api/scenarios
```

---

## Authentication

The API uses **token-based authentication**. All you need is your email and password - we handle all the authentication infrastructure.

### What You Need

Contact us to create your account. You'll receive:
- **Email:** Your login email address
- **Password:** Your initial password ([change it after first login](#change-your-password))
- **API Base URL:** The endpoint for all API requests

That's it! No API keys, no Firebase setup, no SDKs required.

### How to Get an Access Token

**Step 1:** Login with your credentials to get a token

```javascript
async function login(email, password) {
  const response = await fetch('https://your-api-url.com/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data.token;
}

// Usage
const token = await login('your-account@company.com', 'your-password');
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...",
  "refreshToken": "AOEOulZ...",
  "expiresIn": 3600,
  "user": {
    "uid": "user-123",
    "email": "your-account@company.com",
    "role": "editor",
    "permissions": ["read", "write"],
    "companyId": "company-456"
  }
}
```

**Step 2:** Use the token in all API requests

Include the token in the `Authorization` header:

```javascript
const response = await fetch('https://your-api-url.com/api/scenarios', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### Token Expiration & Refresh

Tokens expire after **1 hour**. You have two options for handling expiration:

#### Option 1: Re-login (Simple)

When you get a `401 Unauthorized` error, just call `/auth/login` again:

```javascript
async function apiRequest(endpoint, options = {}, credentials) {
  let token = localStorage.getItem('token');

  let response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  // If token expired, re-login and retry
  if (response.status === 401) {
    const newToken = await login(credentials.email, credentials.password);
    localStorage.setItem('token', newToken);

    response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  return response.json();
}
```

#### Option 2: Use Refresh Token (Recommended)

Use the refresh token to get a new access token without re-entering password:

```javascript
async function refreshToken(refreshToken) {
  const response = await fetch('https://your-api-url.com/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: refreshToken
    })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Token refresh failed');
  }

  return data.token;
}
```

### Complete Example with Auto-Refresh

```javascript
class APIClient {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = null;
    this.refreshToken = null;
  }

  async login(email, password) {
    const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    this.token = data.token;
    this.refreshToken = data.refreshToken;

    return data;
  }

  async refresh() {
    const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error('Session expired - please login again');
    }

    this.token = data.token;
    this.refreshToken = data.refreshToken;

    return data.token;
  }

  async request(endpoint, options = {}) {
    let response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Auto-refresh on token expiration
    if (response.status === 401) {
      await this.refresh();

      response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    }

    return response.json();
  }
}

// Usage
const client = new APIClient('https://your-api-url.com');

// Login once
await client.login('your@email.com', 'password');

// Make requests - token refresh is automatic
const scenarios = await client.request('/api/scenarios');
const characters = await client.request('/api/characters');
```

### Change Your Password

For security, you should change your initial password after first login.

**Endpoint:** `PUT /api/users/me/password`
**Authentication:** Required

**Request:**
```javascript
const response = await fetch('https://your-api-url.com/api/users/me/password', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    currentPassword: 'your-old-password',
    newPassword: 'your-new-secure-password'
  })
});

const result = await response.json();
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Requirements:**
- New password must be at least 6 characters
- Must provide current password for verification

**Example:**
```javascript
// After first login, change your password
async function changePassword(token, currentPass, newPass) {
  const response = await fetch('https://your-api-url.com/api/users/me/password', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentPassword: currentPass,
      newPassword: newPass
    })
  });

  const data = await response.json();

  if (data.success) {
    console.log('Password changed successfully!');
    // Re-authenticate with new password
    return await login(email, newPass);
  } else {
    console.error('Failed to change password:', data.error);
  }
}
```

---

## Making Your First Request

Let's test your connection by fetching all scenarios.

### 1. Check API Health (No Auth Required)

```bash
curl https://your-api-url.com/health
```

**Response:**
```json
{
  "success": true,
  "message": "API server is running",
  "timestamp": "2025-10-09T10:30:00.000Z"
}
```

### 2. Fetch Your Scenarios (Auth Required)

```javascript
const response = await fetch('https://your-api-url.com/api/scenarios', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "scenario-123",
      "name": "Customer Service Training",
      "description": "Basic customer interaction scenario",
      "status": "published",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## API Reference

### Understanding Permissions

Your account has a specific role that determines what you can do:

| Role       | Can View | Can Create/Edit | Can Delete | Can Manage Users |
|------------|----------|-----------------|------------|------------------|
| **Viewer** | ✅       | ❌              | ❌         | ❌               |
| **Editor** | ✅       | ✅              | ✅         | ❌               |
| **Admin**  | ✅       | ✅              | ✅         | ✅               |

> Your account role will be provided when your account is created.

---

### Scenarios

Scenarios are the main training modules combining characters, dialogues, and environments.

#### List All Scenarios

Get all scenarios accessible to your account.

```http
GET /api/scenarios
```

**Headers:**
```
Authorization: Bearer {your-token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "scenario-abc123",
      "name": "Customer Service - Angry Customer",
      "description": "Handle an upset customer scenario",
      "status": "published",
      "dialogueId": "dialogue-xyz",
      "environmentId": "env-retail",
      "characterRoles": [
        {
          "roleId": "customer",
          "characterId": "char-angry-customer"
        },
        {
          "roleId": "agent",
          "characterId": "char-service-rep"
        }
      ],
      "image": "https://storage.googleapis.com/...",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-02-01T14:20:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get Single Scenario

```http
GET /api/scenarios/{id}
```

**Example:**
```javascript
const response = await fetch('https://your-api-url.com/api/scenarios/scenario-abc123', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### Get Complete Scenario with All Details

Retrieves the scenario with full character, dialogue, and environment data populated.

```http
GET /api/scenarios/{id}/full
```

**Response includes:**
- Complete scenario data
- Full dialogue object
- Full environment object
- All character details

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "scenario-abc123",
    "name": "Customer Service - Angry Customer",
    "dialogue": {
      "id": "dialogue-xyz",
      "name": "Complaint Resolution Flow",
      "nodes": [...]
    },
    "environment": {
      "id": "env-retail",
      "name": "Retail Store",
      "ambientAudio": "store-sounds.mp3"
    },
    "characters": [
      {
        "roleId": "customer",
        "character": {
          "id": "char-angry-customer",
          "name": "Frustrated Customer",
          "personality": "Upset but reasonable",
          "voiceId": "voice-123"
        }
      }
    ]
  }
}
```

#### Create Scenario

**Requires:** Editor or Admin role

```http
POST /api/scenarios
```

**Request Body:**
```json
{
  "name": "New Training Scenario",
  "description": "Description of the scenario",
  "status": "draft",
  "dialogueId": "dialogue-id",
  "environmentId": "environment-id",
  "characterRoles": [
    {
      "roleId": "role-1",
      "characterId": "character-id"
    }
  ]
}
```

**Status options:** `draft`, `published`, `archived`

**Example:**
```javascript
const newScenario = await fetch('https://your-api-url.com/api/scenarios', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Sales Training - Objection Handling",
    description: "Practice handling common sales objections",
    status: "draft",
    dialogueId: "dialogue-sales-01",
    environmentId: "env-office",
    characterRoles: [
      { roleId: "prospect", characterId: "char-skeptical-buyer" }
    ]
  })
});

const result = await newScenario.json();
console.log(result.data.id); // Your new scenario ID
```

#### Update Scenario

**Requires:** Editor or Admin role

```http
PUT /api/scenarios/{id}
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Scenario Name",
  "status": "published",
  "description": "Updated description"
}
```

#### Delete Scenario

**Requires:** Editor or Admin role

```http
DELETE /api/scenarios/{id}
```

**Example:**
```javascript
await fetch('https://your-api-url.com/api/scenarios/scenario-abc123', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### Duplicate Scenario

Create a copy of an existing scenario.

**Requires:** Editor or Admin role

```http
POST /api/scenarios/{id}/duplicate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scenario-new-copy",
    "name": "Customer Service - Angry Customer (Copy)",
    // ... rest of duplicated data
  }
}
```

#### Upload Scenario Image

**Requires:** Editor or Admin role

```http
POST /api/scenarios/{id}/image
Content-Type: multipart/form-data
```

**Form field:** `image`
**Accepted formats:** JPEG, PNG, WebP
**Max size:** 10MB

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch(`https://your-api-url.com/api/scenarios/${scenarioId}/image`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const result = await response.json();
console.log(result.data.url); // URL of uploaded image
```

**Example (cURL):**
```bash
curl -X POST \
  https://your-api-url.com/api/scenarios/scenario-123/image \
  -H "Authorization: Bearer your-token" \
  -F "image=@/path/to/image.jpg"
```

---

### Characters

Manage AI characters used in your scenarios.

#### List All Characters

```http
GET /api/characters
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "char-123",
      "name": "Sarah - Customer Service Rep",
      "description": "Friendly and professional service representative",
      "voiceId": "voice-female-01",
      "status": "published",
      "personality": "Empathetic, patient, solution-oriented",
      "image": "https://storage.googleapis.com/...",
      "knowledgeFiles": [
        {
          "url": "https://storage.googleapis.com/.../manual.pdf",
          "fileName": "knowledge/company-123/product-manual.pdf"
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get Single Character

```http
GET /api/characters/{id}
```

#### Create Character

**Requires:** Editor or Admin role

```http
POST /api/characters
```

**Request Body:**
```json
{
  "name": "John - Tech Support",
  "description": "Technical support specialist",
  "voiceId": "voice-male-02",
  "status": "draft",
  "personality": "Technical, helpful, patient with non-technical users"
}
```

**Required fields:** `name`, `voiceId`, `status`

#### Update Character

**Requires:** Editor or Admin role

```http
PUT /api/characters/{id}
```

#### Delete Character

**Requires:** Editor or Admin role

```http
DELETE /api/characters/{id}
```

#### Duplicate Character

**Requires:** Editor or Admin role

```http
POST /api/characters/{id}/duplicate
```

#### Upload Character Image

**Requires:** Editor or Admin role

```http
POST /api/characters/{id}/image
Content-Type: multipart/form-data
```

**Form field:** `image`
**Accepted formats:** JPEG, PNG, WebP
**Max size:** 10MB

#### Upload Knowledge Files

Add training documents to enhance the character's knowledge base.

**Requires:** Editor or Admin role

```http
POST /api/characters/{id}/knowledge-files
Content-Type: multipart/form-data
```

**Form field:** `files` (can upload multiple)
**Accepted formats:** PDF, TXT, DOC, DOCX
**Max files:** 10 per request
**Max size per file:** 10MB

**Example:**
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);
formData.append('files', file3);

await fetch(`https://your-api-url.com/api/characters/${charId}/knowledge-files`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

### Dialogues

Manage conversation flows for your scenarios.

#### List All Dialogues

```http
GET /api/dialogues
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dialogue-123",
      "name": "Customer Complaint Resolution",
      "description": "Flow for handling customer complaints",
      "status": "published",
      "nodes": [],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get Single Dialogue

```http
GET /api/dialogues/{id}
```

#### Create Dialogue

**Requires:** Editor or Admin role

```http
POST /api/dialogues
```

**Request Body:**
```json
{
  "name": "Onboarding Conversation",
  "description": "Employee onboarding dialogue flow",
  "status": "draft",
  "nodes": []
}
```

#### Update Dialogue

**Requires:** Editor or Admin role

```http
PUT /api/dialogues/{id}
```

#### Delete Dialogue

**Requires:** Editor or Admin role

```http
DELETE /api/dialogues/{id}
```

#### Duplicate Dialogue

**Requires:** Editor or Admin role

```http
POST /api/dialogues/{id}/duplicate
```

---

### Environments

Manage virtual environments where scenarios take place.

#### List All Environments

```http
GET /api/environments
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "env-123",
      "name": "Modern Retail Store",
      "description": "Contemporary retail environment with ambient sounds",
      "status": "published",
      "ambientAudio": "retail-store-ambient.mp3",
      "image": "https://storage.googleapis.com/...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get Single Environment

```http
GET /api/environments/{id}
```

#### Create Environment

**Requires:** Editor or Admin role

```http
POST /api/environments
```

**Request Body:**
```json
{
  "name": "Corporate Office",
  "description": "Modern office environment",
  "status": "draft",
  "ambientAudio": "office-ambient.mp3"
}
```

#### Update Environment

**Requires:** Editor or Admin role

```http
PUT /api/environments/{id}
```

#### Delete Environment

**Requires:** Editor or Admin role

```http
DELETE /api/environments/{id}
```

#### Duplicate Environment

**Requires:** Editor or Admin role

```http
POST /api/environments/{id}/duplicate
```

#### Upload Environment Image

**Requires:** Editor or Admin role

```http
POST /api/environments/{id}/image
Content-Type: multipart/form-data
```

**Form field:** `image`
**Accepted formats:** JPEG, PNG, WebP
**Max size:** 10MB

---

### Dashboard & Analytics

Get overview statistics for your account.

#### Get Statistics

```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scenarios": 15,
    "characters": 32,
    "dialogues": 24,
    "environments": 8
  }
}
```

**Example:**
```javascript
const stats = await fetch('https://your-api-url.com/api/dashboard/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await stats.json();
console.log(`You have ${data.data.scenarios} scenarios`);
```

#### Get Recent Activity

```http
GET /api/dashboard/recent-activity?limit=20
```

**Query Parameters:**
- `limit` (optional) - Number of activities (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "scenario",
      "action": "created",
      "entityId": "scenario-123",
      "entityName": "New Training Module",
      "userId": "user-456",
      "timestamp": "2025-10-09T10:30:00.000Z"
    }
  ]
}
```

---

### Data Schemas

Get field definitions and validation rules for creating/updating resources.

#### List Available Schema Types

```http
GET /api/schema
```

**Response:**
```json
{
  "success": true,
  "data": {
    "types": ["scenario", "character", "dialogue", "environment"],
    "count": 4
  }
}
```

#### Get Schema for Specific Type

```http
GET /api/schema/{type}
```

**Available types:** `scenario`, `character`, `dialogue`, `environment`

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "character",
    "name": "Character",
    "fields": [
      {
        "name": "name",
        "type": "string",
        "required": true,
        "editable": true,
        "description": "Character name"
      },
      {
        "name": "voiceId",
        "type": "string",
        "required": true,
        "editable": true,
        "description": "Voice identifier"
      }
    ]
  }
}
```

**Use case:** Validate your data before sending create/update requests.

---

## Error Handling

### Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning | What to do |
|------|---------|------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check your request data - likely validation error |
| 401 | Unauthorized | Your token is invalid or expired - re-authenticate |
| 403 | Forbidden | You don't have permission for this action |
| 404 | Not Found | Resource doesn't exist or you don't have access |
| 409 | Conflict | Resource already exists (e.g., duplicate name) |
| 500 | Server Error | Something went wrong on our end - contact support |

### Common Errors

#### 1. Missing Authentication

```json
{
  "success": false,
  "error": "Authorization token required"
}
```

**Fix:** Include `Authorization: Bearer {token}` header

#### 2. Token Expired

```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

**Fix:** Get a fresh token by calling `getIdToken()` again

#### 3. Insufficient Permissions

```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions"
}
```

**Fix:** Contact your admin to upgrade your account role

#### 4. Validation Error

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "status": "Status must be one of: draft, published, archived"
  }
}
```

**Fix:** Check the `details` object for specific field errors

#### 5. Resource Not Found

```json
{
  "success": false,
  "error": "Scenario not found"
}
```

**Fix:** Verify the ID exists and you have access to it

### Error Handling Best Practices

```javascript
async function getScenario(id) {
  try {
    const response = await fetch(`https://your-api-url.com/api/scenarios/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!data.success) {
      // Handle API error
      if (response.status === 401) {
        // Token expired - re-authenticate
        await refreshToken();
        return getScenario(id); // Retry
      } else if (response.status === 404) {
        console.error('Scenario not found');
      } else {
        console.error('API Error:', data.error);
      }
      return null;
    }

    return data.data;

  } catch (error) {
    // Handle network error
    console.error('Network error:', error);
    return null;
  }
}
```

---

## Code Examples

### Complete Integration Example (JavaScript)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

class AIScenarioClient {
  constructor(firebaseConfig, apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.token = null;
  }

  // Authenticate and store token
  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    this.token = await userCredential.user.getIdToken();
    return this.token;
  }

  // Make authenticated API request
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data.data;
  }

  // Get all scenarios
  async getScenarios() {
    return this.request('/api/scenarios');
  }

  // Get single scenario with full details
  async getFullScenario(id) {
    return this.request(`/api/scenarios/${id}/full`);
  }

  // Create new scenario
  async createScenario(scenarioData) {
    return this.request('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify(scenarioData)
    });
  }

  // Update scenario
  async updateScenario(id, updates) {
    return this.request(`/api/scenarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Upload scenario image
  async uploadScenarioImage(id, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.request(`/api/scenarios/${id}/image`, {
      method: 'POST',
      headers: {}, // Don't set Content-Type for FormData
      body: formData
    });
  }

  // Get dashboard stats
  async getStats() {
    return this.request('/api/dashboard/stats');
  }
}

// Usage
const client = new AIScenarioClient(
  {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain.firebaseapp.com",
    projectId: "your-project-id"
  },
  'https://your-api-url.com'
);

// Login
await client.login('your@email.com', 'password');

// Fetch scenarios
const scenarios = await client.getScenarios();
console.log(`Found ${scenarios.length} scenarios`);

// Create new scenario
const newScenario = await client.createScenario({
  name: "Sales Training",
  description: "Cold calling practice",
  status: "draft",
  dialogueId: "dialogue-123",
  environmentId: "env-office",
  characterRoles: []
});
console.log(`Created scenario: ${newScenario.id}`);
```

### Python Example

```python
import requests
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

class AIScenarioClient:
    def __init__(self, api_base_url, firebase_cred_path):
        self.api_base_url = api_base_url
        self.token = None

        # Initialize Firebase Admin
        cred = credentials.Certificate(firebase_cred_path)
        firebase_admin.initialize_app(cred)

    def get_token_for_user(self, uid):
        """Get custom token for a user (server-side only)"""
        custom_token = firebase_auth.create_custom_token(uid)
        # In production, exchange this for ID token via Firebase Auth REST API
        return custom_token

    def request(self, endpoint, method='GET', data=None):
        """Make authenticated API request"""
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }

        url = f'{self.api_base_url}{endpoint}'

        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)

        result = response.json()

        if not result.get('success'):
            raise Exception(result.get('error'))

        return result.get('data')

    def get_scenarios(self):
        """Get all scenarios"""
        return self.request('/api/scenarios')

    def create_scenario(self, scenario_data):
        """Create new scenario"""
        return self.request('/api/scenarios', method='POST', data=scenario_data)

    def get_stats(self):
        """Get dashboard statistics"""
        return self.request('/api/dashboard/stats')

# Usage
client = AIScenarioClient(
    'https://your-api-url.com',
    'path/to/firebase-credentials.json'
)

# Set token (you'd get this from Firebase Auth)
client.token = 'your-id-token'

# Fetch scenarios
scenarios = client.get_scenarios()
print(f"Found {len(scenarios)} scenarios")

# Create scenario
new_scenario = client.create_scenario({
    'name': 'Sales Training',
    'description': 'Cold calling practice',
    'status': 'draft',
    'dialogueId': 'dialogue-123',
    'environmentId': 'env-office',
    'characterRoles': []
})
print(f"Created: {new_scenario['id']}")
```

### cURL Examples

```bash
# Set your token
export TOKEN="your-firebase-id-token"
export API_URL="https://your-api-url.com"

# Get all scenarios
curl -X GET "$API_URL/api/scenarios" \
  -H "Authorization: Bearer $TOKEN"

# Create a character
curl -X POST "$API_URL/api/characters" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Rep",
    "description": "Experienced sales representative",
    "voiceId": "voice-123",
    "status": "draft",
    "personality": "Confident and persuasive"
  }'

# Update scenario
curl -X PUT "$API_URL/api/scenarios/scenario-123" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published"
  }'

# Upload image
curl -X POST "$API_URL/api/characters/char-123/image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@./character-avatar.jpg"

# Get dashboard stats
curl -X GET "$API_URL/api/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Best Practices

### 1. Token Management
✅ **Do:**
- Store tokens securely (use environment variables, secure storage)
- Implement automatic token refresh
- Handle 401 errors by re-authenticating

❌ **Don't:**
- Hard-code tokens in your source code
- Store tokens in version control
- Share tokens between users

### 2. Error Handling
✅ **Do:**
- Always check the `success` field in responses
- Implement retry logic for network errors
- Show user-friendly error messages

❌ **Don't:**
- Ignore error responses
- Assume requests always succeed
- Show raw error messages to end users

### 3. Performance
✅ **Do:**
- Cache scenarios/characters when possible
- Use the `/full` endpoint sparingly (only when you need complete data)
- Implement pagination if fetching large datasets

❌ **Don't:**
- Make unnecessary API calls
- Fetch full scenarios when list view is enough
- Poll the API excessively

### 4. File Uploads
✅ **Do:**
- Compress images before upload
- Validate file types client-side
- Handle upload progress for better UX

❌ **Don't:**
- Upload files larger than 10MB
- Upload unsupported file formats
- Upload without user feedback

---

## Support

Need help integrating the API?

**Technical Support:**
- 📧 Email: ramon.hoffman@enversedstudios.com
- 📚 Documentation: https://docs.your-company.com
- 💬 Support Portal: https://support.your-company.com

**Account & Billing:**
- 📧 Email: accounts@your-company.com
- 🌐 Account Portal: https://portal.your-company.com

**Emergency Support:**
- For production outages: emergency@your-company.com
- Status Page: https://status.your-company.com

---

## Changelog

### Version 1.0.0 (Current)
*Released: October 2025*

**Features:**
- Full CRUD operations for Scenarios, Characters, Dialogues, and Environments
- Firebase Authentication integration
- File upload support (images and documents)
- Dashboard analytics endpoints
- Role-based access control
- Schema validation endpoints

---

**API Version:** 1.0.0
**Last Updated:** October 9, 2025
**Document Version:** 1.0
