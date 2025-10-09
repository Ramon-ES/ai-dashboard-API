const { auth, db } = require('../config/firebase');

/**
 * Middleware to verify Firebase authentication token
 * Attaches user info and company info to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided',
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);

    // Get user document from Firestore to retrieve company and role info
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
      });
    }

    const userData = userDoc.data();

    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      companyId: userData.companyId,
      role: userData.role,
      permissions: userData.permissions || [],
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

/**
 * Middleware to verify API key for external applications
 * Attaches company info to req.apiClient
 */
const verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No API key provided',
      });
    }

    // Query Firestore for the API key
    const apiKeysSnapshot = await db.collection('apiKeys')
      .where('key', '==', apiKey)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (apiKeysSnapshot.empty) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive API key',
      });
    }

    const apiKeyDoc = apiKeysSnapshot.docs[0];
    const apiKeyData = apiKeyDoc.data();

    // Update last used timestamp
    await apiKeyDoc.ref.update({
      lastUsed: new Date().toISOString(),
    });

    // Attach API client info to request
    req.apiClient = {
      companyId: apiKeyData.companyId,
      permissions: apiKeyData.permissions || ['read'],
      name: apiKeyData.name,
    };

    next();
  } catch (error) {
    console.error('API key verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'API key verification failed',
    });
  }
};

/**
 * Middleware that accepts either Firebase token or API key
 */
const authenticate = async (req, res, next) => {
  const hasAuthHeader = req.headers.authorization?.startsWith('Bearer ');
  const hasApiKey = req.headers['x-api-key'];

  if (hasAuthHeader) {
    return verifyToken(req, res, next);
  } else if (hasApiKey) {
    return verifyApiKey(req, res, next);
  } else {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Provide either Bearer token or API key',
    });
  }
};

module.exports = {
  verifyToken,
  verifyApiKey,
  authenticate,
};
