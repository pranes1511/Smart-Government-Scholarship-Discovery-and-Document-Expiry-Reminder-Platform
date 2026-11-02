const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Helper handler for retrieving published announcements
const getPublishedAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      $or: [
        { publicationStatus: 'Published' },
        { isPublished: true, publicationStatus: { $nin: ['Draft', 'Unpublished'] } }
      ]
    }).sort({ publishedAt: -1, createdAt: -1 });

    return res.json({ announcements, count: announcements.length });
  } catch (error) {
    console.error('[Announcement Routes] getPublished error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve published announcements.' });
  }
};

// @desc    Get published announcements for students and portal visitors
// @route   GET /api/announcements/published
// @access  Public / Student
router.get('/published', getPublishedAnnouncements);

// @desc    Get published announcements (standard alias)
// @route   GET /api/announcements
// @access  Public / Student
router.get('/', getPublishedAnnouncements);

module.exports = router;
