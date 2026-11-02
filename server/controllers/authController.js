const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecret_jwt_key_student_scheme_platform_2026',
    { expiresIn: '7d' }
  );
};

// @desc    Register new student
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      collegeName,
      course,
      studyYear,
      state
    } = req.body;

    // Field validations
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      collegeName: collegeName ? collegeName.trim() : '',
      course: course ? course.trim() : '',
      studyYear: studyYear ? Number(studyYear) : 1,
      state: state ? state.trim() : ''
    });

    // Automatically initialize linked student profile
    await StudentProfile.create({
      userId: user._id,
      fullName: user.name,
      collegeName: user.collegeName,
      course: user.course,
      studyYear: user.studyYear,
      state: user.state
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Student account registered successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        course: user.course,
        studyYear: user.studyYear,
        state: user.state,
        role: user.role || 'student'
      }
    });
  } catch (error) {
    console.error('[Auth Controller] Register error:', error.message);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
};

// @desc    Authenticate student & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account status
    if (user.isActive === false) {
      return res.status(403).json({
        error: 'Your account has been deactivated by an administrator. Please contact support.'
      });
    }

    const token = generateToken(user._id);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        course: user.course,
        studyYear: user.studyYear,
        state: user.state,
        role: user.role || 'student'
      }
    });
  } catch (error) {
    console.error('[Auth Controller] Login error:', error.message);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
};

// @desc    Get currently authenticated student
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.json({ user });
  } catch (error) {
    console.error('[Auth Controller] getMe error:', error.message);
    return res.status(500).json({ error: 'Server error fetching user details.' });
  }
};

module.exports = {
  register,
  login,
  getMe
};
