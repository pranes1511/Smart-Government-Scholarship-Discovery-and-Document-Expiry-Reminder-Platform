const StudentDocument = require('../models/StudentDocument');
const Notification = require('../models/Notification');
const Scheme = require('../models/Scheme');
const { checkDocumentReadiness } = require('../utils/documentReadiness');
const {
  processDocumentReminder,
  getDaysRemaining
} = require('../utils/reminderService');

// @desc    Get all saved documents for authenticated student
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const documents = await StudentDocument.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Enrich documents with status and daysRemaining using unified calendar logic
    const enriched = documents.map((doc) => {
      const docObj = doc.toObject();
      if (!doc.expiryDate) {
        docObj.status = 'No Expiry Date';
        docObj.statusBadge = 'secondary';
        docObj.daysRemaining = null;
      } else {
        const diffDays = getDaysRemaining(doc.expiryDate);
        docObj.daysRemaining = diffDays;

        if (diffDays < 0) {
          docObj.status = 'Expired';
          docObj.statusBadge = 'danger';
        } else if (diffDays <= 7) {
          docObj.status = 'Expiring Soon';
          docObj.statusBadge = 'danger';
          docObj.isUrgent = true;
        } else if (diffDays <= 30) {
          docObj.status = 'Expiring Soon';
          docObj.statusBadge = 'warning';
        } else {
          docObj.status = 'Valid';
          docObj.statusBadge = 'success';
        }
      }
      return docObj;
    });

    return res.json({ documents: enriched, count: enriched.length });
  } catch (error) {
    console.error('[Document Controller] getDocuments error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve student documents.' });
  }
};

// @desc    Add a document record (Strict Zero-PII / No-File Storage)
// @route   POST /api/documents
// @access  Private
const addDocument = async (req, res) => {
  try {
    const { documentName, documentType, expiryDate } = req.body;

    if (!documentName || !documentName.trim()) {
      return res.status(400).json({ error: 'Please provide document name (e.g. Income Certificate).' });
    }

    // Strict Privacy enforcement: Reject prohibited fields if accidentally passed
    if (req.body.certificateNumber || req.body.aadhaarNumber || req.body.file || req.body.filePath) {
      console.warn('[Privacy Protection] Stripped prohibited sensitive fields from document input.');
    }

    let parsedExpiry = null;
    if (expiryDate && typeof expiryDate === 'string' && expiryDate.trim() !== '') {
      if (/^\d{4}-\d{2}-\d{2}/.test(expiryDate.trim())) {
        const parts = expiryDate.trim().slice(0, 10).split('-').map(Number);
        parsedExpiry = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
      } else {
        const d = new Date(expiryDate);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: 'Invalid expiry date format. Please provide a valid date.' });
        }
        parsedExpiry = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      }
    } else if (expiryDate instanceof Date) {
      parsedExpiry = new Date(Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate(), 0, 0, 0, 0));
    }

    const document = await StudentDocument.create({
      userId: req.user._id,
      documentName: documentName.trim(),
      documentType: documentType ? documentType.trim() : 'Certificate',
      expiryDate: parsedExpiry
    });

    // Check reminders immediately and synchronously so notification exists before returning
    if (parsedExpiry) {
      await processDocumentReminder(document);
    }

    return res.status(201).json({
      message: 'Document record saved successfully.',
      document
    });
  } catch (error) {
    console.error('[Document Controller] addDocument error:', error.message);
    return res.status(500).json({ error: 'Failed to save document record.' });
  }
};

// @desc    Update / Renew document record
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentName, documentType, expiryDate } = req.body;

    const document = await StudentDocument.findOne({ _id: id, userId: req.user._id });
    if (!document) {
      return res.status(404).json({ error: 'Document record not found or access denied.' });
    }

    const oldExpiryDate = document.expiryDate;

    if (documentName) document.documentName = documentName.trim();
    if (documentType) document.documentType = documentType.trim();

    if (expiryDate !== undefined) {
      if (!expiryDate || (typeof expiryDate === 'string' && expiryDate.trim() === '')) {
        document.expiryDate = null;
      } else {
        let parsedExpiry = null;
        if (typeof expiryDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(expiryDate.trim())) {
          const parts = expiryDate.trim().slice(0, 10).split('-').map(Number);
          parsedExpiry = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
        } else {
          const d = new Date(expiryDate);
          if (isNaN(d.getTime())) {
            return res.status(400).json({ error: 'Invalid expiry date format.' });
          }
          parsedExpiry = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
        }
        document.expiryDate = parsedExpiry;
      }
    }

    await document.save();

    // If renewed with a new expiry date, remove outdated expiry notifications for this document
    if (
      document.expiryDate &&
      (!oldExpiryDate || new Date(oldExpiryDate).getTime() !== new Date(document.expiryDate).getTime())
    ) {
      await Notification.deleteMany({
        documentId: document._id,
        reminderType: { $ne: 'RENEWAL_CONFIRMATION' }
      });

      // Send a renewal confirmation notice
      await Notification.create({
        userId: req.user._id,
        documentId: document._id,
        title: `Document Renewed: ${document.documentName}`,
        message: `Your ${document.documentName} expiry has been updated to ${new Date(document.expiryDate).toLocaleDateString('en-IN')}. New reminder alerts have been scheduled.`,
        reminderType: 'RENEWAL_CONFIRMATION',
        expiryDate: document.expiryDate,
        isRead: false
      });

      // Recalculate reminders immediately for new expiry schedule
      await processDocumentReminder(document);
    } else if (!document.expiryDate && oldExpiryDate) {
      // Document changed to no expiry date, remove pending expiry reminders
      await Notification.deleteMany({
        documentId: document._id,
        reminderType: { $in: ['30_DAYS', '15_DAYS', '7_DAYS', 'URGENT_EXPIRY', 'EXPIRES_TODAY', 'EXPIRED_ALERT'] }
      });
    }

    return res.json({
      message: 'Document record updated successfully.',
      document
    });
  } catch (error) {
    console.error('[Document Controller] updateDocument error:', error.message);
    return res.status(500).json({ error: 'Failed to update document.' });
  }
};

// @desc    Delete document record
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await StudentDocument.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document record not found or access denied.' });
    }

    // Cascade delete linked notifications
    await Notification.deleteMany({ documentId: id });

    return res.json({ message: 'Document record deleted successfully.' });
  } catch (error) {
    console.error('[Document Controller] deleteDocument error:', error.message);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
};

// @desc    Check document readiness for a specific scholarship scheme
// @route   GET /api/documents/readiness/:schemeId
// @access  Private
const getDocumentReadiness = async (req, res) => {
  try {
    const { schemeId } = req.params;

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({ error: 'Scholarship scheme not found.' });
    }

    const savedDocuments = await StudentDocument.find({ userId: req.user._id });

    const readiness = checkDocumentReadiness(scheme.requiredDocuments || [], savedDocuments);

    return res.json({
      scheme: {
        _id: scheme._id,
        name: scheme.name,
        category: scheme.category,
        requiredDocuments: scheme.requiredDocuments
      },
      readiness
    });
  } catch (error) {
    console.error('[Document Controller] getDocumentReadiness error:', error.message);
    return res.status(500).json({ error: 'Failed to check document readiness.' });
  }
};

module.exports = {
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocumentReadiness
};
