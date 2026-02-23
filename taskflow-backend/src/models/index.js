// src/models/index.js
const User          = require('./User');
const Board         = require('./Board');
const BoardMember   = require('./BoardMember');
const Column        = require('./Column');
const Task          = require('./Task');
const TaskComment   = require('./TaskComment');
const TaskAttachment = require('./TaskAttachment');
const TaskHistory   = require('./TaskHistory');
const Notification  = require('./Notification');

// ── User ↔ Board (dueño) ──────────────────────────────────────────────────────
User.hasMany(Board, { foreignKey: 'owner_id', as: 'ownedBoards' });
Board.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// ── User ↔ Board (miembros M:M) ───────────────────────────────────────────────
User.belongsToMany(Board, {
  through: BoardMember,
  foreignKey: 'user_id',
  otherKey: 'board_id',
  as: 'memberBoards',
});
Board.belongsToMany(User, {
  through: BoardMember,
  foreignKey: 'board_id',
  otherKey: 'user_id',
  as: 'members',
});

// Asociación directa con BoardMember para poder hacer WHERE en includes
Board.hasMany(BoardMember, { foreignKey: 'board_id', as: 'boardMembers' });
BoardMember.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });
BoardMember.belongsTo(User,  { foreignKey: 'user_id',  as: 'user' });

// ── Board ↔ Column ────────────────────────────────────────────────────────────
Board.hasMany(Column, { foreignKey: 'board_id', as: 'columns' });
Column.belongsTo(Board, { foreignKey: 'board_id', as: 'board' });

// ── Column ↔ Task ─────────────────────────────────────────────────────────────
Column.hasMany(Task, { foreignKey: 'column_id', as: 'tasks' });
Task.belongsTo(Column, { foreignKey: 'column_id', as: 'column' });

// ── User ↔ Task (asignada) ────────────────────────────────────────────────────
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// ── User ↔ Task (creada) ──────────────────────────────────────────────────────
User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── User ↔ Task (actualizada) ─────────────────────────────────────────────────
User.hasMany(Task, { foreignKey: 'updated_by', as: 'updatedTasks' });
Task.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// ── Task ↔ TaskComment ────────────────────────────────────────────────────────
Task.hasMany(TaskComment, { foreignKey: 'task_id', as: 'comments' });
TaskComment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
TaskComment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── Task ↔ TaskAttachment ─────────────────────────────────────────────────────
Task.hasMany(TaskAttachment, { foreignKey: 'task_id', as: 'attachments' });
TaskAttachment.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
TaskAttachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// ── Task ↔ TaskHistory ────────────────────────────────────────────────────────
Task.hasMany(TaskHistory, { foreignKey: 'task_id', as: 'history' });
TaskHistory.belongsTo(Task, { foreignKey: 'task_id', as: 'task' });
TaskHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── User ↔ Notification ───────────────────────────────────────────────────────
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User, Board, BoardMember, Column,
  Task, TaskComment, TaskAttachment, TaskHistory,
  Notification,
};