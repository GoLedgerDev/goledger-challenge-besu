const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
require('dotenv').config();

const contractRoutes = require('./routes/contracts');
const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Besu Contract API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  }
}));

// Serve static files
app.use(express.static('public'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/contracts', contractRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: API root endpoint
 *     description: Get API information and available endpoints
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Besu Contract API'
 *                 version:
 *                   type: string
 *                   example: '1.0.0'
 *                 endpoints:
 *                   type: object
 *                 documentation:
 *                   type: string
 *                   example: '/api-docs'
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Besu Contract API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      contracts: '/api/contracts',
      simpleStorage: {
        get: 'GET /api/contracts/simple-storage',
        set: 'POST /api/contracts/simple-storage',
        history: 'GET /api/contracts/simple-storage/history',
        info: 'GET /api/contracts/simple-storage/info'
      }
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Besu Contract API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 API docs: http://localhost:${PORT}/`);
});
