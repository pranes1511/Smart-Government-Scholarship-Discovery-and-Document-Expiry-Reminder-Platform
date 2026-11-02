const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecret_jwt_key_student_scheme_platform_2026'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'User not found or account deactivated.' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth Middleware] Verification failed:', error.message);
      return res.status(401).json({ error: 'Session expired or invalid authentication token.' });
    }
  } else {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }
};

const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecret_jwt_key_student_scheme_platform_2026'
      );
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive !== false) {
        req.user = user;
      }
    } catch (err) {
      // Ignore token failure for optional endpoints
    }
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
};

const requireStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied. Student account required for personal scholarship services.' });
  }
};

module.exports = { protect, optionalProtect, requireAdmin, requireStudent };


