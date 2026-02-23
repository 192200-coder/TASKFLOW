// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { jwt: jwtConfig } = require('../config/environment');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Por favor, autentíquese' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar rol en el tablero específico si se proporciona boardId
    if (req.params.boardId) {
      // Aquí iría la lógica para verificar permisos específicos del tablero
      // Usando la tabla board_members
    }

    next();
  };
};

module.exports = { authenticate, authorize };