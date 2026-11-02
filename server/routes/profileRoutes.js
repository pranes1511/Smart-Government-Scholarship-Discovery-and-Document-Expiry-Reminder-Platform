const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect, requireStudent } = require('../middleware/authMiddleware');

router.use(protect, requireStudent);

router.get('/', getProfile);
router.post('/', updateProfile);
router.put('/', updateProfile);

module.exports = router;
