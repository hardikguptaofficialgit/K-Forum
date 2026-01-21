import mongoose from 'mongoose';

const wordleAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    word: {
        type: String,
        required: true
    },
    guesses: [{
        guess: String,
        result: [String] // Array of 'correct', 'present', 'absent'
    }],
    completed: {
        type: Boolean,
        default: false
    },
    won: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index for user and date (one attempt per user per day)
wordleAttemptSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('WordleAttempt', wordleAttemptSchema);
