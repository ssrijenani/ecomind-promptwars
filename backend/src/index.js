// On Vercel, environment variables come from the dashboard, not a .env file
// -- there is no .env file in the deployed environment. dotenv.config()
// should simply find nothing and continue, but we wrap it defensively so a
// missing file can never crash the whole function.
try {
  require('dotenv').config();
} catch (err) {
  console.warn('dotenv config skipped:', err.message);
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const footprintRoutes = require('./routes/footprint');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers (sets sane defaults like X-Content-Type-Options,
// disables X-Powered-By, etc.)
app.use(helmet());

// Only allow requests from our known frontend origin rather than '*',
// since this API handles authenticated user data.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
);

// Limit request body size to reduce abuse/DoS surface.
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/footprint', footprintRoutes);

// Centralized fallback error handler. Avoids leaking stack traces or
// internal error details to clients.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// 404 handler for unmatched routes.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`EcoMind backend running on port ${PORT}`);
  });
}

module.exports = app;
