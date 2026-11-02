const User = require('../models/User');
const Scheme = require('../models/Scheme');
const Announcement = require('../models/Announcement');

// @desc    Get portal-wide administration statistics
// @route   GET /api/admin/metrics
// @access  Private (Admin)
const getAdminMetrics = async (req, res) => {
  try {
    const [
      totalStudents,
      totalSchemes,
      activeSchemes,
      schemesNeedingVerification,
      publishedAnnouncements,
      recentSchemes
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Scheme.countDocuments({}),
      Scheme.countDocuments({ applicationStatus: 'Open' }),
      Scheme.countDocuments({
        verificationStatus: {
          $in: ['Needs Official Verification', 'Needs Verification', 'Outdated']
        }
      }),
      Announcement.countDocuments({ isPublished: true }),
      Scheme.find({}).sort({ createdAt: -1 }).limit(6)
    ]);

    return res.json({
      metrics: {
        totalStudents,
        totalSchemes,
        activeSchemes,
        schemesNeedingVerification,
        publishedAnnouncements
      },
      recentSchemes
    });
  } catch (error) {
    console.error('[Admin Controller] getAdminMetrics error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve admin metrics.' });
  }
};

// @desc    Get all registered college students directory
// @route   GET /api/admin/students
// @access  Private (Admin)
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .select('-password');

    return res.json({ students, count: students.length });
  } catch (error) {
    console.error('[Admin Controller] getAllStudents error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch students directory.' });
  }
};

// @desc    Activate or deactivate student account
// @route   PUT /api/admin/students/:id/status
// @access  Private (Admin)
const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    student.isActive = typeof isActive === 'boolean' ? isActive : !student.isActive;
    await student.save();

    return res.json({
      message: `Student account ${student.isActive ? 'activated' : 'deactivated'} successfully.`,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        isActive: student.isActive
      }
    });
  } catch (error) {
    console.error('[Admin Controller] toggleStudentStatus error:', error.message);
    return res.status(500).json({ error: 'Failed to update student account status.' });
  }
};

// @desc    Update scheme verification status and metadata
// @route   PUT /api/admin/schemes/:id/verification
// @access  Private (Admin)
const updateSchemeVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, officialUrl, lastVerified } = req.body;

    const scheme = await Scheme.findById(id);
    if (!scheme) {
      return res.status(404).json({ error: 'Scholarship scheme not found.' });
    }

    if (verificationStatus) {
      let normalized = verificationStatus.trim();
      if (normalized === 'Verified Active') normalized = 'Verified';
      if (normalized === 'Needs Official Verification') normalized = 'Needs Verification';
      scheme.verificationStatus = normalized;
    }
    if (officialUrl) scheme.officialUrl = officialUrl.trim();
    scheme.lastVerified = lastVerified || new Date().toISOString().split('T')[0];
    scheme.verifiedBy = req.user._id;

    await scheme.save();

    return res.json({
      message: 'Scheme verification details updated successfully.',
      scheme
    });
  } catch (error) {
    console.error('[Admin Controller] updateSchemeVerification error:', error.message);
    return res.status(500).json({ error: 'Failed to update scheme verification.' });
  }
};

// @desc    Manage and configure eligibility rules for a scholarship scheme
// @route   PUT /api/admin/schemes/:id/rules
// @access  Private (Admin)
const updateSchemeRules = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const rules = Array.isArray(body) ? body : body.rules;

    const scheme = await Scheme.findById(id);
    if (!scheme) {
      return res.status(404).json({ error: 'Scholarship scheme not found.' });
    }

    if (Array.isArray(rules)) {
      scheme.eligibilityRules = rules;
    } else {
      // Build/update condition rules from individual fields
      const newRules = [...(scheme.eligibilityRules || [])];

      if (body.maxIncomeLimit !== undefined && body.maxIncomeLimit !== null) {
        const idx = newRules.findIndex((r) => r.field === 'annualFamilyIncome');
        const rule = {
          field: 'annualFamilyIncome',
          operator: 'lte',
          value: Number(body.maxIncomeLimit),
          label: 'Annual Family Income Limit',
          mandatory: true,
          explanationOnFail: `Annual family income must not exceed ₹${Number(body.maxIncomeLimit).toLocaleString('en-IN')}`
        };
        if (idx >= 0) newRules[idx] = rule;
        else newRules.push(rule);
      }

      if (body.minAcademicPercentage !== undefined && body.minAcademicPercentage !== null) {
        const idx = newRules.findIndex((r) => r.field === 'academicPercentage');
        const rule = {
          field: 'academicPercentage',
          operator: 'gte',
          value: Number(body.minAcademicPercentage),
          label: 'Minimum Academic Percentage',
          mandatory: true,
          explanationOnFail: `Minimum aggregate marks required is ${body.minAcademicPercentage}%`
        };
        if (idx >= 0) newRules[idx] = rule;
        else newRules.push(rule);
      }

      if (Array.isArray(body.allowedCategories) && body.allowedCategories.length > 0) {
        const idx = newRules.findIndex((r) => r.field === 'category');
        const rule = {
          field: 'category',
          operator: 'in',
          value: body.allowedCategories,
          label: 'Eligible Social Categories',
          mandatory: true,
          explanationOnFail: `Scholarship is reserved for: ${body.allowedCategories.join(', ')}`
        };
        if (idx >= 0) newRules[idx] = rule;
        else newRules.push(rule);
      }

      if (Array.isArray(body.allowedStates) && body.allowedStates.length > 0) {
        const idx = newRules.findIndex((r) => r.field === 'state');
        const rule = {
          field: 'state',
          operator: 'in',
          value: body.allowedStates,
          label: 'Applicable States',
          mandatory: false,
          explanationOnFail: `Applicable in: ${body.allowedStates.join(', ')}`
        };
        if (idx >= 0) newRules[idx] = rule;
        else newRules.push(rule);
      }

      scheme.eligibilityRules = newRules;
    }

    await scheme.save();

    return res.json({
      message: 'Scheme eligibility rules updated successfully.',
      scheme
    });
  } catch (error) {
    console.error('[Admin Controller] updateSchemeRules error:', error.message);
    return res.status(500).json({ error: 'Failed to update eligibility rules.' });
  }
};

// @desc    Get all announcements
// @route   GET /api/admin/announcements
// @access  Private (Admin)
const getAdminAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    return res.json({ announcements, count: announcements.length });
  } catch (error) {
    console.error('[Admin Controller] getAdminAnnouncements error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve announcements.' });
  }
};

// @desc    Create new announcement
// @route   POST /api/admin/announcements
// @access  Private (Admin)
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, message, category, publicationStatus, isPublished } = req.body;
    const bodyContent = (content || message || '').trim();
    if (!title || !bodyContent) {
      return res.status(400).json({ error: 'Please provide announcement title and content/message.' });
    }

    let status = publicationStatus;
    if (!status) {
      status = typeof isPublished === 'boolean' ? (isPublished ? 'Published' : 'Draft') : 'Published';
    }

    const isPub = status === 'Published';

    const announcement = await Announcement.create({
      title: title.trim(),
      content: bodyContent,
      message: bodyContent,
      category: category || 'General',
      publicationStatus: status,
      isPublished: isPub,
      publishedAt: isPub ? new Date() : null,
      createdBy: req.user._id
    });

    return res.status(201).json({
      message: 'Announcement created successfully.',
      announcement
    });
  } catch (error) {
    console.error('[Admin Controller] createAnnouncement error:', error.message);
    return res.status(500).json({ error: 'Failed to create announcement.' });
  }
};

// @desc    Update existing announcement
// @route   PUT /api/admin/announcements/:id
// @access  Private (Admin)
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, message, category, publicationStatus, isPublished } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    if (title) announcement.title = title.trim();
    const bodyContent = content !== undefined ? content : message;
    if (bodyContent !== undefined) {
      announcement.content = bodyContent.trim();
      announcement.message = bodyContent.trim();
    }
    if (category) announcement.category = category;

    if (publicationStatus) {
      announcement.publicationStatus = publicationStatus;
      announcement.isPublished = publicationStatus === 'Published';
      if (publicationStatus === 'Published' && !announcement.publishedAt) {
        announcement.publishedAt = new Date();
      }
    } else if (typeof isPublished === 'boolean') {
      announcement.isPublished = isPublished;
      announcement.publicationStatus = isPublished ? 'Published' : 'Unpublished';
      if (isPublished && !announcement.publishedAt) {
        announcement.publishedAt = new Date();
      }
    }

    await announcement.save();

    return res.json({
      message: 'Announcement updated successfully.',
      announcement
    });
  } catch (error) {
    console.error('[Admin Controller] updateAnnouncement error:', error.message);
    return res.status(500).json({ error: 'Failed to update announcement.' });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private (Admin)
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found.' });
    }

    return res.json({ message: 'Announcement deleted successfully.' });
  } catch (error) {
    console.error('[Admin Controller] deleteAnnouncement error:', error.message);
    return res.status(500).json({ error: 'Failed to delete announcement.' });
  }
};

module.exports = {
  getAdminMetrics,
  getAllStudents,
  toggleStudentStatus,
  updateSchemeVerification,
  updateSchemeRules,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
