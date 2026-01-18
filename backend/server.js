require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const bookingRoutes = require('./routes/bookings');
const calendarRoutes = require('./routes/calendar');
const doctorRoutes = require('./routes/doctors');

// Import database initialization
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from parent directory (frontend)
app.use(express.static(path.join(__dirname, '..')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Initialize database
initDatabase()
  .then(() => {
    console.log('✓ Database initialized successfully');
  })
  .catch(err => {
    console.error('✗ Database initialization failed:', err);
    process.exit(1);
  });

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'NAD+ Longevity Booking API',
    version: '1.0.0',
    endpoints: {
      bookings: '/api/bookings',
      calendar: '/api/calendar',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/doctors', doctorRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================');
});

module.exports = app;
