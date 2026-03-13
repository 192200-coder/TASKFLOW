// src/controllers/notificationController.js
const { Notification } = require('../models');

const getMyNotifications = async (req, res) => {
  try {
    // Cache-Control: no-store — evita el 304 que hace que el cliente
    // siempre reciba la respuesta cacheada (vacía en el primer load)
    res.set('Cache-Control', 'no-store');

    const notifications = await Notification.findAll({
      where: {
        user_id: req.user.id,
        is_read: false,          // ← solo no leídas
      },
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

const markAsRead = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');

    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      where: { id: notificationId, user_id: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    await notification.update({ is_read: true });
    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error al actualizar la notificación' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');

    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({ error: 'Error al actualizar las notificaciones' });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };