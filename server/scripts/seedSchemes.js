require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, disconnectDB } = require('../config/db');
const Scheme = require('../models/Scheme');

const seedData = async () => {
  try {
    console.log('[Seed Script] Connecting to database...');
    await connectDB();

    const dataPath = path.join(__dirname, '..', 'data', 'schemes.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found at: ${dataPath}`);
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const schemes = JSON.parse(rawData);

    console.log(`[Seed Script] Found ${schemes.length} schemes in dataset. Seeding...`);

    let inserted = 0;
    let updated = 0;

    for (const item of schemes) {
      if (!item.name || !item.slug) {
        console.warn(`[Seed Script] Skipping invalid scheme item (missing name/slug): ${item.name}`);
        continue;
      }

      const existing = await Scheme.findOne({ slug: item.slug });
      if (existing) {
        await Scheme.updateOne({ slug: item.slug }, { $set: item });
        updated++;
      } else {
        await Scheme.create(item);
        inserted++;
      }
    }

    console.log(`[Seed Script] Complete! Seeded ${inserted} new schemes, updated ${updated} existing schemes.`);
    const totalInDb = await Scheme.countDocuments();
    console.log(`[Seed Script] Total active schemes in database: ${totalInDb}`);

    // Seed Admin Account
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
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
      console.log('[Seed Script] Seeded Administrator account: admin@schemesathi.gov.in (password: adminpassword123)');
    } else {
      console.log('[Seed Script] Administrator account already exists: admin@schemesathi.gov.in');
    }

    // Seed Demo Student Account
    const StudentProfile = require('../models/StudentProfile');
    const StudentDocument = require('../models/StudentDocument');
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
      console.log('[Seed Script] Seeded Demo Student: ananya.ramesh@college.edu (password: password123)');
    } else {
      console.log('[Seed Script] Demo student already exists: ananya.ramesh@college.edu');
    }
  } catch (err) {
    console.error('[Seed Script] Error during database seeding:', err.message);
  } finally {
    await disconnectDB();
    console.log('[Seed Script] Database disconnected.');
  }
};

if (require.main === module) {
  seedData().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedData;
