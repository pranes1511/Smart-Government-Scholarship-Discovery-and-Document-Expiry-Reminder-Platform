const mongoose = require('mongoose');

const studentDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    documentName: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true
    },
    documentType: {
      type: String,
      trim: true,
      default: 'General Certificate'
    },
    expiryDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user document lookup
studentDocumentSchema.index({ userId: 1, documentName: 1 });

module.exports = mongoose.model('StudentDocument', studentDocumentSchema);
