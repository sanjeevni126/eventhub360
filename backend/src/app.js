const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const v1Router = require('./routes/v1Router');
const db = require('./config/db');
const { initCronJobs } = require('./jobs/cronJobs');

const app = express();

app.use(cors());
app.use(express.json());

// Global Winston logger for request tracking
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Unprotected Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    return res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      timestamp: new Date().toISOString()
    });
  }
});

// Register Versioned Routes
app.use('/api/v1', v1Router);
// Backward compatibility with existing frontend
app.use('/api', v1Router);

// API Version 2 structure preparation
const v2Router = express.Router();
v2Router.get('/', (req, res) => {
  res.json({ message: 'HRMS API v2 structure prepared.' });
});
app.use('/api/v2', v2Router);

// Centralized Error Handling
app.use(errorHandler);

// Listen only if not running tests
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    logger.info(`ERP Backend server is running on http://localhost:${PORT}`);
    initCronJobs();
  });
}

module.exports = app;
