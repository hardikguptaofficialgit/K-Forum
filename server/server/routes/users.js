import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { auth } from '../middleware/auth.js';
import { uploadImage } from '../config/cloudinary.js';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
});

const router = express.Router();

// Get suggested users for buddy connect
router.get('/suggestions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const excludeIds = [user._id, ...user.connections, ...user.connectionRequests.map(r => r.user)];

    // Find random users not in exclude list
    const suggestions = await User.aggregate([
      { $match: { _id: { $nin: excludeIds } } },
      { $sample: { size: 5 } },
      { $project: { name: 1, avatar: 1, studentId: 1, branch: 1, year: 1 } }
    ]);

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get connections
router.get('/connections', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('connections', 'name avatar studentId branch year');
    res.json(user.connections);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send connection request
router.post('/connect/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.userId.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already requested or connected
    const existingRequest = targetUser.connectionRequests.find(
      r => r.user.toString() === req.userId
    );
    const isConnected = targetUser.connections.includes(req.userId);

    if (existingRequest || isConnected) {
      return res.status(400).json({ message: 'Request already sent or connected' });
    }

    // Add request to target user
    targetUser.connectionRequests.push({
      user: req.userId,
      status: 'pending'
    });
    await targetUser.save();

    res.json({ message: 'Connection request sent' });
  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept connection request
router.post('/connect/:userId/accept', auth, async (req, res) => {
  try {
    const { userId } = req.params; // ID of the user who sent the request
    const user = await User.findById(req.userId);

    // Find request
    const requestIndex = user.connectionRequests.findIndex(
      r => r.user.toString() === userId && r.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Add to connections for both
    user.connections.push(userId);
    user.connectionRequests[requestIndex].status = 'accepted';

    const requester = await User.findById(userId);
    requester.connections.push(req.userId);

    await user.save();
    await requester.save();

    res.json({ message: 'Connection accepted' });
  } catch (error) {
    console.error('Accept connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationOTP -otpExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const postCount = await Post.countDocuments({
      author: user._id,
      moderationStatus: 'approved'
    });

    res.json({
      ...user.toObject(),
      postCount
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, upload.single('avatar'), async (req, res) => {
  try {
    const { name, year, branch } = req.body;
    const updateData = { name, year, branch };

    // Handle avatar upload if file is present
    if (req.file) {
      try {
        // Convert buffer to base64
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const avatarUrl = await uploadImage(base64Image);
        updateData.avatar = avatarUrl;
      } catch (error) {
        console.error('Avatar upload error:', error);
        return res.status(400).json({ message: 'Failed to upload avatar' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/:id/posts', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const posts = await Post.find({
      author: req.params.id,
      moderationStatus: 'approved',
      isAnonymous: false // Only show non-anonymous posts on profile
    })
      .populate('author', 'name studentId year branch')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments({
      author: req.params.id,
      moderationStatus: 'approved',
      isAnonymous: false
    });

    const processedPosts = posts.map(post => ({
      ...post.toObject(),
      upvoteCount: post.upvotes.length,
      downvoteCount: post.downvotes.length
    }));

    res.json({
      posts: processedPosts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;