import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Bypass for Demo User (Fail-safe)
    if (token === 'dummy-demo-token') {
      let dummyUser = await User.findOne({ email: 'dummy@kiit.ac.in' });

      // If dummy user doesn't exist (e.g. fresh DB + client bypass), create it now!
      if (!dummyUser) {
        dummyUser = new User({
          name: 'Demo User',
          email: 'dummy@kiit.ac.in',
          password: 'dummy123',
          studentId: '9999999',
          year: 4,
          branch: 'CSE',
          isVerified: true,
          role: 'student'
        });
        await dummyUser.save();
        console.log('Dummy user auto-created in auth middleware');
      }

      req.userId = dummyUser._id;
      req.userRole = dummyUser.role;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'K-Forum-secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Optional auth - doesn't require authentication but sets userId if token is valid
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next(); // No token, continue without user context
    }

    // Handle demo token
    if (token === 'dummy-demo-token') {
      const dummyUser = await User.findOne({ email: 'dummy@kiit.ac.in' });
      if (dummyUser) {
        req.userId = dummyUser._id;
        req.userRole = dummyUser.role;
      }
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'K-Forum-secret');
    const user = await User.findById(decoded.userId);

    if (user) {
      req.userId = user._id;
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    // Token invalid, continue without user context
    next();
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};