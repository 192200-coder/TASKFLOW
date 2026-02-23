// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getTaskDetails,
  addComment,
  getTaskHistory
} = require('../controllers/taskController');

router.use(authenticate);

router.post('/',
  [
    body('title').notEmpty().withMessage('El título es requerido'),
    body('column_id').isInt().withMessage('ID de columna inválido')
  ],
  createTask
);

router.put('/:taskId',
  [
    body('title').optional().notEmpty(),
    body('priority').optional().isIn(['Alta', 'Media', 'Baja'])
  ],
  updateTask
);

router.delete('/:taskId', deleteTask);
router.patch('/:taskId/move', moveTask);
router.get('/:taskId', getTaskDetails);
router.get('/:taskId/history', getTaskHistory);

router.post('/:taskId/comments',
  [
    body('content').notEmpty().withMessage('El comentario no puede estar vacío')
  ],
  addComment
);

module.exports = router;