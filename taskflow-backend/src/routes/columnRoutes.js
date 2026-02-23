// src/routes/columnRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns
} = require('../controllers/columnController');

router.use(authenticate);

router.post('/',
  [
    body('name').notEmpty().withMessage('El nombre de la columna es requerido'),
    body('board_id').isInt().withMessage('ID de tablero inválido')
  ],
  createColumn
);

router.put('/:columnId',
  [
    body('name').optional().notEmpty()
  ],
  updateColumn
);

router.delete('/:columnId', deleteColumn);
router.post('/board/:boardId/reorder', reorderColumns);

module.exports = router;