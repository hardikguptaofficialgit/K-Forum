import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// DASHBOARD STATS
// ============================================
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    const pendingReports = await Post.countDocuments({ 'reports.0': { $exists: true } });

    // NEW: Count pending review posts
    const pendingReview = await Post.countDocuments({
      $or: [
        { status: 'PENDING_REVIEW' },
        { 'moderation.isUnsafe': true }
      ]
    });
    const publishedPosts = await Post.countDocuments({ status: 'PUBLISHED' });
    const rejectedPosts = await Post.countDocuments({ status: 'REJECTED' });

    const categoryStats = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalPosts,
      totalComments,
      pendingReports,
      pendingReview,
      publishedPosts,
      rejectedPosts,
      categoryStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET PENDING REVIEW POSTS (for admin moderation)
// ============================================
router.get('/posts/pending', auth, isAdmin, async (req, res) => {
  try {
    const posts = await Post.find({ status: 'PENDING_REVIEW' })
      .populate('author', 'name studentId email')
      .sort({ createdAt: -1 })
      .lean();

    // Add formatted data for admin UI
    const formattedPosts = posts.map(post => ({
      ...post,
      moderationInfo: {
        confidence: post.moderation?.confidence || 0,
        confidencePercent: Math.round((post.moderation?.confidence || 0) * 100),
        categories: post.moderation?.categories || [],
        flaggedWords: post.moderation?.flaggedWords || [],
        language: post.moderation?.language || 'unknown'
      }
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Get pending posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// APPROVE POST (Admin action)
// ============================================
router.post('/posts/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.status = 'PUBLISHED';
    post.moderationStatus = 'approved';
    post.adminDecision = {
      decision: 'APPROVED',
      adminId: req.userId,
      reviewedAt: new Date(),
      reason: req.body.reason || 'Approved by admin'
    };

    await post.save();

    res.json({
      message: 'Post approved and published successfully',
      post
    });
  } catch (error) {
    console.error('Approve post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// REJECT POST (Admin action)
// ============================================
router.post('/posts/:id/reject', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.status = 'REJECTED';
    post.moderationStatus = 'removed';
    post.adminDecision = {
      decision: 'REJECTED',
      adminId: req.userId,
      reviewedAt: new Date(),
      reason: req.body.reason || 'Rejected by admin'
    };

    await post.save();

    // Optionally: Send notification to user
    // await notifyUser(post.author, 'Your post has been rejected');

    res.json({
      message: 'Post rejected successfully',
      post
    });
  } catch (error) {
    console.error('Reject post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET REPORTED POSTS (user reports)
// ============================================
router.get('/reported-posts', auth, isAdmin, async (req, res) => {
  try {
    const posts = await Post.find({ 'reports.0': { $exists: true } })
      .populate('author', 'name studentId')
      .populate('reports.user', 'name studentId')
      .sort({ 'reports.reportedAt': -1 });

    res.json(posts);
  } catch (error) {
    console.error('Get reported posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET AI FLAGGED POSTS (only AI moderation flagged, NOT user reports)
// ============================================
router.get('/flagged-posts', auth, isAdmin, async (req, res) => {
  try {
    // Only get posts that were flagged by AI moderation, NOT by user reports
    const posts = await Post.find({
      $and: [
        // Must be flagged by AI or pending review
        {
          $or: [
            { 'moderation.isUnsafe': true },
            { status: 'PENDING_REVIEW', 'moderation.isUnsafe': true }
          ]
        },
        // Exclude posts that have user reports (those go to reported-posts)
        {
          $or: [
            { reports: { $exists: false } },
            { reports: { $size: 0 } }
          ]
        },
        // Not already approved or rejected
        { status: { $ne: 'REJECTED' } }
      ]
    })
      .populate('author', 'name studentId')
      .sort({ createdAt: -1 })
      .lean();

    // Add moderation info for admin UI
    const formattedPosts = posts.map(post => ({
      ...post,
      moderationInfo: {
        confidence: post.moderation?.confidence || 0,
        confidencePercent: Math.round((post.moderation?.confidence || 0) * 100),
        categories: post.moderation?.categories || [],
        flaggedWords: post.moderation?.flaggedWords || [],
        isUnsafe: post.moderation?.isUnsafe || false
      }
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Get flagged posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// MODERATE POST (legacy endpoint, kept for compatibility)
// ============================================
router.post('/moderate-post/:id', auth, isAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'approve', 'flag', 'remove'

    const updateData = {
      moderationStatus: action === 'approve' ? 'approved' : action
    };

    // Map to new status field
    if (action === 'approve') {
      updateData.status = 'PUBLISHED';
      updateData.adminDecision = {
        decision: 'APPROVED',
        adminId: req.userId,
        reviewedAt: new Date()
      };
    } else if (action === 'remove') {
      updateData.status = 'REJECTED';
      updateData.adminDecision = {
        decision: 'REJECTED',
        adminId: req.userId,
        reviewedAt: new Date()
      };
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ message: `Post ${action}d successfully`, post });
  } catch (error) {
    console.error('Moderate post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET ALL USERS (for admin management)
// ============================================
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;