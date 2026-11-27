const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const languageMiddleware = require('./middleware/language');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const healthRoutes = require('./routes/health.routes');
const scamsRoutes = require('./routes/scams.routes');
const quizRoutes = require('./routes/quiz.routes');
const helplinesRoutes = require('./routes/helplines.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const clientBuildPath = path.join(__dirname, '../../../frontend/client/dist');

// Security Headers
app.use(helmet());

// 1. Serve static frontend assets in production BEFORE CORS runs
if (isProduction && fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// 2. CORS Configuration (automatically includes Render's URL + CLIENT_ORIGIN)
const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
  process.env.RENDER_EXTERNAL_URL
]
  .map(origin => origin && origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  }
}));

// Parse JSON payload with 10kb limit
app.use(express.json({ limit: '10kb' }));

// Logging configuration
// Never log request bodies for /api/report, Morgan combined doesn't log body by default.
// It just logs method, path, status, response time, etc.
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Rate limiters using exactly the requested RATE_LIMITED error code structure
const limiterHandler = (req, res, next) => {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.'
    }
  });
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  handler: limiterHandler
});

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  handler: limiterHandler
});

// Middleware for API routes
app.use('/api', apiLimiter);
app.use('/api', languageMiddleware);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/scams', scamsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/helplines', helplinesRoutes);
app.use('/api/report', reportLimiter, reportRoutes);

// 404 for unknown API routes
app.use('/api/*', notFound);

// React Router fallback (must come AFTER /api/* routes)
if (isProduction && fs.existsSync(clientBuildPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

module.exports = app;