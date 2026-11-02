const Scheme = require('../models/Scheme');
const StudentProfile = require('../models/StudentProfile');
const StudentDocument = require('../models/StudentDocument');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');
const { evaluateSchemeEligibility } = require('../utils/eligibilityEngine');

// @desc    Get live dynamic dashboard metrics and aggregated data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch student profile, documents, notifications, schemes, and published announcements in parallel
    const [
      profile,
      allSchemes,
      documents,
      notifications,
      unreadNotificationsCount,
      announcements
    ] = await Promise.all([
      StudentProfile.findOne({ userId }),
      Scheme.find({}),
      StudentDocument.find({ userId }).sort({ createdAt: -1 }),
      Notification.find({ userId }).populate('documentId', 'documentName').sort({ createdAt: -1 }).limit(5),
      Notification.countDocuments({ userId, isRead: false }),
      Announcement.find({
        $or: [
          { publicationStatus: 'Published' },
          { isPublished: true, publicationStatus: { $nin: ['Draft', 'Unpublished'] } }
        ]
      }).sort({ publishedAt: -1, createdAt: -1 }).limit(6)
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compute document statistics
    let expiringSoonCount = 0;
    let expiredDocumentsCount = 0;
    const upcomingExpirations = [];

    documents.forEach((doc) => {
      if (doc.expiryDate) {
        const exp = new Date(doc.expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          expiredDocumentsCount++;
        } else if (diffDays <= 30) {
          expiringSoonCount++;
          upcomingExpirations.push({
            _id: doc._id,
            documentName: doc.documentName,
            expiryDate: doc.expiryDate,
            daysRemaining: diffDays,
            statusBadge: diffDays <= 7 ? 'danger' : 'warning'
          });
        }
      }
    });

    // Sort upcoming expirations by earliest expiry
    upcomingExpirations.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Compute live scheme eligibility for the student
    let potentiallyEligibleCount = 0;
    let partiallyEligibleCount = 0;
    const recommendedList = [];

    const profileObj = profile ? profile.toObject() : {};

    allSchemes.forEach((scheme) => {
      const evalResult = evaluateSchemeEligibility(scheme, profileObj);
      if (evalResult.overallStatus === 'Potentially Eligible') {
        potentiallyEligibleCount++;
        recommendedList.push({
          ...scheme.toObject(),
          eligibilityResult: evalResult
        });
      } else if (evalResult.overallStatus === 'Partially Eligible') {
        partiallyEligibleCount++;
        if (recommendedList.length < 5) {
          recommendedList.push({
            ...scheme.toObject(),
            eligibilityResult: evalResult
          });
        }
      }
    });

    return res.json({
      metrics: {
        totalSchemes: allSchemes.length,
        potentiallyEligibleCount,
        partiallyEligibleCount,
        totalSavedDocuments: documents.length,
        expiringSoonCount,
        expiredDocumentsCount,
        unreadNotificationsCount
      },
      recommendedSchemes: recommendedList.slice(0, 4),
      upcomingExpirations: upcomingExpirations.slice(0, 5),
      recentNotifications: notifications,
      announcements: announcements || [],
      hasCompletedProfile: Boolean(
        profile &&
        profile.category &&
        profile.annualFamilyIncome !== null &&
        profile.academicPercentage !== null
      )
    });
  } catch (error) {
    console.error('[Dashboard Controller] getDashboardData error:', error.message);
    return res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
};

module.exports = {
  getDashboardData
};
