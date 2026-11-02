const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide announcement title'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Please provide announcement content'],
      trim: true
    },
    message: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['General', 'Deadline Extension', 'New Scheme', 'Urgent Notice', 'System', 'Scholarship Update', 'Verification', 'Maintenance'],
      default: 'General'
    },
    publicationStatus: {
      type: String,
      enum: ['Draft', 'Published', 'Unpublished'],
      default: 'Published',
      index: true
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

announcementSchema.pre('validate', function () {
  if (this.message && !this.content) {
    this.content = this.message;
  } else if (this.content && !this.message) {
    this.message = this.content;
  }
  if (this.publicationStatus) {
    this.isPublished = this.publicationStatus === 'Published';
  } else if (typeof this.isPublished === 'boolean') {
    this.publicationStatus = this.isPublished ? 'Published' : 'Draft';
  }
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

module.exports = mongoose.model('Announcement', announcementSchema);
