// src/routes/boardRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember
} = require('../controllers/boardController');

router.use(authenticate); // Todas las rutas requieren autenticación

router.post('/',
  [
    body('name').notEmpty().withMessage('El nombre del tablero es requerido')
  ],
  createBoard
);

router.get('/my-boards', getMyBoards);

router.get('/:boardId', getBoardById);
router.put('/:boardId', updateBoard);
router.delete('/:boardId', deleteBoard);

router.post('/:boardId/invite',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('role').optional().isIn(['admin', 'member', 'viewer'])
  ],
  inviteMember
);

module.exports = router;