const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { auth, db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { requireCompanyAccess, requireRole } = require('../middleware/rbac');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Get all users in your company (admin only)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 count:
 *                   type: integer
 *       403:
 *         description: Not authorized (admin role required)
 */
router.get('/', authenticate, requireCompanyAccess, requireRole(['admin']), async (req, res) => {
  try {
    const snapshot = await db
      .collection('users')
      .where('companyId', '==', req.companyId)
      .get();

    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      // Don't return sensitive data
      delete userData.password;
      users.push(userData);
    });

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user in your company (admin only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@company.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *                 description: Must be at least 6 characters
 *               role:
 *                 type: string
 *                 enum: [viewer, editor, admin]
 *                 example: editor
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [read, write, admin]
 *                 description: Optional - defaults based on role
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized (admin role required)
 *       409:
 *         description: User with this email already exists
 */
router.post('/', authenticate, requireCompanyAccess, requireRole(['admin']), async (req, res) => {
  try {
    const { email, password, role, permissions } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required',
      });
    }

    // Validate role
    const validRoles = ['admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role must be one of: ${validRoles.join(', ')}`,
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

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUserSnapshot = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUserSnapshot.empty) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Step 1: Create Firebase Authentication user
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email,
        password,
        emailVerified: false,
      });
    } catch (firebaseError) {
      console.error('Firebase auth error:', firebaseError);
      return res.status(400).json({
        success: false,
        error: firebaseError.message || 'Failed to create authentication user',
      });
    }

    // Step 2: Set default permissions based on role
    let userPermissions = permissions || [];
    if (userPermissions.length === 0) {
      switch (role) {
        case 'admin':
          userPermissions = ['read', 'write', 'admin'];
          break;
        case 'editor':
          userPermissions = ['read', 'write'];
          break;
        case 'viewer':
          userPermissions = ['read'];
          break;
      }
    }

    // Step 3: Create Firestore user document
    const now = new Date().toISOString();
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      companyId: req.companyId, // Same company as the admin creating them
      role,
      permissions: userPermissions,
      createdAt: now,
      createdBy: req.user.uid,
      updatedAt: now,
    };

    try {
      await db.collection('users').doc(firebaseUser.uid).set(userData);
    } catch (firestoreError) {
      // If Firestore fails, delete the Firebase auth user to keep things consistent
      await auth.deleteUser(firebaseUser.uid);
      throw firestoreError;
    }

    res.status(201).json({
      success: true,
      data: {
        uid: userData.uid,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions,
        companyId: userData.companyId,
        createdAt: userData.createdAt,
      },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
});

/**
 * @swagger
 * /api/users/{uid}:
 *   put:
 *     summary: Update a user
 *     description: Update a user's role, permissions, or email (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [viewer, editor, admin]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [read, write, admin]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or cannot remove own admin role
 *       403:
 *         description: Not authorized or user from different company
 *       404:
 *         description: User not found
 */
router.put('/:uid', authenticate, requireCompanyAccess, requireRole(['admin']), async (req, res) => {
  try {
    const { uid } = req.params;
    const { role, permissions, email } = req.body;

    // Get existing user
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const existingUser = userDoc.data();

    // Verify user belongs to same company
    if (existingUser.companyId !== req.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify users from another company',
      });
    }

    // Prevent admin from removing their own admin role
    if (uid === req.user.uid && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove your own admin role',
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid,
    };

    if (role) {
      const validRoles = ['admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: `Role must be one of: ${validRoles.join(', ')}`,
        });
      }
      updateData.role = role;
    }

    if (permissions) {
      updateData.permissions = permissions;
    }

    // Update email in both Firebase Auth and Firestore
    if (email && email !== existingUser.email) {
      try {
        await auth.updateUser(uid, { email });
        updateData.email = email;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Failed to update email: ${error.message}`,
        });
      }
    }

    // Update Firestore
    await userDoc.ref.update(updateData);

    res.json({
      success: true,
      data: {
        ...existingUser,
        ...updateData,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

/**
 * @swagger
 * /api/users/{uid}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user from your company (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete your own account
 *       403:
 *         description: Not authorized or user from different company
 *       404:
 *         description: User not found
 */
router.delete('/:uid', authenticate, requireCompanyAccess, requireRole(['admin']), async (req, res) => {
  try {
    const { uid } = req.params;

    // Prevent admin from deleting themselves
    if (uid === req.user.uid) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    // Get user document
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Verify user belongs to same company
    if (userData.companyId !== req.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete users from another company',
      });
    }

    // Delete from Firebase Auth
    try {
      await auth.deleteUser(uid);
    } catch (authError) {
      console.error('Error deleting from Firebase Auth:', authError);
      // Continue even if auth delete fails (user might already be deleted)
    }

    // Delete from Firestore
    await userDoc.ref.delete();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Change your password
 *     description: Change your own password (requires current password)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newSecurePassword123
 *                 description: Must be at least 6 characters
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error (password too short, etc.)
 *       401:
 *         description: Current password is incorrect
 */
router.put('/me/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters',
      });
    }

    // Get user data
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Verify current password using Firebase Auth REST API
    try {
      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) {
        throw new Error('FIREBASE_API_KEY not configured');
      }

      const verifyPasswordResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            password: currentPassword,
            returnSecureToken: false,
          }),
        }
      );

      if (!verifyPasswordResponse.ok) {
        const errorData = await verifyPasswordResponse.json();
        console.error('Password verification failed:', errorData);
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }

      // Current password is correct, proceed with update
      await auth.updateUser(req.user.uid, {
        password: newPassword,
      });

      // Update timestamp in Firestore
      await userDoc.ref.update({
        updatedAt: new Date().toISOString(),
        passwordChangedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to update password',
      });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
});

/**
 * @swagger
 * /api/users/{uid}/reset-password:
 *   post:
 *     summary: Generate password reset link
 *     description: Generate a password reset link for a user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Password reset link generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 resetLink:
 *                   type: string
 *                   description: Password reset link (in production, this should be emailed)
 *       403:
 *         description: Not authorized or user from different company
 *       404:
 *         description: User not found
 */
router.post('/:uid/reset-password', authenticate, requireCompanyAccess, requireRole(['admin']), async (req, res) => {
  try {
    const { uid } = req.params;

    // Get user
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();

    // Verify user belongs to same company
    if (userData.companyId !== req.companyId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot reset password for users from another company',
      });
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(userData.email);

    res.json({
      success: true,
      message: 'Password reset link generated',
      resetLink, // In production, you'd email this instead of returning it
    });
  } catch (error) {
    console.error('Error generating reset link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate password reset link',
    });
  }
});

module.exports = router;
