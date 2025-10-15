# Getting Started with the AI Dashboard API

This guide will help you get started with the AI Dashboard API, whether you're a developer or prefer using visual tools.

---

## For Developers: JavaScript Guide (Luuk)

Hi Luuk! This guide gives you simple JavaScript functions to fetch data from the API. You can use these functions in your browser console or in your own code.

### What You'll Need

- A web browser (Chrome, Firefox, Edge, etc.)
- Test credentials:
  - Email: `test@demo-company.com`
  - Password: `wachtwoord`

### Quick Start

Open your browser console (press **F12** or right-click → Inspect → Console tab) and copy-paste the functions below!

### Understanding the Basics

- **API** = A way for programs to talk to each other
- **HTTP Request** = Asking the API for something
- **JSON** = A format for sending and receiving data (looks like JavaScript objects)
- **Token** = Like a temporary password you get after logging in

### JavaScript Functions

Copy these functions into your browser console or your JavaScript file:

```javascript
// Set your API URL
const API_URL = 'https://webplatform.enversedstudios.com/ai-dashboard';

// 1. Login and get access token
async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@demo-company.com',
      password: 'wachtwoord'
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Login successful! Token:', data.data.accessToken);
    return data.data.accessToken;
  } else {
    console.error('Login failed:', data.error);
    return null;
  }
}

// 2. Get dashboard statistics
async function getDashboardStats(token) {
  const response = await fetch(`${API_URL}/api/dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log('Dashboard Stats:', data.data);
  return data.data;
}

// 3. Get all scenarios
async function getScenarios(token) {
  const response = await fetch(`${API_URL}/api/scenarios`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log(`Found ${data.count} scenarios:`, data.data);
  return data.data;
}

// 4. Get all characters
async function getCharacters(token) {
  const response = await fetch(`${API_URL}/api/characters`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log(`Found ${data.count} characters:`, data.data);
  return data.data;
}

// 5. Get a specific character by ID
async function getCharacter(token, characterId) {
  const response = await fetch(`${API_URL}/api/characters/${characterId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log('Character details:', data.data);
  return data.data;
}

// 6. Get all environments
async function getEnvironments(token) {
  const response = await fetch(`${API_URL}/api/environments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log(`Found ${data.count} environments:`, data.data);
  return data.data;
}

// 7. Get all dialogues
async function getDialogues(token) {
  const response = await fetch(`${API_URL}/api/dialogues`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log(`Found ${data.count} dialogues:`, data.data);
  return data.data;
}
```

### How to Use These Functions

**Step 1: Login first**
```javascript
// Call this and save the token
const token = await login();
```

**Step 2: Use the token to fetch data**
```javascript
// Get dashboard stats
await getDashboardStats(token);

// Get all scenarios
await getScenarios(token);

// Get all characters
const characters = await getCharacters(token);

// Get a specific character (use an ID from the characters list)
await getCharacter(token, 'some-character-id');

// Get all environments
await getEnvironments(token);

// Get all dialogues
await getDialogues(token);
```

**Complete Example:**
```javascript
// Login and fetch everything in one go
const token = await login();
await getDashboardStats(token);
await getScenarios(token);
await getCharacters(token);
await getEnvironments(token);
await getDialogues(token);
```

### Important Notes

- **`async/await`**: These keywords help you work with operations that take time (like waiting for the API to respond)
  - `async` marks a function that uses `await`
  - `await` waits for an operation to complete before moving on

- **`fetch()`**: Built-in browser function to make HTTP requests
  - First parameter: URL to call
  - Second parameter: Options (method, headers, body)
  - Returns a promise that resolves to the response

- **Headers**: Extra information sent with requests
  - `Content-Type: application/json`: Tells the server you're sending JSON
  - `Authorization: Bearer <token>`: Includes your access token for authentication

- **JSON**: JavaScript Object Notation - how data is structured
  - `JSON.stringify()`: Converts JavaScript object to JSON string
  - `.json()`: Converts API response to JavaScript object

### Troubleshooting

- **CORS errors**: If calling from a webpage, the API needs to allow requests from your browser
- **"401 Unauthorized"**: Your token expired or is invalid, login again
- **"404 Not Found"**: Check the API_URL is correct and the server is running
- **"Network error"**: Make sure the API server is running on https://webplatform.enversedstudios.com/ai-dashboard
- **Nothing in console**: Press F12 to open Developer Console

---

## For using Swagger UI (Emmy)

Hi Emmy! You don't need to write any code. You can use our interactive API documentation to test endpoints using your web browser.

### What You'll Need

- A web browser (Chrome, Firefox, Edge, etc.)
- Test credentials:
  - Email: `test@demo-company.com`
  - Password: `wachtwoord`

### Step 1: Open the API Documentation

1. Open your web browser
2. Go to: **https://webplatform.enversedstudios.com/ai-dashboard/api-docs/client**
3. You should see a nice interface with all available API endpoints

### Step 2: Login to Get Your Token

Before you can use most endpoints, you need to login:

1. **Find the "Authentication" section** at the top of the page
2. **Click on "POST /auth/login"** to expand it
3. **Click the "Try it out" button** (top right of that section)
4. You'll see a text box with example JSON. **Replace it with**:
   ```json
   {
     "email": "test@demo-company.com",
     "password": "wachtwoord"
   }
   ```
5. **Click the blue "Execute" button**
6. Scroll down to see the response
7. **Copy the `accessToken`** from the response (it's a long string of random characters)

Example response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6Ikp...",  ← Copy this!
    "refreshToken": "...",
    "user": { ... }
  }
}
```

### Step 3: Authorize with Your Token

Now you need to tell Swagger to use your token for all requests:

1. **Scroll to the top of the page**
2. **Click the green "Authorize" button** (looks like a lock)
3. A popup will appear
4. **Paste your token** in the "Value" field (make sure "Bearer" is already there)
5. **Click "Authorize"**
6. **Click "Close"**

Now you're authenticated! The lock icon should now be closed.

### Step 4: Fetch a Character

Let's get information about a character:

1. **Scroll down to the "Characters" section**
2. **Find "GET /api/characters"** and click on it
3. **Click "Try it out"**
4. **Click "Execute"**

You'll see a list of all characters! Each character has:
- `id`: Unique identifier
- `name`: Character name
- `description`: What the character is about
- `voiceId`: Which voice they use
- `status`: draft, published, or archived
- And more...

### Step 5: Get a Specific Character

To get details about just one character:

1. **Copy a character ID** from the previous response
2. **Find "GET /api/characters/{id}"** and click on it
3. **Click "Try it out"**
4. **Paste the character ID** in the "id" field
5. **Click "Execute"**

You'll see all the details for that specific character!

### Step 6: Explore Other Endpoints

You can try the same process with other endpoints:

#### Dashboard Statistics
- **GET /api/dashboard/stats**: See counts of all resources
- **GET /api/dashboard/recent-activity**: See what changed recently

#### Scenarios
- **GET /api/scenarios**: List all scenarios
- **GET /api/scenarios/{id}**: Get a specific scenario

#### Environments
- **GET /api/environments**: List all environments
- **GET /api/environments/{id}**: Get a specific environment

#### Dialogues
- **GET /api/dialogues**: List all dialogues
- **GET /api/dialogues/{id}**: Get a specific dialogue

### Quick Reference: Steps for Any Endpoint

1. **Expand the endpoint** by clicking on it
2. **Click "Try it out"**
3. **Fill in any required parameters** (like IDs)
4. **Click "Execute"**
5. **View the response** below

### Understanding the Response

Every response has this structure:

```json
{
  "success": true,      ← Was the request successful?
  "data": { ... },      ← The actual data you requested
  "count": 5            ← (For lists) How many items
}
```

If something goes wrong:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### Troubleshooting

- **"Unauthorized" (401 error)**: Your token expired. Go back to Step 2 and login again
- **"Not Found" (404 error)**: The ID you used doesn't exist. Check the ID is correct
- **"Forbidden" (403 error)**: You don't have permission for this action
- **No response**: Make sure the API server is running

### Tips

- Your token expires after some time (usually 1 hour). If you get "Unauthorized" errors, just login again
- The green "Authorize" lock icon shows whether you're currently authenticated
- You can click "Clear" next to Authorize to logout
- Use the search box (Ctrl+F) to find specific endpoints quickly

---

## API Base URLs

- **Production**: https://webplatform.enversedstudios.com/ai-dashboard

## Need Help?

- Check the full API documentation: https://webplatform.enversedstudios.com/ai-dashboard/api-docs/client
- Contact your API administrator if you encounter issues
- Make sure you're using the correct credentials

## Security Notes

- Never share your access token with others
- Don't commit tokens to Git repositories
- Tokens expire automatically for security
- Always use HTTPS in production (not HTTP)
