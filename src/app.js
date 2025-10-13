const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const swaggerSpecClient = require('./config/swagger-client');
require('dotenv').config();

// Initialize Firebase
require('./config/firebase');

// Import routes
const authRoutes = require('./routes/auth');
const schemaRoutes = require('./routes/schema');
const scenarioRoutes = require('./routes/scenarios');
const characterRoutes = require('./routes/characters');
const dialogueRoutes = require('./routes/dialogues');
const environmentRoutes = require('./routes/environments');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');

const app = express();
const PORT = process.env.PORT || 3004;
const BASE_PATH = process.env.BASE_PATH || ''; // e.g., '/ai-dashboard'

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for docs landing page)
app.use(express.static('public'));

// Middleware to capture base path from nginx headers
app.use((req, res, next) => {
  // Get base path from nginx header or environment variable
  req.basePath = req.headers['x-base-path'] || BASE_PATH || '';
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} (Base: ${req.basePath})`);
  next();
});

// Client API Documentation (public - for external clients)
app.use(`${BASE_PATH}/api-docs/client`, swaggerUi.serve, swaggerUi.setup(swaggerSpecClient, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Dashboard API - Client Documentation',
  customfavIcon: '/favicon.ico'
}));

// Internal API Documentation (for frontend developers - all endpoints)
app.use(`${BASE_PATH}/api-docs/internal`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Dashboard API - Internal Documentation',
  customfavIcon: '/favicon.ico'
}));

// Redirect root to api-docs
app.get(`${BASE_PATH}/`, (req, res) => {
  res.redirect(`${BASE_PATH}/api-docs/client`);
});

// Redirect /api-docs and /api-docs/ to client documentation
app.get(`${BASE_PATH}/api-docs/`, (req, res) => {
  res.redirect(`${BASE_PATH}/api-docs/client`);
});

app.get(`${BASE_PATH}/api-docs`, (req, res) => {
  res.redirect(`${BASE_PATH}/api-docs/client`);
});

// OpenAPI JSON endpoints
app.get(`${BASE_PATH}/api-docs/client.json`, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecClient);
});

app.get(`${BASE_PATH}/api-docs/internal.json`, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get(`${BASE_PATH}/health`, (req, res) => {
  res.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/api/schema`, schemaRoutes);
app.use(`${BASE_PATH}/api/companies`, companyRoutes);
app.use(`${BASE_PATH}/api/users`, userRoutes);
app.use(`${BASE_PATH}/api/scenarios`, scenarioRoutes);
app.use(`${BASE_PATH}/api/characters`, characterRoutes);
app.use(`${BASE_PATH}/api/dialogues`, dialogueRoutes);
app.use(`${BASE_PATH}/api/environments`, environmentRoutes);
app.use(`${BASE_PATH}/api/dashboard`, dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AI Dashboard API Server`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;
