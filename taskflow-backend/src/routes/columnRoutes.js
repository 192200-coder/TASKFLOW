// src/routes/columnRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireBoardRole } = require('../middleware/boardAuth');
const {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} = require('../controllers/columnController');

router.use(authenticate);

// Crear — board_id viene en body, el middleware lo lee de ahí
router.post('/',
  [
    body('name').notEmpty().withMessage('El nombre de la columna es requerido'),
    body('board_id').isInt().withMessage('ID de tablero inválido'),
  ],
  requireBoardRole('member'),
  createColumn
);

// Renombrar — el middleware infiere boardId desde :columnId
router.put('/:columnId',
  [body('name').optional().notEmpty()],
  requireBoardRole('member'),
  updateColumn
);

// Eliminar — solo admin
router.delete('/:columnId',
  requireBoardRole('admin'),
  deleteColumn
);

// Reordenar — boardId viene en la URL
router.post('/board/:boardId/reorder',
  requireBoardRole('member'),
  reorderColumns
);

module.exports = router;