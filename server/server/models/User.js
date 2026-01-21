import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function (email) {
        return email.endsWith('@kiit.ac.in');
      },
      message: 'Email must be a valid KIIT email address ending in @kiit.ac.in'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  branch: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationOTP: String,
  otpExpires: Date,
  role: {
    type: String,
    enum: ['student', 'moderator', 'admin'],
    default: 'student'
  },
  reputation: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Wordle Streak System
  wordleStreak: {
    current: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    lastPlayedDate: {
      type: Date,
      default: null
    },
    totalWins: {
      type: Number,
      default: 0
    }
  },

  // Buddy Connect System
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  connectionRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);