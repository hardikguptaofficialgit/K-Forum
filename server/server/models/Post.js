import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    required: true,
    enum: ['academics', 'events', 'rants', 'internships', 'lost-found', 'clubs', 'general', 'Bookies']
  },
  tags: [{
    type: String,
    trim: true
  }],
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Facebook-style reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  attachments: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['image']
    },
    filename: {
      type: String,
      required: true
    }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // --- NEW: Enhanced Moderation System ---
  status: {
    type: String,
    enum: ['PUBLISHED', 'PENDING_REVIEW', 'REJECTED'],
    default: 'PENDING_REVIEW',
    index: true
  },

  // Event Date (for 'events' category)
  eventDate: {
    type: Date,
    index: true
  },

  moderation: {
    isUnsafe: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      default: 0
    },
    categories: [{
      type: String
    }],
    flaggedWords: [{
      type: String
    }],
    language: {
      type: String,
      default: 'unknown'
    }
  },

  adminDecision: {
    decision: {
      type: String,
      enum: ['APPROVED', 'REJECTED']
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reason: String
  },

  // Keep old field for backward compatibility
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'removed'],
    default: 'approved'
  }
}, {
  timestamps: true
});

postSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model('Post', postSchema);