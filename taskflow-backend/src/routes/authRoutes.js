// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { register, login, logout, getProfile } = require('../controllers/authController');

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  login
);

router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);

module.exports = router;