// src/routes/boardRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireBoardRole } = require('../middleware/boardAuth');
const {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  inviteMember,
  updateMemberRole,
  searchTasks,
} = require('../controllers/boardController');

router.use(authenticate);

// Crear tablero — cualquier usuario autenticado
router.post('/',
  [body('name').notEmpty().withMessage('El nombre del tablero es requerido')],
  createBoard
);

// Mis tableros / tablero por ID — cualquier miembro
router.get('/my-boards', getMyBoards);
router.get('/:boardId',  requireBoardRole('viewer'), getBoardById);

// Editar / eliminar — solo admin
router.put('/:boardId',    requireBoardRole('admin'), updateBoard);
router.delete('/:boardId', requireBoardRole('admin'), deleteBoard);

// Invitar miembro — solo admin
router.post('/:boardId/invite',
  requireBoardRole('admin'),
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('role').optional().isIn(['admin', 'member', 'viewer']),
  ],
  inviteMember
);

// Cambiar rol de miembro — solo admin
router.patch('/:boardId/members/:userId',
  requireBoardRole('admin'),
  [body('role').isIn(['admin', 'member', 'viewer']).withMessage('Rol inválido')],
  updateMemberRole
);
// Búsqueda de tareas — viewer puede buscar
router.get('/:boardId/tasks/search', requireBoardRole('viewer'), searchTasks);

module.exports = router;