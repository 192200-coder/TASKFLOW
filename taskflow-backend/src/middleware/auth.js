// src/middleware/auth.js

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { jwt: jwtConfig } = require('../config/environment');

/**
 * Middleware de autenticación JWT
 */
const authenticate = async (req, res, next) => {

  try {

    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Por favor, autentíquese' });
    }

    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.verify(token, jwtConfig.secret);

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Por favor, autentíquese' });
    }

    req.user = user;
    req.token = token;

    next();

  } catch (error) {

    return res.status(401).json({ error: 'Por favor, autentíquese' });

  }

};


/**
 * Middleware de autorización por roles
 */
const authorize = (...roles) => {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Si se especifican roles, verificar que el usuario tenga uno permitido
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Verificación futura para permisos por tablero
    if (req.params.boardId) {
      // Aquí podrías verificar permisos con BoardMember
      // ejemplo: comprobar si el usuario pertenece al tablero
    }

    next();

  };

};

module.exports = { authenticate, authorize };