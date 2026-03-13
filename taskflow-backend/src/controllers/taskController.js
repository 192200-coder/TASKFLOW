// src/controllers/taskController.js
const { Task, TaskComment, TaskHistory, User, Column, BoardMember, Notification  } = require('../models');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

// ─── Helper: verificar rol del usuario en el tablero de una columna ───────────
// Devuelve el rol si tiene acceso, lanza error HTTP si no.
const ROLE_HIERARCHY = { viewer: 0, member: 1, admin: 2 };

const checkBoardRole = async (res, columnId, userId, minRole) => {
  const col = await Column.findByPk(columnId, { attributes: ['board_id'] });
  if (!col) {
    res.status(404).json({ error: 'Columna no encontrada' });
    return null;
  }
  const membership = await BoardMember.findOne({
    where: { board_id: col.board_id, user_id: userId },
  });
  if (!membership) {
    res.status(403).json({ error: 'No eres miembro de este tablero' });
    return null;
  }
  if ((ROLE_HIERARCHY[membership.role] ?? -1) < (ROLE_HIERARCHY[minRole] ?? 99)) {
    res.status(403).json({
      error: `Acción no permitida. Se requiere rol "${minRole}", tu rol es "${membership.role}"`,
    });
    return null;
  }
  return membership.role;
};

// ─── Crear tarea ──────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, column_id, position, priority, due_date, assigned_to } = req.body;

    // ── Verificar que el usuario tiene al menos rol "member" en el tablero ──
    const role = await checkBoardRole(res, column_id, req.user.id, 'member');
    if (!role) { await transaction.rollback(); return; }

    await sequelize.query(
      "SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'",
      { transaction }
    );

    const [taskId] = await sequelize.query(
      `INSERT INTO tasks 
       (title, description, priority, due_date, position, column_id, assigned_to, created_by, updated_by)
       VALUES 
       (:title, :description, :priority, :due_date, :position, :column_id, :assigned_to, :created_by, :updated_by)`,
      {
        replacements: {
          title,
          description:  description  || null,
          priority:     priority     || 'Media',
          due_date:     due_date     || null,
          position:     position     || 0,
          column_id,
          assigned_to:  assigned_to  || null,
          created_by:   req.user.id,
          updated_by:   req.user.id,
        },
        transaction,
      }
    );

    await TaskHistory.create({
      task_id:       taskId,
      user_id:       req.user.id,
      action:        'CREATE',
      field_changed: 'task',
      new_value:     `Tarea "${title}" creada`,
    }, { transaction });

    await transaction.commit();

    const taskWithDetails = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'creator',  attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json({ message: 'Tarea creada exitosamente', task: taskWithDetails });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
};

// ─── Obtener detalle de tarea ─────────────────────────────────────────────────
const getTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByPk(taskId, {
      include: [
        { model: User,        as: 'assignee', attributes: ['id', 'name', 'avatar_url'] },
        { model: User,        as: 'creator',  attributes: ['id', 'name'] },
        { model: User,        as: 'updater',  attributes: ['id', 'name'] },
        {
          model: TaskComment,
          as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
          order: [['created_at', 'ASC']],
        },
      ],
    });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    // Verificar que el usuario es al menos viewer del tablero
    const role = await checkBoardRole(res, task.column_id, req.user.id, 'viewer');
    if (!role) return;

    res.json(task);
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ error: 'Error al obtener la tarea' });
  }
};

// ─── Actualizar tarea ─────────────────────────────────────────────────────────
const updateTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { taskId } = req.params;
    const { title, description, priority, due_date, assigned_to } = req.body;

    const task = await Task.findByPk(taskId);
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // ── Verificar rol member ──
    const role = await checkBoardRole(res, task.column_id, req.user.id, 'member');
    if (!role) { await transaction.rollback(); return; }

    const oldValues = {
      title:       task.title,
      description: task.description,
      priority:    task.priority,
      due_date:    task.due_date,
      assigned_to: task.assigned_to,
    };

    await task.update({
      title:       title       !== undefined ? title       : task.title,
      description: description !== undefined ? description : task.description,
      priority:    priority    !== undefined ? priority    : task.priority,
      due_date:    due_date    !== undefined ? due_date    : task.due_date,
      assigned_to: assigned_to !== undefined ? assigned_to : task.assigned_to,
      updated_by:  req.user.id,
      updated_at:  new Date(),
    }, { transaction });

    const fields = ['title', 'description', 'priority', 'due_date', 'assigned_to'];
    for (const field of fields) {
      const newVal = req.body[field];
      if (newVal !== undefined && String(oldValues[field] ?? '') !== String(newVal ?? '')) {
        await TaskHistory.create({
          task_id:       task.id,
          user_id:       req.user.id,
          action:        'UPDATE',
          field_changed: field,
          old_value:     String(oldValues[field] ?? ''),
          new_value:     String(newVal ?? ''),
        }, { transaction });
      }
    }

    await transaction.commit();

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'creator',  attributes: ['id', 'name'] },
      ],
    });

    res.json({ message: 'Tarea actualizada exitosamente', task: updatedTask });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
};

// ─── Eliminar tarea ───────────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { taskId } = req.params;
    const task = await Task.findByPk(taskId);
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // ── Solo member o superior puede eliminar ──
    const role = await checkBoardRole(res, task.column_id, req.user.id, 'member');
    if (!role) { await transaction.rollback(); return; }

    await task.destroy({ transaction });
    await transaction.commit();
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
};

// ─── Mover tarea ──────────────────────────────────────────────────────────────
const moveTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { taskId } = req.params;
    const { column_id, position } = req.body;

    if (column_id === undefined || position === undefined) {
      await transaction.rollback();
      return res.status(400).json({ error: 'column_id y position son requeridos' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // ── Verificar en la columna ORIGEN ──
    const role = await checkBoardRole(res, task.column_id, req.user.id, 'member');
    if (!role) { await transaction.rollback(); return; }

    const oldColumnId = task.column_id;

    await sequelize.query(
      `UPDATE tasks 
       SET column_id = :column_id, position = :position, updated_by = :updated_by, updated_at = NOW()
       WHERE id = :taskId`,
      {
        replacements: { column_id, position, updated_by: req.user.id, taskId },
        transaction,
      }
    );

    if (String(oldColumnId) !== String(column_id)) {
      await TaskHistory.create({
        task_id:       task.id,
        user_id:       req.user.id,
        action:        'MOVE',
        field_changed: 'column_id',
        old_value:     String(oldColumnId),
        new_value:     String(column_id),
      }, { transaction });
    }

    await transaction.commit();

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'creator',  attributes: ['id', 'name'] },
      ],
    });

    res.json({ message: 'Tarea movida exitosamente', task: updatedTask });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al mover tarea:', error);
    res.status(500).json({ error: 'Error al mover la tarea' });
  }
};

// ─── Agregar comentario ───────────────────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    const allowed = await checkBoardRole(res, task.column_id, userId, 'member');
    if (!allowed) return;

    const column  = await Column.findByPk(task.column_id, { attributes: ['board_id'] });
    const boardId = column.board_id;

    const comment = await TaskComment.create({
      task_id:  taskId,
      user_id:  userId,
      content:  content.trim(),
    });

    const commentWithUser = await TaskComment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'avatar_url'] }],
    });

    // Responder antes de procesar menciones
    res.status(201).json({ comment: commentWithUser });

    // ── DEBUG: menciones ──────────────────────────────────────────────────
    console.log('🔍 [MENTIONS] content:', content);

    const mentionHandles = [...content.matchAll(/@([\w\u00C0-\u024F]+(?:\s[\w\u00C0-\u024F]+)?)/g)]
      .map(m => m[1].trim().toLowerCase());

    console.log('🔍 [MENTIONS] handles encontrados:', mentionHandles);

    if (mentionHandles.length === 0) {
      console.log('🔍 [MENTIONS] Sin menciones en el contenido, saliendo.');
      return;
    }

    const boardMembers = await BoardMember.findAll({
      where: { board_id: boardId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    });

    console.log('🔍 [MENTIONS] miembros del tablero:', boardMembers.map(m => ({
      user_id: m.user_id,
      name: m.user?.name,
    })));

    const mentionedUserIds = new Set();
    for (const member of boardMembers) {
      const memberName = member.user?.name?.toLowerCase() ?? '';
      const isMentioned = mentionHandles.some(handle =>
        memberName.startsWith(handle) || memberName === handle
      );
      console.log(`🔍 [MENTIONS] ¿"${memberName}" coincide con ${JSON.stringify(mentionHandles)}? → ${isMentioned}`);
      if (isMentioned && member.user_id !== userId) {
        mentionedUserIds.add(member.user_id);
      }
    }

    console.log('🔍 [MENTIONS] usuarios a notificar:', [...mentionedUserIds]);

    if (mentionedUserIds.size === 0) {
      console.log('🔍 [MENTIONS] Ningún usuario coincidió (o solo te mencionaste a ti mismo).');
      return;
    }

    const authorName = req.user.name ?? 'Alguien';
    const preview    = content.slice(0, 80) + (content.length > 80 ? '…' : '');

    const results = await Promise.allSettled(
      [...mentionedUserIds].map(mentionedId =>
        Notification.create({
          user_id: mentionedId,
          type:    'MENTION',
          data: {
            message:    `${authorName} te mencionó: "${preview}"`,
            task_id:    Number(taskId),
            board_id:   boardId,
            comment_id: comment.id,
          },
          is_read: false,
        })
      )
    );

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`🔍 [MENTIONS] Error creando notificación ${i}:`, r.reason);
      } else {
        console.log(`🔍 [MENTIONS] Notificación creada para user_id:`, [...mentionedUserIds][i]);
      }
    });

  } catch (error) {
    console.error('Error al añadir comentario:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al crear el comentario' });
    }
  }
};

// ─── Obtener comentarios ──────────────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByPk(taskId, { attributes: ['column_id'] });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    const role = await checkBoardRole(res, task.column_id, req.user.id, 'viewer');
    if (!role) return;

    const comments = await TaskComment.findAll({
      where: { task_id: taskId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['created_at', 'ASC']],
    });
    res.json(comments);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener los comentarios' });
  }
};

// ─── Eliminar comentario ──────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;

    const task = await Task.findByPk(taskId, { attributes: ['column_id'] });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    // Verificar membresía (viewer basta para encontrar, pero solo el autor puede borrar)
    const role = await checkBoardRole(res, task.column_id, req.user.id, 'viewer');
    if (!role) return;

    const comment = await TaskComment.findOne({
      where: { id: commentId, task_id: taskId, user_id: req.user.id },
    });
    if (!comment) return res.status(404).json({ error: 'Comentario no encontrado o sin permisos' });

    await comment.destroy();
    res.json({ message: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error al eliminar el comentario' });
  }
};

// ─── Historial de tarea ───────────────────────────────────────────────────────
const getTaskHistory = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId, { attributes: ['column_id'] });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    const role = await checkBoardRole(res, task.column_id, req.user.id, 'viewer');
    if (!role) return;

    const history = await TaskHistory.findAll({
      where: { task_id: taskId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(history);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial' });
  }
};

module.exports = {
  createTask, getTaskDetails, updateTask, deleteTask,
  moveTask, addComment, getComments, deleteComment, getTaskHistory,
};