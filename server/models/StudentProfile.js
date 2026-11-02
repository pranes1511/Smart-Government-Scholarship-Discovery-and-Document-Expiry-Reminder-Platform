const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    // Personal Information
    fullName: {
      type: String,
      trim: true,
      default: ''
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    age: {
      type: Number,
      min: [14, 'Age must be at least 14'],
      max: [70, 'Age cannot exceed 70'],
      default: null
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Transgender', 'Other', 'Prefer not to say', ''],
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    district: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'EWS', 'BC', 'MBC', 'DNC', 'Minority', 'Other', ''],
      default: ''
    },

    // Academic Information
    collegeName: {
      type: String,
      trim: true,
      default: ''
    },
    collegeType: {
      type: String,
      enum: [
        'Government College',
        'Government-Aided College',
        'Private / Self-Financing',
        'Autonomous Institution',
        'Central University',
        'State University Campus',
        'Deemed University',
        'Other',
        ''
      ],
      default: ''
    },
    university: {
      type: String,
      trim: true,
      default: ''
    },
    course: {
      type: String,
      trim: true,
      default: ''
    },
    degreeType: {
      type: String,
      enum: ['Undergraduate', 'Postgraduate', 'Diploma', 'Doctorate', 'Integrated Master', 'Other', ''],
      default: 'Undergraduate'
    },
    studyYear: {
      type: Number,
      min: 1,
      max: 6,
      default: 1
    },
    admissionYear: {
      type: Number,
      default: new Date().getFullYear()
    },
    academicPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    collegeRecognized: {
      type: Boolean,
      default: true
    },

    // Financial Information
    annualFamilyIncome: {
      type: Number,
      min: 0,
      default: null
    },
    incomeCategory: {
      type: String,
      enum: [
        'Below ₹1,00,000',
        '₹1,00,000 - ₹2,50,000',
        '₹2,50,000 - ₹4,50,000',
        '₹4,50,000 - ₹8,00,000',
        'Above ₹8,00,000',
        'Not Specified',
        ''
      ],
      default: ''
    },
    scholarshipReceiving: {
      type: Boolean,
      default: false
    },

    // Scheme-specific attributes (disability, single girl child, hostel status, etc.)
    additionalEligibilityInformation: {
      isPersonWithDisability: { type: Boolean, default: false },
      disabilityPercentage: { type: Number, default: 0 },
      isSingleGirlChild: { type: Boolean, default: false },
      isHosteler: { type: Boolean, default: false },
      isFirstGraduate: { type: Boolean, default: false },
      isGovernmentSchoolStudent: { type: Boolean, default: false } // e.g. For TN 7.5% quota / Puthumai Penn
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
