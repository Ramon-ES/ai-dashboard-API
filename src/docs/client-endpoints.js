/**
 * CLIENT API DOCUMENTATION
 * This file contains Swagger annotations ONLY for client-facing endpoints
 * These are read-only endpoints for external API consumers
 */

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
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     companyId:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */

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
 */

/**
 * @swagger
 * /api/scenarios:
 *   get:
 *     summary: Get all scenarios
 *     description: Retrieve all training scenarios accessible to your account
 *     tags: [Scenarios]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token obtained from /auth/login
 *         example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
 *     responses:
 *       200:
 *         description: List of scenarios
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
 *                         example: scenario-abc123
 *                       name:
 *                         type: string
 *                         example: Customer Service Training
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [draft, published, archived]
 *                       dialogueId:
 *                         type: string
 *                       environmentId:
 *                         type: string
 *                       characterRoles:
 *                         type: array
 *                         items:
 *                           type: object
 *                       image:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 */

/**
 * @swagger
 * /api/scenarios/{id}:
 *   get:
 *     summary: Get scenario by ID
 *     description: Retrieve a specific scenario with basic information
 *     tags: [Scenarios]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token obtained from /auth/login
 *         example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scenario ID
 *     responses:
 *       200:
 *         description: Scenario details
 *       404:
 *         description: Scenario not found
 */

/**
 * @swagger
 * /api/scenarios/{id}/full:
 *   get:
 *     summary: Get complete scenario with all details
 *     description: Retrieve a scenario with full character, dialogue, and environment data populated
 *     tags: [Scenarios]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token obtained from /auth/login
 *         example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Scenario ID
 *     responses:
 *       200:
 *         description: Complete scenario with populated data
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
 *                     description:
 *                       type: string
 *                     dialogue:
 *                       type: object
 *                       description: Complete dialogue object
 *                     environment:
 *                       type: object
 *                       description: Complete environment object
 *                     characters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           roleId:
 *                             type: string
 *                           character:
 *                             type: object
 *                             description: Complete character data
 *       404:
 *         description: Scenario not found
 */

/**
 * @swagger
 * /api/characters:
 *   get:
 *     summary: Get all characters
 *     description: Retrieve all AI characters accessible to your account
 *     tags: [Characters]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token obtained from /auth/login
 *         example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
 *     responses:
 *       200:
 *         description: List of characters
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
 *                       description:
 *                         type: string
 *                       voiceId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       personality:
 *                         type: string
 *                       image:
 *                         type: string
 *                       knowledgeFiles:
 *                         type: array
 *                 count:
 *                   type: integer
 */

/**
 * @swagger
 * /api/characters/{id}:
 *   get:
 *     summary: Get character by ID
 *     description: Retrieve a specific character
 *     tags: [Characters]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token obtained from /auth/login
 *         example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Character ID
 *     responses:
 *       200:
 *         description: Character details
 *       404:
 *         description: Character not found
 */

/**
 * @swagger
 * /api/dialogues:
 *   get:
 *     summary: Get all dialogues
 *     description: Retrieve all conversation dialogues accessible to your account
 *     tags: [Dialogues]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token obtained from /auth/login
 *         example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
 *     responses:
 *       200:
 *         description: List of dialogues
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
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       nodes:
 *                         type: array
 *                 count:
 *                   type: integer
 */

/**
 * @swagger
 * /api/dialogues/{id}:
 *   get:
 *     summary: Get dialogue by ID
 *     description: Retrieve a specific dialogue
 *     tags: [Dialogues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dialogue ID
 *     responses:
 *       200:
 *         description: Dialogue details
 *       404:
 *         description: Dialogue not found
 */

/**
 * @swagger
 * /api/environments:
 *   get:
 *     summary: Get all environments
 *     description: Retrieve all virtual environments accessible to your account
 *     tags: [Environments]
 *     responses:
 *       200:
 *         description: List of environments
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
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       ambientAudio:
 *                         type: string
 *                       image:
 *                         type: string
 *                 count:
 *                   type: integer
 */

/**
 * @swagger
 * /api/environments/{id}:
 *   get:
 *     summary: Get environment by ID
 *     description: Retrieve a specific environment
 *     tags: [Environments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Environment ID
 *     responses:
 *       200:
 *         description: Environment details
 *       404:
 *         description: Environment not found
 */

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Change your own password
 *     description: Update your account password
 *     tags: [Users]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token obtained from /auth/login
 *         example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
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
 *                 example: newPassword456
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         description: Invalid password or validation error
 *       401:
 *         description: Unauthorized or incorrect current password
 */

/**
 * @swagger
 * /api/users/{uid}/reset-password:
 *   post:
 *     summary: Reset user password (Admin only)
 *     description: Reset a user's password and optionally send them a password reset email
 *     tags: [Users]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token obtained from /auth/login (Admin role required)
 *         example: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmNzI1NDEwM...
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to reset password for
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sendEmail:
 *                 type: boolean
 *                 example: true
 *                 description: Whether to send password reset email to the user
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset link sent
 *       403:
 *         description: Insufficient permissions (Admin role required)
 *       404:
 *         description: User not found
 */
