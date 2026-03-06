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
  getComments,
  deleteComment,
  getTaskHistory,
} = require('../controllers/taskController');

// NOTA sobre permisos en tareas:
// Las rutas de tareas no reciben boardId directamente — reciben column_id o taskId.
// La verificación de rol se hace DENTRO de cada controller consultando la columna
// para obtener el board_id y luego verificando board_members.
// Ver taskController_boardcheck.js para los helpers a añadir.

router.use(authenticate);

router.post('/',
  [
    body('title').notEmpty().withMessage('El título es requerido'),
    body('column_id').isInt().withMessage('ID de columna inválido'),
  ],
  createTask
);

router.get('/:taskId',         getTaskDetails);
router.get('/:taskId/history', getTaskHistory);

router.put('/:taskId',
  [
    body('title').optional().notEmpty(),
    body('priority').optional().isIn(['Alta', 'Media', 'Baja']),
  ],
  updateTask
);

router.delete('/:taskId',     deleteTask);
router.patch('/:taskId/move', moveTask);

router.get('/:taskId/comments',  getComments);
router.post('/:taskId/comments',
  [body('content').notEmpty().withMessage('El comentario no puede estar vacío')],
  addComment
);
router.delete('/:taskId/comments/:commentId', deleteComment);

module.exports = router;