// src/controllers/columnController.js
const { Column, Task } = require('../models');
const { validationResult } = require('express-validator');

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
      position: position || 0
    });

    res.status(201).json({
      message: 'Columna creada exitosamente',
      column
    });
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
    if (!column) {
      return res.status(404).json({ error: 'Columna no encontrada' });
    }

    await column.update({ name, position });

    res.json({
      message: 'Columna actualizada exitosamente',
      column
    });
  } catch (error) {
    console.error('Error al actualizar columna:', error);
    res.status(500).json({ error: 'Error al actualizar la columna' });
  }
};

const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    const column = await Column.findByPk(columnId);
    if (!column) {
      return res.status(404).json({ error: 'Columna no encontrada' });
    }

    await column.destroy();

    res.json({ message: 'Columna eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar columna:', error);
    res.status(500).json({ error: 'Error al eliminar la columna' });
  }
};

const reorderColumns = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { columns } = req.body; // Array de { id, position }

    // Actualizar cada columna con su nueva posición
    for (const col of columns) {
      await Column.update(
        { position: col.position },
        { where: { id: col.id, board_id: boardId } }
      );
    }

    res.json({ message: 'Columnas reordenadas exitosamente' });
  } catch (error) {
    console.error('Error al reordenar columnas:', error);
    res.status(500).json({ error: 'Error al reordenar las columnas' });
  }
};

module.exports = {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns
};