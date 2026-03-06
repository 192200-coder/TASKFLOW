// src/middleware/boardAuth.js
const { BoardMember, Column, Task } = require('../models');

const ROLE_HIERARCHY = { viewer: 0, member: 1, admin: 2 };

/**
 * requireBoardRole(minRole)
 *
 * Busca el boardId en este orden:
 *  1. req.params.boardId           → rutas tipo /:boardId/...
 *  2. req.body.board_id            → POST /columns con board_id en body
 *  3. Desde la columna             → cuando hay req.params.columnId
 *  4. Desde la tarea → columna     → cuando hay req.params.taskId
 */
const requireBoardRole = (minRole) => async (req, res, next) => {
  try {
    let boardId = req.params.boardId ?? req.body.board_id ?? null;

    // Inferir desde columna
    if (!boardId && req.params.columnId) {
      const col = await Column.findByPk(req.params.columnId, { attributes: ['board_id'] });
      if (!col) return res.status(404).json({ error: 'Columna no encontrada' });
      boardId = col.board_id;
    }

    // Inferir desde tarea → columna
    if (!boardId && req.params.taskId) {
      const task = await Task.findByPk(req.params.taskId, {
        attributes: ['column_id'],
        include: [{ model: Column, as: 'column', attributes: ['board_id'] }],
      });
      if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
      boardId = task.column?.board_id;
    }

    if (!boardId) {
      return res.status(400).json({ error: 'No se pudo determinar el tablero' });
    }

    const membership = await BoardMember.findOne({
      where: { board_id: boardId, user_id: req.user.id },
    });

    if (!membership) {
      return res.status(403).json({ error: 'No eres miembro de este tablero' });
    }

    const userLevel = ROLE_HIERARCHY[membership.role] ?? -1;
    const required  = ROLE_HIERARCHY[minRole]         ?? 99;

    if (userLevel < required) {
      return res.status(403).json({
        error: `Acción no permitida. Se requiere rol "${minRole}", tu rol es "${membership.role}"`,
      });
    }

    req.boardRole = membership.role;
    req.boardId   = boardId;
    next();
  } catch (error) {
    console.error('Error en requireBoardRole:', error);
    res.status(500).json({ error: 'Error al verificar permisos del tablero' });
  }
};

module.exports = { requireBoardRole };