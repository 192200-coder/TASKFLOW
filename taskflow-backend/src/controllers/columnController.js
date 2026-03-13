// src/controllers/columnController.js
const { Column, Task } = require('../models');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

const createColumn = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, board_id, position } = req.body;

    const column = await Column.create({
      name,
      board_id,
      position: position || 0,
    });

    res.status(201).json({ message: 'Columna creada exitosamente', column });
  } catch (error) {
    console.error('Error al crear columna:', error);
    res.status(500).json({ error: 'Error al crear la columna' });
  }
};

const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    const { name, position } = req.body;

    const column = await Column.findByPk(columnId);
    if (!column) return res.status(404).json({ error: 'Columna no encontrada' });

    await column.update({ name, position });

    res.json({ message: 'Columna actualizada exitosamente', column });
  } catch (error) {
    console.error('Error al actualizar columna:', error);
    res.status(500).json({ error: 'Error al actualizar la columna' });
  }
};

const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    const column = await Column.findByPk(columnId);
    if (!column) return res.status(404).json({ error: 'Columna no encontrada' });

    await column.destroy();

    res.json({ message: 'Columna eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar columna:', error);
    res.status(500).json({ error: 'Error al eliminar la columna' });
  }
};

const reorderColumns = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { boardId } = req.params;
    const { columns } = req.body; // [{ id, position }, ...]

    if (!Array.isArray(columns) || columns.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Se requiere un array de columnas con id y position' });
    }

    // ── PASO 1: desplazar todas las posiciones a un rango temporal alto ──────
    // Evita la violación del UNIQUE KEY (board_id, position) durante
    // el proceso de reasignación. +10000 garantiza no colisionar con valores reales.
    await sequelize.query(
      'UPDATE `columns` SET position = position + 10000 WHERE board_id = :boardId',
      { replacements: { boardId }, transaction }
    );

    // ── PASO 2: asignar posiciones definitivas en una sola query atómica ─────
    // CASE WHEN actualiza todas las filas en un único UPDATE, sin pasos intermedios
    // que puedan violar la restricción de unicidad.
    const caseWhen = columns
      .map(c => `WHEN id = ${parseInt(c.id)} THEN ${parseInt(c.position)}`)
      .join(' ');

    const ids = columns.map(c => parseInt(c.id));

    await sequelize.query(
      `UPDATE \`columns\`
       SET position   = CASE ${caseWhen} ELSE position END,
           updated_at = NOW()
       WHERE board_id = :boardId
         AND id IN (:ids)`,
      { replacements: { boardId, ids }, transaction }
    );

    await transaction.commit();

    // Devolver las columnas en el nuevo orden
    const updatedColumns = await Column.findAll({
      where: { board_id: boardId },
      order: [['position', 'ASC']],
      include: [{ model: Task, as: 'tasks', order: [['position', 'ASC']] }],
    });

    res.json({ message: 'Columnas reordenadas exitosamente', columns: updatedColumns });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al reordenar columnas:', error);
    res.status(500).json({ error: 'Error al reordenar las columnas' });
  }
};

module.exports = { createColumn, updateColumn, deleteColumn, reorderColumns };