require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const Scheme = require('./models/Scheme');
const { initReminderScheduler } = require('./utils/reminderService');

// Route imports
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during local development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Smart Government Scheme Discovery & Document Expiry Reminder API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);

// 404 Handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Auto-seed schemes if database is freshly initialized
const autoSeedIfEmpty = async () => {
  try {
    const count = await Scheme.countDocuments();
    if (count === 0) {
      console.log('[Server Startup] Schemes collection is empty. Auto-seeding initial catalogue...');
      const schemesJson = require('./data/schemes.json');
      await Scheme.insertMany(schemesJson);
      console.log(`[Server Startup] Auto-seeded ${schemesJson.length} verified government schemes.`);
    } else {
      console.log(`[Server Startup] Verified active schemes in database: ${count}`);
    }

    // Auto-seed default Administrator account
    const existingAdmin = await User.findOne({ email: 'admin@schemesathi.gov.in' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminpassword123', salt);
      await User.create({
        name: 'Portal Administrator',
        email: 'admin@schemesathi.gov.in',
        password: hashedPassword,
        role: 'admin',
        collegeName: 'State Higher Education Council',
        course: 'System Administration',
        state: 'All India'
      });
      console.log('[Server Startup] Auto-seeded Administrator account: admin@schemesathi.gov.in');
    }

    // Auto-seed default Demo Student account (Ananya Ramesh)
    const StudentProfile = require('./models/StudentProfile');
    const StudentDocument = require('./models/StudentDocument');
    const existingStudent = await User.findOne({ email: 'ananya.ramesh@college.edu' });
    if (!existingStudent) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const studentUser = await User.create({
        name: 'Ananya Ramesh',
        email: 'ananya.ramesh@college.edu',
        password: hashedPassword,
        role: 'student',
        collegeName: 'PSG College of Technology',
        course: 'B.Tech Information Technology',
        studyYear: 2,
        state: 'Tamil Nadu'
      });

      await StudentProfile.create({
        userId: studentUser._id,
        fullName: 'Ananya Ramesh',
        dateOfBirth: new Date('2005-06-15'),
        age: 20,
        gender: 'Female',
        state: 'Tamil Nadu',
        district: 'Coimbatore',
        category: 'BC',
        collegeName: 'PSG College of Technology',
        collegeType: 'Government-Aided College',
        university: 'Anna University',
        course: 'B.Tech Information Technology',
        degreeType: 'Undergraduate',
        studyYear: 2,
        admissionYear: 2024,
        academicPercentage: 84.5,
        collegeRecognized: true,
        annualFamilyIncome: 180000,
        incomeCategory: '₹1,00,000 - ₹2,50,000',
        scholarshipReceiving: false,
        additionalEligibilityInformation: {
          isPersonWithDisability: false,
          disabilityPercentage: 0,
          isSingleGirlChild: true,
          isHosteler: true,
          isFirstGraduate: true,
          isGovernmentSchoolStudent: true
        }
      });

      const now = new Date();
      const exp18Days = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000);
      const exp6Months = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

      await StudentDocument.create([
        {
          userId: studentUser._id,
          documentName: 'Income Certificate',
          documentType: 'Revenue Certificate',
          expiryDate: exp18Days
        },
        {
          userId: studentUser._id,
          documentName: 'Community Certificate',
          documentType: 'Caste Certificate',
          expiryDate: null
        },
        {
          userId: studentUser._id,
          documentName: 'Nativity Certificate',
          documentType: 'Domicile Certificate',
          expiryDate: exp6Months
        },
        {
          userId: studentUser._id,
          documentName: 'Bonafide Certificate',
          documentType: 'Institutional Certificate',
          expiryDate: exp6Months
        }
      ]);

      console.log('[Server Startup] Auto-seeded Demo Student account: ananya.ramesh@college.edu (password: password123)');
    }

    // Auto-seed initial platform announcement
    const countAnnouncements = await Announcement.countDocuments();
    if (countAnnouncements === 0) {
      await Announcement.create({
        title: 'National Scholarship Portal 2026-27 Registrations Open',
        content: 'Students eligible for post-matric and merit-cum-means scholarships are advised to verify their income certificates and apply on official portals before deadlines.',
        category: 'General',
        isPublished: true
      });
      console.log('[Server Startup] Auto-seeded initial platform announcement.');
    }
  } catch (err) {
    console.warn('[Server Startup] Auto-seed check warning:', err.message);
  }
};

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    await autoSeedIfEmpty();
    initReminderScheduler();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  Student Scheme Discovery & Document Reminder Server   `);
      console.log(`  Running on: http://localhost:${PORT}                 `);
      console.log(`  Health API: http://localhost:${PORT}/api/health      `);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[Server Startup Fatal Error]:', error.message);
    process.exit(1);
  }
};

startServer();
