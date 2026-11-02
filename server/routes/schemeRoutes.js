const express = require('express');
const router = express.Router();
const {
  getSchemes,
  getSchemeById,
  getSchemeEligibilityAnalysis,
  getRecommendedSchemes,
  compareSchemes,
  createScheme,
  updateScheme,
  deleteScheme
} = require('../controllers/schemeController');
const { protect, optionalProtect, requireAdmin, requireStudent } = require('../middleware/authMiddleware');

router.get('/', optionalProtect, getSchemes);
router.get('/recommended', protect, requireStudent, getRecommendedSchemes);
router.post('/eligibility', protect, requireStudent, getSchemeEligibilityAnalysis);
router.post('/compare', optionalProtect, compareSchemes);
router.get('/:id', optionalProtect, getSchemeById);

// Admin-only Scheme Management
router.post('/', protect, requireAdmin, createScheme);
router.put('/:id', protect, requireAdmin, updateScheme);
router.delete('/:id', protect, requireAdmin, deleteScheme);

module.exports = router;
