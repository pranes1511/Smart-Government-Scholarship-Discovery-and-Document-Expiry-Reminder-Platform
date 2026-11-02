const Notification = require('../models/Notification');
const { runExpiryCheck } = require('../utils/reminderService');

// @desc    Get all notifications for authenticated student
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('documentId', 'documentName documentType expiryDate')
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return res.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('[Notification Controller] getNotifications error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
};

// @desc    Get count of unread notifications
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return res.json({ unreadCount });
  } catch (error) {
    console.error('[Notification Controller] getUnreadCount error:', error.message);
    return res.status(500).json({ error: 'Failed to count unread notifications.' });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found or access denied.' });
    }

    return res.json({ message: 'Notification marked as read.', notification });
  } catch (error) {
    console.error('[Notification Controller] markAsRead error:', error.message);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
};

// @desc    Mark all student notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[Notification Controller] markAllAsRead error:', error.message);
    return res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
};

// @desc    Trigger document expiry check
// @route   POST /api/notifications/run-expiry-check
// @access  Private
const triggerExpiryCheck = async (req, res) => {
  try {
    const result = await runExpiryCheck();
    return res.json(result);
  } catch (error) {
    console.error('[Notification Controller] triggerExpiryCheck error:', error.message);
    return res.status(500).json({ error: 'Failed to execute expiry check.' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  triggerExpiryCheck
};
