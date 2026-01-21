import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Email transporter
// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, studentId, year, branch } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { studentId }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or student ID already exists'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
      name,
      email,
      password,
      studentId,
      year,
      branch,
      verificationOTP: otp,
      otpExpires
    });

    await user.save();

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'K-Forum Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #17d059;">Welcome to K-Forum!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #17d059; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'User created successfully. Please check your email for verification code.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.verificationOTP !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.verificationOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'K-Forum-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        year: user.year,
        branch: user.branch,
        role: user.role,
        reputation: user.reputation
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    // Demo Login Logic
    if (email === 'dummy@kiit.ac.in' && password === 'dummy123') {
      let dummyUser = await User.findOne({ email });
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
        console.log('Dummy user created');
      }
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Generate new OTP for unverified users
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.verificationOTP = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send new OTP email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'K-Forum Email Verification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #17d059;">Email Verification Required</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #17d059; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>Please verify your email to access your account.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      return res.status(403).json({
        message: 'Please verify your email. A new verification code has been sent.',
        userId: user._id,
        requiresVerification: true
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'K-Forum-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        year: user.year,
        branch: user.branch,
        role: user.role,
        reputation: user.reputation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password - send reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationOTP = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'K-Forum Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #17d059;">Password Reset Request</h2>
          <p>Your password reset code is:</p>
          <h1 style="color: #17d059; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Password reset code sent to your email',
      userId: user._id
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verificationOTP !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.verificationOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

export default router;