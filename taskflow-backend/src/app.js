// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes         = require('./routes/authRoutes');
const boardRoutes        = require('./routes/boardRoutes');
const columnRoutes       = require('./routes/columnRoutes');
const taskRoutes         = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// Seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100
});
app.use('/api', limiter);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Archivos estáticos
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/api/auth',          authRoutes);
app.use('/api/boards',        boardRoutes);
app.use('/api/columns',       columnRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/notifications', notificationRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Manejador de errores (debe ir antes del 404)
app.use(errorHandler);

// ✅ Express 5: usar '/{*path}' en lugar de '*'
app.use('/{*path}', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;