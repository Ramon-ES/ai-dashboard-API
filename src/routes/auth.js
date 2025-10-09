const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to get access token
 *     description: Authenticate with email and password to receive an access token for API requests
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@company.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *                   example: 3600
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Get user from Firestore by email
    const usersSnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify the user exists in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // We can't verify password with Firebase Admin SDK directly
    // So we'll use Firebase Auth REST API to verify credentials
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

    if (!FIREBASE_API_KEY) {
      console.error('FIREBASE_API_KEY not set in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured',
      });
    }

    // Verify password by calling Firebase Auth REST API
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok || authData.error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Return the ID token and user info
    res.json({
      success: true,
      token: authData.idToken,
      refreshToken: authData.refreshToken,
      expiresIn: parseInt(authData.expiresIn),
      user: {
        uid: userData.uid,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions,
        companyId: userData.companyId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a refresh token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: AOEOulZ...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

    // Exchange refresh token for new ID token
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    res.json({
      success: true,
      token: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: parseInt(data.expires_in),
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
    });
  }
});

module.exports = router;
