// src/controllers/boardController.js  — VERSIÓN COMPLETA ACTUALIZADA
const { Board, BoardMember, Column, Task, User } = require('../models');
const sequelize = require('../config/database');
const { validationResult } = require('express-validator');

// ─── Crear tablero ────────────────────────────────────────────────────────────
const createBoard = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, description, cover_image_url } = req.body;
    const owner_id = req.user.id;

    const board = await Board.create(
      { name, description, cover_image_url, owner_id },
      { transaction }
    );
    await BoardMember.create(
      { board_id: board.id, user_id: owner_id, role: 'admin' },
      { transaction }
    );
    const defaultColumns = [
      { name: 'Por Hacer',   position: 0, board_id: board.id },
      { name: 'En Progreso', position: 1, board_id: board.id },
      { name: 'Hecho',       position: 2, board_id: board.id },
    ];
    await Column.bulkCreate(defaultColumns, { transaction });
    await transaction.commit();

    const boardWithColumns = await Board.findByPk(board.id, {
      include: [{ model: Column, as: 'columns' }],
    });
    res.status(201).json({ message: 'Tablero creado exitosamente', board: boardWithColumns });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear tablero:', error);
    res.status(500).json({ error: 'Error al crear el tablero' });
  }
};

// ─── Obtener mis tableros ─────────────────────────────────────────────────────
const getMyBoards = async (req, res) => {
  try {
    const userId = req.user.id;
    const boards = await Board.findAll({
      include: [
        {
          model: BoardMember,
          as: 'boardMembers',
          where: { user_id: userId },
          attributes: [],
        },
        { model: Column, as: 'columns', attributes: ['id', 'name', 'position'] },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar_url'],
          through: { attributes: ['role'] },
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(boards);
  } catch (error) {
    console.error('Error al obtener tableros:', error);
    res.status(500).json({ error: 'Error al obtener los tableros' });
  }
};

// ─── Obtener tablero por ID (con columnas + tareas) ───────────────────────────
const getBoardById = async (req, res) => {
  try {
    const { boardId } = req.params;

    // Verificar membresía antes de la consulta pesada
    const isMember = await BoardMember.findOne({
      where: { board_id: boardId, user_id: req.user.id },
    });
    if (!isMember) {
      return res.status(403).json({ error: 'No tienes acceso a este tablero' });
    }

    const board = await Board.findByPk(boardId, {
      include: [
        {
          model: Column,
          as: 'columns',
          include: [
            {
              model: Task,
              as: 'tasks',
              include: [
                { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_url'] },
                { model: User, as: 'creator',  attributes: ['id', 'name'] },
              ],
            },
          ],
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar_url'],
          through: { attributes: ['role', 'joined_at'] },
        },
      ],
      order: [
        [{ model: Column, as: 'columns' }, 'position', 'ASC'],
        [{ model: Column, as: 'columns' }, { model: Task, as: 'tasks' }, 'position', 'ASC'],
      ],
    });

    if (!board) {
      return res.status(404).json({ error: 'Tablero no encontrado' });
    }

    res.json(board);
  } catch (error) {
    console.error('Error al obtener tablero:', error);
    res.status(500).json({ error: 'Error al obtener el tablero' });
  }
};

// ─── Actualizar tablero ───────────────────────────────────────────────────────
const updateBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, description, cover_image_url } = req.body;
    const board = await Board.findByPk(boardId);
    if (!board) return res.status(404).json({ error: 'Tablero no encontrado' });

    const membership = await BoardMember.findOne({
      where: { board_id: boardId, user_id: req.user.id, role: 'admin' },
    });
    if (!membership) return res.status(403).json({ error: 'No tienes permisos para editar este tablero' });

    await board.update({ name, description, cover_image_url });
    res.json({ message: 'Tablero actualizado exitosamente', board });
  } catch (error) {
    console.error('Error al actualizar tablero:', error);
    res.status(500).json({ error: 'Error al actualizar el tablero' });
  }
};

// ─── Eliminar tablero ─────────────────────────────────────────────────────────
const deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findByPk(boardId);
    if (!board) return res.status(404).json({ error: 'Tablero no encontrado' });

    if (board.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Solo el dueño puede eliminar el tablero' });
    }
    await board.destroy();
    res.json({ message: 'Tablero eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tablero:', error);
    res.status(500).json({ error: 'Error al eliminar el tablero' });
  }
};

// ─── Invitar miembro ──────────────────────────────────────────────────────────
const inviteMember = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { email, role } = req.body;
    const membership = await BoardMember.findOne({
      where: { board_id: boardId, user_id: req.user.id, role: 'admin' },
    });
    if (!membership) return res.status(403).json({ error: 'No tienes permisos para invitar miembros' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const existingMember = await BoardMember.findOne({
      where: { board_id: boardId, user_id: user.id },
    });
    if (existingMember) return res.status(400).json({ error: 'El usuario ya es miembro del tablero' });

    await BoardMember.create({ board_id: boardId, user_id: user.id, role: role || 'member' });
    res.json({ message: 'Miembro agregado exitosamente' });
  } catch (error) {
    console.error('Error al invitar miembro:', error);
    res.status(500).json({ error: 'Error al invitar miembro' });
  }
};

module.exports = { createBoard, getMyBoards, getBoardById, updateBoard, deleteBoard, inviteMember };