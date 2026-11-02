const cron = require('node-cron');
const StudentDocument = require('../models/StudentDocument');
const Notification = require('../models/Notification');

/**
 * Normalizes any date input (String, Date) to a consistent UTC midnight timestamp.
 * This ensures calendar dates (e.g. 2026-11-06) produce exact day differences
 * without timezone off-by-one errors.
 */
function toCalendarUtcMidnight(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput.trim())) {
    const parts = dateInput.trim().slice(0, 10).split('-').map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

/**
 * Calculates calendar days remaining until expiry date.
 * Consistent across entire backend.
 */
function getDaysRemaining(expiryDate, baseDate = new Date()) {
  if (!expiryDate) return null;
  const expUtc = toCalendarUtcMidnight(expiryDate);
  if (expUtc === null) return null;

  const base = new Date(baseDate);
  const baseUtc = Date.UTC(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);

  const diffMs = expUtc - baseUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates a single student document and generates immediate/scheduled reminder
 * according to platform notification policy.
 *
 * | Days remaining | Required notification |
 * | 30 days        | 30_DAYS reminder |
 * | 15 days        | 15_DAYS reminder |
 * | 7 days         | 7_DAYS reminder |
 * | 6-1 days       | URGENT_EXPIRY reminder |
 * | 0 days         | EXPIRES_TODAY reminder |
 * | < 0 days       | EXPIRED_ALERT notification |
 */
async function processDocumentReminder(doc) {
  if (!doc || !doc.expiryDate) return null;

  const daysRemaining = getDaysRemaining(doc.expiryDate);
  if (daysRemaining === null) return null;

  let reminderType = null;
  let title = '';
  let message = '';

  const docName = doc.documentName ? doc.documentName.trim() : 'Document';

  if (daysRemaining === 30) {
    reminderType = '30_DAYS';
    title = `${docName} expires in 30 days`;
    message = `${docName} expires in 30 days. Please prepare renewal.`;
  } else if (daysRemaining === 15) {
    reminderType = '15_DAYS';
    title = `${docName} expires in 15 days`;
    message = `${docName} expires in 15 days. Please apply for renewal.`;
  } else if (daysRemaining === 7) {
    reminderType = '7_DAYS';
    title = `${docName} expires in 7 days`;
    message = `${docName} expires in 7 days. Please renew it soon.`;
  } else if (daysRemaining >= 1 && daysRemaining <= 6) {
    reminderType = 'URGENT_EXPIRY';
    if (daysRemaining === 1) {
      title = `${docName} expires tomorrow`;
      message = `${docName} expires tomorrow.`;
    } else if (daysRemaining === 2) {
      title = `${docName} expires in 2 days`;
      message = `${docName} expires in 2 days. Please renew it immediately.`;
    } else {
      title = `${docName} expires in ${daysRemaining} days`;
      message = `${docName} expires in ${daysRemaining} days. Please renew it soon.`;
    }
  } else if (daysRemaining === 0) {
    reminderType = 'EXPIRES_TODAY';
    title = `${docName} expires today`;
    message = `${docName} expires today.`;
  } else if (daysRemaining < 0) {
    reminderType = 'EXPIRED_ALERT';
    title = `${docName} has expired`;
    message = `${docName} has expired. Please renew it to update your document tracker.`;
  }

  // Not at a reminder interval
  if (!reminderType) {
    return null;
  }

  const userId = doc.userId?._id || doc.userId;

  // Prevent duplicate notifications for same document, interval and expiry date
  const existing = await Notification.findOne({
    userId,
    documentId: doc._id,
    reminderType,
    expiryDate: doc.expiryDate
  });

  if (existing) {
    return null; // Already notified for this interval and date
  }

  try {
    const notification = await Notification.create({
      userId,
      documentId: doc._id,
      title,
      message,
      reminderType,
      expiryDate: doc.expiryDate,
      isRead: false
    });
    console.log(`[Reminder Service] Generated ${reminderType} for ${docName} (days: ${daysRemaining})`);
    return notification;
  } catch (err) {
    if (err.code === 11000) {
      // Compound unique index caught duplicate
      return null;
    }
    throw err;
  }
}

/**
 * Checks all active student documents and generates reminders idempotently.
 */
const runExpiryCheck = async () => {
  console.log('[Reminder Service] Running document expiry check...');
  let remindersCreated = 0;

  try {
    const documents = await StudentDocument.find({
      expiryDate: { $ne: null }
    });

    for (const doc of documents) {
      const created = await processDocumentReminder(doc);
      if (created) remindersCreated++;
    }

    console.log(`[Reminder Service] Expiry check completed. New notifications created: ${remindersCreated}`);
    return { success: true, remindersCreated };
  } catch (err) {
    console.error('[Reminder Service] Error running expiry check:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Initializes cron scheduler to run daily at midnight (00:00).
 */
const initReminderScheduler = () => {
  // Run once shortly after startup
  setTimeout(() => {
    runExpiryCheck().catch((err) =>
      console.error('[Reminder Service] Startup check error:', err.message)
    );
  }, 5000);

  // Schedule daily run at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('[Reminder Service] Triggering midnight scheduled expiry check...');
    runExpiryCheck();
  });

  console.log('[Reminder Service] Daily document expiry cron scheduler initialized (0 0 * * *).');
};

module.exports = {
  runExpiryCheck,
  processDocumentReminder,
  initReminderScheduler,
  getDaysRemaining,
  toCalendarUtcMidnight
};
