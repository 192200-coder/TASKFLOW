// src/controllers/taskController.js
const { Task, TaskComment, TaskHistory, User, Column } = require('../models');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

// ─── Crear tarea ──────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    await sequelize.query(
      "SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'",
      { transaction }
    );

    const { title, description, column_id, position, priority, due_date, assigned_to } = req.body;

    const [taskId] = await sequelize.query(
      `INSERT INTO tasks 
       (title, description, priority, due_date, position, column_id, assigned_to, created_by, updated_by)
       VALUES 
       (:title, :description, :priority, :due_date, :position, :column_id, :assigned_to, :created_by, :updated_by)`,
      {
        replacements: {
          title,
          description: description || null,
          priority: priority || 'Media',
          due_date: due_date || null,
          position: position || 0,
          column_id,
          assigned_to: assigned_to || null,
          created_by: req.user.id,
          updated_by: req.user.id,
        },
        transaction,
      }
    );

    await TaskHistory.create({
      task_id: taskId,
      user_id: req.user.id,
      action: 'CREATE',
      field_changed: 'task',
      new_value: `Tarea "${title}" creada`,
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
        { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_url'] },
        { model: User, as: 'creator',  attributes: ['id', 'name'] },
        { model: User, as: 'updater',  attributes: ['id', 'name'] },
        {
          model: TaskComment,
          as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
          order: [['created_at', 'ASC']],
        },
      ],
    });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
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

    // Historial de cambios
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

    const oldColumnId = task.column_id;

    // ✅ Query directa — evita el bug de timestamps: false con .update()
    await sequelize.query(
      `UPDATE tasks 
       SET column_id = :column_id, position = :position, updated_by = :updated_by, updated_at = NOW()
       WHERE id = :taskId`,
      {
        replacements: {
          column_id,
          position,
          updated_by: req.user.id,
          taskId,
        },
        transaction,
      }
    );

    // Registrar en historial solo si cambió de columna
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

    // Devolver la tarea actualizada
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

    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    const comment = await TaskComment.create({
      content,
      task_id: taskId,
      user_id: req.user.id,
    });

    const commentWithUser = await TaskComment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_url'] }],
    });

    res.status(201).json({ message: 'Comentario agregado exitosamente', comment: commentWithUser });
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ error: 'Error al agregar el comentario' });
  }
};

// ─── Obtener comentarios ──────────────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
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