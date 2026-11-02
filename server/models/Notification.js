const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentDocument',
      required: false,
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    reminderType: {
      type: String,
      enum: [
        '30_DAYS',
        '15_DAYS',
        '7_DAYS',
        'URGENT_EXPIRY',
        'EXPIRES_TODAY',
        'EXPIRED_ALERT',
        'GENERAL',
        'RENEWAL_CONFIRMATION'
      ],
      required: true
    },
    expiryDate: {
      type: Date,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  }
);

// Compound index to prevent duplicate reminders for the same document, interval and expiry date
notificationSchema.index(
  { userId: 1, documentId: 1, reminderType: 1, expiryDate: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
