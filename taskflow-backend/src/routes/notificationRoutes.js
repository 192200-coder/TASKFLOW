// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/:notificationId/read', markAsRead);
router.post('/read-all', markAllAsRead);

module.exports = router;