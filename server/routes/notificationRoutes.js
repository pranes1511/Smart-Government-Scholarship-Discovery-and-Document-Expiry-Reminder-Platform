const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  triggerExpiryCheck
} = require('../controllers/notificationController');
const { protect, requireStudent } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', requireStudent, getNotifications);
router.get('/unread-count', requireStudent, getUnreadCount);
router.put('/read-all', requireStudent, markAllAsRead);
router.put('/:id/read', requireStudent, markAsRead);
router.post('/run-expiry-check', triggerExpiryCheck);

module.exports = router;
