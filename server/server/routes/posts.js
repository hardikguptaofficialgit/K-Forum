import express from 'express';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { uploadImage } from '../config/cloudinary.js';
import multer from 'multer';
import { moderateText } from '../services/aiModeration.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  },
});

const router = express.Router();

// Get trending hashtags
router.get('/trending/hashtags', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trendingTags = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          $or: [
            { status: 'PUBLISHED' },
            { status: { $exists: false }, moderationStatus: 'approved' }
          ]
        }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          tag: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json(trendingTags);
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming events
router.get('/events', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await Post.find({
      category: 'events',
      eventDate: { $gte: today },
      $or: [
        { status: 'PUBLISHED' },
        { status: { $exists: false }, moderationStatus: 'approved' }
      ]
    })
      .select('title eventDate')
      .sort({ eventDate: 1 })
      .limit(20);

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts (only PUBLISHED)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      excludeCategory,
      search,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Include both old posts (moderationStatus=approved) and new posts (status=PUBLISHED)
    // Also catch posts that might have reverted to default status but are approved
    let query = {
      $or: [
        { status: 'PUBLISHED' },
        { moderationStatus: 'approved' }
      ]
    };

    if (category && category !== 'all') {
      query.category = category;
    } else if (excludeCategory) {
      query.category = { $ne: excludeCategory };
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    } else if (search) {
      query.$text = { $search: search };
    }

    const posts = await Post.find(query)
      .populate('author', 'name studentId year branch avatar')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Post.countDocuments(query);

    const processedPosts = posts.map(post => {
      // Calculate reaction counts
      const reactionCounts = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
      (post.reactions || []).forEach(r => {
        reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
      });

      // Find user's reaction if authenticated
      let userReaction = null;
      if (req.userId) {
        const userReact = (post.reactions || []).find(
          r => r.user.toString() === req.userId.toString()
        );
        userReaction = userReact?.type || null;
      }

      return {
        ...post,
        author: post.isAnonymous ? null : post.author,
        upvoteCount: post.upvotes?.length || 0,
        downvoteCount: post.downvotes?.length || 0,
        reactionCounts,
        totalReactions: (post.reactions || []).length,
        userReaction
      };
    });

    res.json({
      posts: processedPosts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name studentId year branch avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    // Calculate reaction counts
    const reactionCounts = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
    (post.reactions || []).forEach(r => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    // Find user's reaction if authenticated
    let userReaction = null;
    if (req.userId) {
      const userReact = (post.reactions || []).find(
        r => r.user.toString() === req.userId.toString()
      );
      userReaction = userReact?.type || null;
    }

    const processedPost = {
      ...post.toObject(),
      author: post.isAnonymous ? null : post.author,
      upvoteCount: post.upvotes?.length || 0,
      downvoteCount: post.downvotes?.length || 0,
      reactionCounts,
      totalReactions: (post.reactions || []).length,
      userReaction
    };

    res.json(processedPost);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// CREATE POST - With AI Moderation
// ============================================
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { title, content, category, tags, isAnonymous, eventDate } = req.body;

    console.log('📝 Create Post Request Received');
    console.log('   Content-Type:', req.headers['content-type']);
    console.log('   Files received:', req.files ? req.files.length : 'None');
    console.log('   Cloudinary Configured:',
      process.env.CLOUDINARY_CLOUD_NAME ? 'Yes' : 'No',
      process.env.CLOUDINARY_API_KEY ? 'Yes' : 'No'
    );

    // --- AI MODERATION ---
    const textToAnalyze = `${title}\n${content}`;
    console.log('Analyzing content for moderation...');

    const moderationResult = await moderateText(textToAnalyze);
    console.log('Moderation Result:', moderationResult);

    // Determine status based on moderation
    // SAFE (confidence < 0.45) → PUBLISHED
    // UNSAFE (confidence >= 0.45) → PENDING_REVIEW (admin will decide)
    const status = moderationResult.isUnsafe ? 'PENDING_REVIEW' : 'PUBLISHED';

    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const extractedHashtags = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      extractedHashtags.push(match[1].toLowerCase());
    }

    // Handle image uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      console.log(`📷 Processing ${req.files.length} image(s) for upload...`);
      for (const file of req.files) {
        try {
          console.log(`   Uploading: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`);
          const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const imageUrl = await uploadImage(base64Image);
          console.log(`   ✅ Uploaded: ${imageUrl.substring(0, 60)}...`);
          attachments.push({
            url: imageUrl,
            type: 'image',
            filename: file.originalname
          });
        } catch (error) {
          console.error('❌ Image upload failed:', error.message);
          return res.status(500).json({
            message: 'Image upload failed. Is Cloudinary configured?',
            error: error.message
          });
        }
      }
      console.log(`📷 Total attachments uploaded: ${attachments.length}/${req.files.length}`);
    }

    const cleanAttachments = attachments.map(attachment => ({
      url: attachment.url.trim(),
      type: attachment.type,
      filename: attachment.filename
    }));

    const manualTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean) : [];
    const allTags = [...new Set([...manualTags, ...extractedHashtags])];

    console.log('📎 Attachments to save:', JSON.stringify(cleanAttachments, null, 2));

    const post = new Post({
      title: title.trim(),
      content: content.trim(),
      author: req.userId,
      category,
      tags: allTags,
      isAnonymous: isAnonymous === 'true',
      attachments: cleanAttachments,

      // New moderation fields
      status,
      eventDate: category === 'events' ? eventDate : undefined,
      moderation: {
        isUnsafe: moderationResult.isUnsafe,
        confidence: moderationResult.confidence,
        categories: moderationResult.categories || [],
        flaggedWords: moderationResult.flaggedWords || [],
        language: moderationResult.language || 'unknown'
      },

      // Keep old field for backward compatibility
      moderationStatus: status === 'PUBLISHED' ? 'approved' : 'flagged'
    });

    await post.save();
    console.log('💾 Saved post attachments:', post.attachments);
    await post.populate('author', 'name studentId year branch avatar');

    const processedPost = {
      ...post.toObject(),
      author: post.isAnonymous ? null : post.author,
      upvoteCount: 0,
      downvoteCount: 0
    };

    // Return appropriate message
    res.status(201).json({
      message: status === 'PUBLISHED'
        ? 'Post published successfully!'
        : 'Post submitted for admin review. It will be visible once approved.',
      post: processedPost,
      moderationStatus: status
    });

  } catch (error) {
    console.error('Create post error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        message: 'File upload error',
        error: error.message
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on post
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { voteType } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.upvotes = post.upvotes.filter(vote => !vote.user.equals(req.userId));
    post.downvotes = post.downvotes.filter(vote => !vote.user.equals(req.userId));

    if (voteType === 'up') {
      post.upvotes.push({ user: req.userId });
    } else if (voteType === 'down') {
      post.downvotes.push({ user: req.userId });
    }

    await post.save();

    res.json({
      upvoteCount: post.upvotes.length,
      downvoteCount: post.downvotes.length
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// REACT TO POST (Facebook-style reactions)
// ============================================
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { type } = req.body;
    const validReactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

    if (!type || !validReactions.includes(type)) {
      return res.status(400).json({
        message: 'Invalid reaction type. Must be one of: ' + validReactions.join(', ')
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Convert req.userId to string for comparison
    const currentUserId = req.userId.toString();

    // Find existing reaction from this user
    const existingReactionIndex = post.reactions.findIndex(
      r => r.user.toString() === currentUserId
    );

    let userReaction = null;

    console.log('React request - User:', currentUserId, 'Type:', type, 'Existing index:', existingReactionIndex);

    if (existingReactionIndex > -1) {
      const existingReaction = post.reactions[existingReactionIndex];
      console.log('Existing reaction type:', existingReaction.type);

      if (existingReaction.type === type) {
        // Same reaction - toggle off (remove)
        console.log('Removing reaction (toggle off)');
        post.reactions.splice(existingReactionIndex, 1);
        userReaction = null;
      } else {
        // Different reaction - update to new type
        console.log('Changing reaction to:', type);
        post.reactions[existingReactionIndex].type = type;
        post.reactions[existingReactionIndex].createdAt = new Date();
        userReaction = type;
      }
    } else {
      // No existing reaction - add new one
      console.log('Adding new reaction:', type);
      post.reactions.push({ user: req.userId, type });
      userReaction = type;
    }

    await post.save();

    // Calculate reaction counts
    const reactionCounts = {};
    validReactions.forEach(r => reactionCounts[r] = 0);
    post.reactions.forEach(r => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    console.log('Response - userReaction:', userReaction, 'total:', post.reactions.length);

    res.json({
      reactionCounts,
      totalReactions: post.reactions.length,
      userReaction
    });
  } catch (error) {
    console.error('React error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.id,
      moderationStatus: 'approved'
    })
      .populate('author', 'name studentId year branch avatar')
      .sort({ createdAt: -1 });

    const processedComments = comments.map(comment => ({
      ...comment.toObject(),
      author: comment.isAnonymous ? null : comment.author,
      upvoteCount: comment.upvotes?.length || 0,
      downvoteCount: comment.downvotes?.length || 0
    }));

    res.json(processedComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comments', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { content, isAnonymous, parentComment } = req.body;

    // Handle image uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          const imageUrl = await uploadImage(base64Image);
          attachments.push({
            url: imageUrl,
            type: 'image',
            filename: file.originalname
          });
        } catch (error) {
          console.warn('Comment image upload failed (skipping):', error.message);
        }
      }
    }

    const comment = new Comment({
      content,
      author: req.userId,
      post: req.params.id,
      isAnonymous: isAnonymous === 'true', // Handle form-data (strings)
      parentComment: parentComment || null,
      attachments
    });

    await comment.save();
    await comment.populate('author', 'name studentId year branch avatar');

    await Post.findByIdAndUpdate(req.params.id, {
      $inc: { commentCount: 1 }
    });

    const processedComment = {
      ...comment.toObject(),
      author: comment.isAnonymous ? null : comment.author,
      upvoteCount: 0,
      downvoteCount: 0
    };

    res.status(201).json(processedComment);
  } catch (error) {
    console.error('Add comment error:', error);
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        message: 'File upload error',
        error: error.message
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.author.equals(req.userId) && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Comment.deleteMany({ post: req.params.id });
    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report post
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingReport = post.reports.find(report => report.user.equals(req.userId));
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    post.reports.push({
      user: req.userId,
      reason
    });

    if (post.reports.length >= 5 && post.status === 'PUBLISHED') {
      post.status = 'PENDING_REVIEW';
      post.moderationStatus = 'flagged';
    }

    await post.save();

    res.json({ message: 'Post reported successfully' });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;