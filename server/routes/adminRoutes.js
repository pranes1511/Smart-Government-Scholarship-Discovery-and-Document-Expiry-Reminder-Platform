const express = require('express');
const router = express.Router();
const {
  getAdminMetrics,
  getAllStudents,
  toggleStudentStatus,
  updateSchemeVerification,
  updateSchemeRules,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// All admin routes strictly require authentication and administrator role
router.use(protect, requireAdmin);

// Dashboard metrics
router.get('/metrics', getAdminMetrics);

// Student management
router.get('/students', getAllStudents);
router.put('/students/:id/status', toggleStudentStatus);

// Scheme management extensions
router.put('/schemes/:id/verification', updateSchemeVerification);
router.put('/schemes/:id/rules', updateSchemeRules);

// Announcement management
router.get('/announcements', getAdminAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
