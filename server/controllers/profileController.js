const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

// @desc    Get student profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    let profile = await StudentProfile.findOne({ userId: req.user._id });
    if (!profile) {
      // Create empty profile prefilled from user register info
      profile = await StudentProfile.create({
        userId: req.user._id,
        fullName: req.user.name,
        collegeName: req.user.collegeName || '',
        course: req.user.course || '',
        studyYear: req.user.studyYear || 1,
        state: req.user.state || ''
      });
    }

    return res.json({ profile });
  } catch (error) {
    console.error('[Profile Controller] getProfile error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve student profile.' });
  }
};

// @desc    Update student profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const updateData = req.body;

    // Validate percentage if provided
    if (updateData.academicPercentage !== undefined && updateData.academicPercentage !== null && updateData.academicPercentage !== '') {
      const pct = Number(updateData.academicPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ error: 'Academic percentage must be a number between 0 and 100.' });
      }
      updateData.academicPercentage = pct;
    }

    // Validate income if provided
    if (updateData.annualFamilyIncome !== undefined && updateData.annualFamilyIncome !== null && updateData.annualFamilyIncome !== '') {
      const inc = Number(updateData.annualFamilyIncome);
      if (isNaN(inc) || inc < 0) {
        return res.status(400).json({ error: 'Annual family income must be a valid non-negative number.' });
      }
      updateData.annualFamilyIncome = inc;
    }

    // Compute or validate age if dateOfBirth is updated
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const diffMs = Date.now() - dob.getTime();
        const ageDate = new Date(diffMs);
        updateData.age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
    }

    let profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    // Sync basic details back to User record if changed
    if (updateData.fullName || updateData.state || updateData.collegeName || updateData.course) {
      await User.findByIdAndUpdate(req.user._id, {
        $set: {
          name: updateData.fullName || req.user.name,
          state: updateData.state || req.user.state,
          collegeName: updateData.collegeName || req.user.collegeName,
          course: updateData.course || req.user.course,
          studyYear: updateData.studyYear || req.user.studyYear
        }
      });
    }

    return res.json({
      message: 'Student profile updated successfully. Eligibility criteria have been updated.',
      profile
    });
  } catch (error) {
    console.error('[Profile Controller] updateProfile error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to update student profile.' });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
