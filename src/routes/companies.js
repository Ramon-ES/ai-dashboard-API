const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to check if user is super admin (owner)
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Super admin access required',
    });
  }
  next();
};

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies
 *     description: List all companies in the system (super admin only)
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: List of companies
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, suspended]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *       403:
 *         description: Not authorized (super admin role required)
 */
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('companies').orderBy('createdAt', 'desc').get();

    const companies = [];
    snapshot.forEach((doc) => {
      companies.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      success: true,
      data: companies,
      count: companies.length,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch companies',
    });
  }
});

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: Get details of a specific company including user count (super admin only)
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     status:
 *                       type: string
 *                     userCount:
 *                       type: integer
 *       403:
 *         description: Not authorized (super admin role required)
 *       404:
 *         description: Company not found
 */
router.get('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const companyDoc = await db.collection('companies').doc(id).get();

    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    // Get user count for this company
    const usersSnapshot = await db.collection('users').where('companyId', '==', id).count().get();
    const userCount = usersSnapshot.data().count;

    res.json({
      success: true,
      data: {
        id: companyDoc.id,
        ...companyDoc.data(),
        userCount,
      },
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company',
    });
  }
});

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a new company
 *     description: Create a new company with an admin user (super admin only)
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - adminEmail
 *               - adminPassword
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation
 *               adminEmail:
 *                 type: string
 *                 format: email
 *                 example: admin@acme.com
 *                 description: Email for the company admin user
 *               adminPassword:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *                 description: Password for the company admin user (min 6 characters)
 *     responses:
 *       201:
 *         description: Company and admin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: object
 *                     admin:
 *                       type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized (super admin role required)
 *       409:
 *         description: Company name or admin email already exists
 */
router.post('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, adminEmail, adminPassword } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required',
      });
    }

    if (!adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        error: 'Admin email and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Validate password
    if (adminPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    // Check if company name already exists
    const existingCompany = await db
      .collection('companies')
      .where('name', '==', name)
      .limit(1)
      .get();

    if (!existingCompany.empty) {
      return res.status(409).json({
        success: false,
        error: 'Company with this name already exists',
      });
    }

    // Check if admin email already exists
    const existingUser = await db
      .collection('users')
      .where('email', '==', adminEmail)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    const now = new Date().toISOString();
    const companyId = uuidv4();

    // Step 1: Create company
    const companyData = {
      id: companyId,
      name,
      status: 'active',
      createdAt: now,
      createdBy: req.user.uid,
      updatedAt: now,
    };

    await db.collection('companies').doc(companyId).set(companyData);

    // Step 2: Create Firebase Auth user for company admin
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        emailVerified: false,
      });
    } catch (firebaseError) {
      // Rollback: delete company if user creation fails
      await db.collection('companies').doc(companyId).delete();
      throw new Error(`Failed to create admin user: ${firebaseError.message}`);
    }

    // Step 3: Create Firestore user document for company admin
    const adminUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      companyId: companyId,
      role: 'admin', // Company admin (not super-admin)
      permissions: ['read', 'write', 'admin'],
      createdAt: now,
      createdBy: req.user.uid,
      updatedAt: now,
    };

    try {
      await db.collection('users').doc(firebaseUser.uid).set(adminUserData);
    } catch (firestoreError) {
      // Rollback: delete Firebase auth user and company
      await auth.deleteUser(firebaseUser.uid);
      await db.collection('companies').doc(companyId).delete();
      throw firestoreError;
    }

    res.status(201).json({
      success: true,
      data: {
        company: companyData,
        admin: {
          uid: adminUserData.uid,
          email: adminUserData.email,
          role: adminUserData.role,
        },
      },
      message: 'Company and admin user created successfully',
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create company',
    });
  }
});

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Update company
 *     description: Update company name or status (super admin only)
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid status value
 *       403:
 *         description: Not authorized (super admin role required)
 *       404:
 *         description: Company not found
 *       409:
 *         description: Company name already exists
 */
router.put('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const companyDoc = await db.collection('companies').doc(id).get();

    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid,
    };

    if (name) {
      // Check if new name already exists
      const existingCompany = await db
        .collection('companies')
        .where('name', '==', name)
        .limit(1)
        .get();

      if (!existingCompany.empty && existingCompany.docs[0].id !== id) {
        return res.status(409).json({
          success: false,
          error: 'Company with this name already exists',
        });
      }

      updateData.name = name;
    }

    if (status) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }
      updateData.status = status;
    }

    await companyDoc.ref.update(updateData);

    res.json({
      success: true,
      data: {
        id,
        ...companyDoc.data(),
        ...updateData,
      },
      message: 'Company updated successfully',
    });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update company',
    });
  }
});

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Delete company
 *     description: Delete a company and all associated users (super admin only). Requires ?confirm=true query parameter.
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: confirm
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['true']
 *         description: Must be 'true' to confirm deletion
 *     responses:
 *       200:
 *         description: Company and all users deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedUsers:
 *                   type: integer
 *       400:
 *         description: Confirmation required
 *       403:
 *         description: Not authorized (super admin role required)
 *       404:
 *         description: Company not found
 */
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirm } = req.query;

    if (confirm !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Please confirm deletion by adding ?confirm=true to the URL',
        warning: 'This will delete the company and all associated users permanently!',
      });
    }

    const companyDoc = await db.collection('companies').doc(id).get();

    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    // Get all users for this company
    const usersSnapshot = await db.collection('users').where('companyId', '==', id).get();

    // Delete all users from Firebase Auth and Firestore
    const deletePromises = usersSnapshot.docs.map(async (userDoc) => {
      const uid = userDoc.id;
      try {
        await auth.deleteUser(uid);
      } catch (error) {
        console.error(`Error deleting user ${uid} from auth:`, error);
      }
      await userDoc.ref.delete();
    });

    await Promise.all(deletePromises);

    // Delete the company
    await companyDoc.ref.delete();

    res.json({
      success: true,
      message: `Company deleted successfully. ${usersSnapshot.size} users removed.`,
      deletedUsers: usersSnapshot.size,
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete company',
    });
  }
});

/**
 * @swagger
 * /api/companies/{id}/users:
 *   get:
 *     summary: Get all users in a company
 *     description: Get all users belonging to a specific company (super admin only)
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: List of users in the company
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
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *       403:
 *         description: Not authorized (super admin role required)
 *       404:
 *         description: Company not found
 */
router.get('/:id/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify company exists
    const companyDoc = await db.collection('companies').doc(id).get();
    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    const usersSnapshot = await db
      .collection('users')
      .where('companyId', '==', id)
      .orderBy('createdAt', 'desc')
      .get();

    const users = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      delete userData.password;
      users.push(userData);
    });

    res.json({
      success: true,
      data: users,
      count: users.length,
      company: {
        id: companyDoc.id,
        name: companyDoc.data().name,
      },
    });
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company users',
    });
  }
});

/**
 * @swagger
 * /api/companies/{id}/users:
 *   post:
 *     summary: Create user for company
 *     description: Create a new user for a specific company (super admin only)
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
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
 *               role:
 *                 type: string
 *                 enum: [viewer, editor, admin]
 *                 example: editor
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [read, write, admin]
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
 *         description: Not authorized (super admin role required)
 *       404:
 *         description: Company not found
 *       409:
 *         description: User with this email already exists
 */
router.post('/:id/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const { email, password, role, permissions } = req.body;

    // Verify company exists
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    // Validate
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and role are required',
      });
    }

    const validRoles = ['admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Check if user exists
    const existingUser = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUser.empty) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Create Firebase user
    const firebaseUser = await auth.createUser({
      email,
      password,
      emailVerified: false,
    });

    // Set permissions
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

    // Create Firestore document
    const now = new Date().toISOString();
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      companyId,
      role,
      permissions: userPermissions,
      createdAt: now,
      createdBy: req.user.uid,
      updatedAt: now,
    };

    try {
      await db.collection('users').doc(firebaseUser.uid).set(userData);
    } catch (error) {
      await auth.deleteUser(firebaseUser.uid);
      throw error;
    }

    res.status(201).json({
      success: true,
      data: userData,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user for company:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
    });
  }
});

module.exports = router;
