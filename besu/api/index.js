const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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

// Serve static files
app.use(express.static('public'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/contracts', contractRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Besu Contract API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      contracts: '/api/contracts',
      simpleStorage: {
        get: 'GET /api/contracts/simple-storage',
        set: 'POST /api/contracts/simple-storage',
        history: 'GET /api/contracts/simple-storage/history'
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
