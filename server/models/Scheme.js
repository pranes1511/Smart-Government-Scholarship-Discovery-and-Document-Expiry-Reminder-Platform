const mongoose = require('mongoose');

const eligibilityRuleSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      description: 'Profile field identifier to test'
    },
    operator: {
      type: String,
      required: true,
      enum: ['lte', 'gte', 'eq', 'in', 'nin', 'boolean_eq', 'custom'],
      default: 'eq'
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    mandatory: {
      type: Boolean,
      default: true
    },
    explanationOnFail: {
      type: String,
      default: ''
    },
    nextStepTip: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const schemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Merit-based',
        'Income-based',
        'Community-based',
        'Minority Welfare',
        'Technical Education',
        'Higher Education Assistance',
        'Disability Support',
        'State Government Welfare',
        'Girls & Women Education'
      ],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true
    },
    detailedDescription: {
      type: String,
      default: ''
    },
    ministry: {
      type: String,
      default: 'Ministry of Education, Government of India'
    },
    applicableStates: {
      type: [String],
      default: ['All India'],
      index: true
    },
    educationLevels: {
      type: [String],
      enum: ['Undergraduate', 'Postgraduate', 'Diploma', 'Doctorate', 'All Higher Education'],
      default: ['Undergraduate', 'Postgraduate']
    },
    eligibleCourses: {
      type: [String],
      default: ['All Courses']
    },
    eligibilityRules: {
      type: [eligibilityRuleSchema],
      default: []
    },
    benefits: {
      type: [String],
      default: []
    },
    requiredDocuments: {
      type: [String],
      default: []
    },
    applicationStartDate: {
      type: String,
      default: null
    },
    applicationDeadline: {
      type: String,
      default: null
    },
    applicationStatus: {
      type: String,
      enum: ['Open', 'Upcoming', 'Closed', 'Needs Official Verification', 'Always Open'],
      default: 'Needs Official Verification'
    },
    officialUrl: {
      type: String,
      required: true,
      trim: true
    },
    lastVerified: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    verificationStatus: {
      type: String,
      enum: [
        'Verified',
        'Needs Verification',
        'Outdated',
        'Verified Active',
        'Needs Official Verification',
        'Archived'
      ],
      default: 'Needs Verification',
      index: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

schemeSchema.index({ name: 'text', description: 'text', ministry: 'text' });

module.exports = mongoose.model('Scheme', schemeSchema);
