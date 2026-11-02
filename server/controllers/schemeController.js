const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const StudentProfile = require('../models/StudentProfile');
const { evaluateSchemeEligibility } = require('../utils/eligibilityEngine');

const normalizeVerificationStatus = (status) => {
  if (!status) return 'Needs Verification';
  if (status === 'Verified Active') return 'Verified';
  if (status === 'Needs Official Verification') return 'Needs Verification';
  return status;
};

// @desc    Get all schemes with search, filters and optional eligibility calculation
// @route   GET /api/schemes
// @access  Public (Enhanced with eligibility if authenticated)
const getSchemes = async (req, res) => {
  try {
    const {
      search,
      category,
      state,
      educationLevel,
      status,
      verificationStatus,
      eligibility,
      sort = 'name_asc',
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // Search query across name, description, ministry
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { ministry: { $regex: s, $options: 'i' } }
      ];
    }

    // Filter by Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by State
    if (state && state !== 'All') {
      query.applicableStates = { $in: [state, 'All India', 'All'] };
    }

    // Filter by Education Level
    if (educationLevel && educationLevel !== 'All') {
      query.educationLevels = { $in: [educationLevel, 'All Higher Education'] };
    }

    // Filter by Application Status
    if (status && status !== 'All') {
      query.applicationStatus = status;
    }

    // Filter by Verification Status
    if (verificationStatus && verificationStatus !== 'All') {
      if (verificationStatus === 'Verified') {
        query.verificationStatus = { $in: ['Verified', 'Verified Active'] };
      } else if (verificationStatus === 'Needs Verification') {
        query.verificationStatus = { $in: ['Needs Verification', 'Needs Official Verification'] };
      } else {
        query.verificationStatus = verificationStatus;
      }
    }

    // Sorting
    let sortObj = { name: 1 };
    if (sort === 'name_desc') sortObj = { name: -1 };
    else if (sort === 'deadline_asc') sortObj = { applicationDeadline: 1 };
    else if (sort === 'deadline_desc') sortObj = { applicationDeadline: -1 };
    else if (sort === 'category_asc') sortObj = { category: 1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [total, schemes] = await Promise.all([
      Scheme.countDocuments(query),
      Scheme.find(query).sort(sortObj).skip(skip).limit(limitNum)
    ]);

    // If student profile is available (or user logged in), compute eligibility for each scheme
    let enrichedSchemes = schemes.map((s) => {
      const obj = s.toObject();
      obj.verificationStatus = normalizeVerificationStatus(obj.verificationStatus);
      return obj;
    });

    if (req.user && req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      if (profile) {
        enrichedSchemes = enrichedSchemes.map((scheme) => {
          const evalResult = evaluateSchemeEligibility(scheme, profile.toObject());
          return {
            ...scheme,
            eligibilityResult: {
              status: evalResult.overallStatus,
              summary: evalResult.overallSummary,
              counts: evalResult.counts
            }
          };
        });

        // Filter by computed eligibility result if requested
        if (eligibility && eligibility !== 'All') {
          enrichedSchemes = enrichedSchemes.filter(
            (s) => s.eligibilityResult && s.eligibilityResult.status === eligibility
          );
        }
      }
    }

    return res.json({
      schemes: enrichedSchemes,
      total: enrichedSchemes.length,
      datasetTotal: total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('[Scheme Controller] getSchemes error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve scholarship schemes.' });
  }
};

// @desc    Get single scheme details by ID or Slug
// @route   GET /api/schemes/:id
// @access  Public
const getSchemeById = async (req, res) => {
  try {
    const { id } = req.params;
    let scheme;

    if (mongoose.Types.ObjectId.isValid(id)) {
      scheme = await Scheme.findById(id);
    } else {
      scheme = await Scheme.findOne({ slug: id.toLowerCase() });
    }

    if (!scheme) {
      return res.status(404).json({ error: 'Scholarship scheme not found.' });
    }

    const schemeObj = scheme.toObject();
    schemeObj.verificationStatus = normalizeVerificationStatus(schemeObj.verificationStatus);

    // If authenticated student, include personalized eligibility evaluation
    if (req.user && req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      if (profile) {
        const evalResult = evaluateSchemeEligibility(scheme, profile.toObject());
        schemeObj.eligibilityResult = evalResult;
      }
    }

    return res.json({ scheme: schemeObj });
  } catch (error) {
    console.error('[Scheme Controller] getSchemeById error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve scheme details.' });
  }
};

// @desc    Get full rule-based eligibility gap analysis for a scheme
// @route   POST /api/schemes/eligibility
// @access  Private
const getSchemeEligibilityAnalysis = async (req, res) => {
  try {
    const { schemeId } = req.body;
    if (!schemeId) {
      return res.status(400).json({ error: 'Please provide schemeId for eligibility analysis.' });
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found.' });
    }

    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ error: 'Student profile not found. Please complete your profile.' });
    }

    const analysis = evaluateSchemeEligibility(scheme, profile.toObject());

    return res.json({
      scheme: {
        _id: scheme._id,
        name: scheme.name,
        category: scheme.category,
        ministry: scheme.ministry,
        officialUrl: scheme.officialUrl
      },
      analysis
    });
  } catch (error) {
    console.error('[Scheme Controller] getSchemeEligibilityAnalysis error:', error.message);
    return res.status(500).json({ error: 'Failed to compute eligibility analysis.' });
  }
};

// @desc    Get recommended schemes for authenticated student
// @route   GET /api/schemes/recommended
// @access  Private
const getRecommendedSchemes = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.json({ recommended: [] });
    }

    const allSchemes = await Scheme.find({});
    const profileObj = profile.toObject();

    const evaluated = allSchemes.map((scheme) => {
      const evalResult = evaluateSchemeEligibility(scheme, profileObj);
      return {
        ...scheme.toObject(),
        eligibilityResult: evalResult
      };
    });

    // Filter potentially eligible or partially eligible
    const recommended = evaluated
      .filter(
        (s) =>
          s.eligibilityResult.overallStatus === 'Potentially Eligible' ||
          s.eligibilityResult.overallStatus === 'Partially Eligible'
      )
      .sort((a, b) => {
        // Priority to Potentially Eligible, then by satisfied counts
        if (
          a.eligibilityResult.overallStatus === 'Potentially Eligible' &&
          b.eligibilityResult.overallStatus !== 'Potentially Eligible'
        )
          return -1;
        if (
          b.eligibilityResult.overallStatus === 'Potentially Eligible' &&
          a.eligibilityResult.overallStatus !== 'Potentially Eligible'
        )
          return 1;
        return (
          b.eligibilityResult.counts.satisfied - a.eligibilityResult.counts.satisfied
        );
      })
      .slice(0, 6);

    return res.json({ recommended, count: recommended.length });
  } catch (error) {
    console.error('[Scheme Controller] getRecommendedSchemes error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch recommended schemes.' });
  }
};

// @desc    Compare up to 3 scholarships side by side
// @route   POST /api/schemes/compare
// @access  Public (Enhanced with eligibility if logged in)
const compareSchemes = async (req, res) => {
  try {
    const { schemeIds } = req.body;

    if (!schemeIds || !Array.isArray(schemeIds) || schemeIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of 2 to 3 scheme IDs to compare.' });
    }

    if (schemeIds.length > 3) {
      return res.status(400).json({ error: 'Comparison is limited to a maximum of 3 schemes.' });
    }

    const schemes = await Scheme.find({ _id: { $in: schemeIds } });

    let profileObj = null;
    if (req.user) {
      const profile = await StudentProfile.findOne({ userId: req.user._id });
      if (profile) profileObj = profile.toObject();
    }

    const comparisonList = schemes.map((scheme) => {
      const schemeObj = scheme.toObject();
      if (profileObj) {
        schemeObj.eligibility = evaluateSchemeEligibility(scheme, profileObj);
      }
      return schemeObj;
    });

    return res.json({ schemes: comparisonList, count: comparisonList.length });
  } catch (error) {
    console.error('[Scheme Controller] compareSchemes error:', error.message);
    return res.status(500).json({ error: 'Failed to compare schemes.' });
  }
};

// @desc    Create new scholarship scheme (Admin Only)
// @route   POST /api/schemes
// @access  Private (Admin)
const createScheme = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      detailedDescription,
      ministry,
      applicableStates,
      educationLevels,
      eligibleCourses,
      eligibilityRules,
      benefits,
      requiredDocuments,
      applicationDeadline,
      applicationStatus,
      officialUrl,
      officialApplicationUrl
    } = req.body;

    const resolvedUrl = officialUrl || officialApplicationUrl;

    if (!name || !category || !description || !resolvedUrl) {
      return res.status(400).json({ error: 'Please provide name, category, description, and official application URL.' });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const scheme = await Scheme.create({
      name: name.trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      category,
      description: description.trim(),
      detailedDescription: detailedDescription || description,
      ministry: ministry || 'Government Department',
      applicableStates: Array.isArray(applicableStates) ? applicableStates : [applicableStates || 'All India'],
      educationLevels: Array.isArray(educationLevels) ? educationLevels : ['Undergraduate', 'Postgraduate'],
      eligibleCourses: Array.isArray(eligibleCourses) ? eligibleCourses : ['All Courses'],
      eligibilityRules: Array.isArray(eligibilityRules) ? eligibilityRules : [],
      benefits: Array.isArray(benefits) ? benefits : [benefits || 'Financial assistance'],
      requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [],
      applicationDeadline: applicationDeadline || null,
      applicationStatus: applicationStatus || 'Open',
      officialUrl: resolvedUrl.trim(),
      officialApplicationUrl: resolvedUrl.trim(),
      verificationStatus: req.body.verificationStatus ? normalizeVerificationStatus(req.body.verificationStatus) : 'Needs Verification'
    });

    return res.status(201).json({ message: 'Scholarship scheme created successfully.', scheme });
  } catch (error) {
    console.error('[Scheme Controller] createScheme error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to create scheme.' });
  }
};

// @desc    Update scholarship scheme (Admin Only)
// @route   PUT /api/schemes/:id
// @access  Private (Admin)
const updateScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const scheme = await Scheme.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found.' });
    }

    return res.json({ message: 'Scheme updated successfully.', scheme });
  } catch (error) {
    console.error('[Scheme Controller] updateScheme error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to update scheme.' });
  }
};

// @desc    Delete scholarship scheme (Admin Only)
// @route   DELETE /api/schemes/:id
// @access  Private (Admin)
const deleteScheme = async (req, res) => {
  try {
    const { id } = req.params;
    const scheme = await Scheme.findByIdAndDelete(id);
    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found.' });
    }

    return res.json({ message: 'Scheme deleted successfully.' });
  } catch (error) {
    console.error('[Scheme Controller] deleteScheme error:', error.message);
    return res.status(500).json({ error: 'Failed to delete scheme.' });
  }
};

module.exports = {
  getSchemes,
  getSchemeById,
  getSchemeEligibilityAnalysis,
  getRecommendedSchemes,
  compareSchemes,
  createScheme,
  updateScheme,
  deleteScheme
};

