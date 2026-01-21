import express from 'express';
import DailyWord from '../models/DailyWord.js';
import WordleAttempt from '../models/WordleAttempt.js';
import User from '../models/User.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { generateDailyWord, generateHintForWord } from '../services/wordleGenerator.js';

const router = express.Router();

// Helper to get today's date at midnight UTC
const getTodayDate = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// Helper to check if two dates are the same day
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getUTCFullYear() === d2.getUTCFullYear() &&
        d1.getUTCMonth() === d2.getUTCMonth() &&
        d1.getUTCDate() === d2.getUTCDate();
};

// Helper to check if date is yesterday
const isYesterday = (date, today) => {
    if (!date) return false;
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return isSameDay(date, yesterday);
};

// Auto-generate word for today if not exists
const ensureTodayWordExists = async () => {
    const today = getTodayDate();

    let dailyWord = await DailyWord.findOne({ date: today });

    if (!dailyWord) {
        console.log("No word for today, auto-generating...");

        // Generate a new word using AI
        const word = await generateDailyWord();
        const hint = await generateHintForWord(word);

        dailyWord = new DailyWord({
            word: word.toUpperCase(),
            date: today,
            createdBy: null, // Auto-generated
            hint: hint || ''
        });

        await dailyWord.save();
        console.log(`Auto-generated today's word: ${word}`);
    }

    return dailyWord;
};

// Get today's wordle status for user
router.get('/today', auth, async (req, res) => {
    try {
        const today = getTodayDate();

        // Auto-generate word if needed
        const dailyWord = await ensureTodayWordExists();

        if (!dailyWord) {
            return res.json({
                available: false,
                message: 'Unable to generate Wordle for today. Try again later!'
            });
        }

        // Get user's attempt for today
        const attempt = await WordleAttempt.findOne({
            user: req.userId,
            date: today
        });

        // Get user's streak info
        const user = await User.findById(req.userId).select('wordleStreak');

        res.json({
            available: true,
            hint: dailyWord.hint || null,
            wordLength: 5,
            maxAttempts: 6,
            attempt: attempt ? {
                guesses: attempt.guesses,
                completed: attempt.completed,
                won: attempt.won,
                attempts: attempt.attempts
            } : null,
            streak: user.wordleStreak || { current: 0, max: 0, totalWins: 0 }
        });
    } catch (error) {
        console.error('Get wordle error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit a guess
router.post('/guess', auth, async (req, res) => {
    try {
        const { guess } = req.body;
        const today = getTodayDate();

        if (!guess || guess.length !== 5) {
            return res.status(400).json({ message: 'Guess must be exactly 5 letters' });
        }

        // Check if only letters
        if (!/^[a-zA-Z]+$/.test(guess)) {
            return res.status(400).json({ message: 'Guess must contain only letters' });
        }

        const upperGuess = guess.toUpperCase();

        // Validate against dictionary
        const { isValidWord } = await import('../data/wordleDictionary.js');
        if (!isValidWord(upperGuess)) {
            return res.status(400).json({ message: 'Not a valid English word!' });
        }

        // Get today's word (auto-generate if needed)
        const dailyWord = await ensureTodayWordExists();
        if (!dailyWord) {
            return res.status(404).json({ message: 'No Wordle available for today' });
        }

        const correctWord = dailyWord.word.toUpperCase();

        // Get or create attempt
        let attempt = await WordleAttempt.findOne({
            user: req.userId,
            date: today
        });

        if (!attempt) {
            attempt = new WordleAttempt({
                user: req.userId,
                date: today,
                word: correctWord,
                guesses: [],
                completed: false,
                won: false,
                attempts: 0
            });
        }

        if (attempt.completed) {
            return res.status(400).json({
                message: 'You have already completed today\'s Wordle',
                won: attempt.won
            });
        }

        if (attempt.attempts >= 6) {
            return res.status(400).json({ message: 'No more attempts left for today' });
        }

        // Evaluate the guess
        const result = [];
        const wordArray = correctWord.split('');
        const guessArray = upperGuess.split('');
        const letterCount = {};

        // Count letters in correct word
        wordArray.forEach(letter => {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        });

        // First pass: mark correct positions
        for (let i = 0; i < 5; i++) {
            if (guessArray[i] === wordArray[i]) {
                result[i] = 'correct';
                letterCount[guessArray[i]]--;
            }
        }

        // Second pass: mark present/absent
        for (let i = 0; i < 5; i++) {
            if (result[i]) continue; // Already marked correct

            if (letterCount[guessArray[i]] > 0) {
                result[i] = 'present';
                letterCount[guessArray[i]]--;
            } else {
                result[i] = 'absent';
            }
        }

        // Add guess to attempts
        attempt.guesses.push({ guess: upperGuess, result });
        attempt.attempts += 1;

        // Check if won
        const isWin = upperGuess === correctWord;
        if (isWin) {
            attempt.completed = true;
            attempt.won = true;
        } else if (attempt.attempts >= 6) {
            attempt.completed = true;
            attempt.won = false;
        }

        await attempt.save();

        // Update streak if completed
        let updatedStreak = null;
        if (attempt.completed) {
            const user = await User.findById(req.userId);
            const lastPlayed = user.wordleStreak?.lastPlayedDate;

            if (isWin) {
                // Check if this is a consecutive day
                if (isYesterday(lastPlayed, today) || !lastPlayed) {
                    user.wordleStreak.current = (user.wordleStreak.current || 0) + 1;
                } else if (!isSameDay(lastPlayed, today)) {
                    // Missed a day, reset streak
                    user.wordleStreak.current = 1;
                }

                user.wordleStreak.totalWins = (user.wordleStreak.totalWins || 0) + 1;

                // Update max streak
                if (user.wordleStreak.current > (user.wordleStreak.max || 0)) {
                    user.wordleStreak.max = user.wordleStreak.current;
                }
            } else {
                // Lost - streak breaks
                user.wordleStreak.current = 0;
            }

            user.wordleStreak.lastPlayedDate = today;
            await user.save();
            updatedStreak = user.wordleStreak;
        }

        res.json({
            result,
            guess: upperGuess,
            attempts: attempt.attempts,
            completed: attempt.completed,
            won: attempt.won,
            correctWord: attempt.completed ? correctWord : undefined,
            streak: updatedStreak
        });
    } catch (error) {
        console.error('Guess error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's wordle stats
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('wordleStreak');
        const totalAttempts = await WordleAttempt.countDocuments({ user: req.userId });
        const wins = await WordleAttempt.countDocuments({ user: req.userId, won: true });

        res.json({
            streak: user.wordleStreak || { current: 0, max: 0, totalWins: 0 },
            totalGames: totalAttempts,
            wins,
            winRate: totalAttempts > 0 ? Math.round((wins / totalAttempts) * 100) : 0
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ADMIN: Manually set daily word (optional override)
router.post('/admin/set-word', auth, isAdmin, async (req, res) => {
    try {
        const { word, date, hint } = req.body;

        if (!word || word.length !== 5) {
            return res.status(400).json({ message: 'Word must be exactly 5 letters' });
        }

        const targetDate = date ? new Date(date) : getTodayDate();
        const normalizedDate = new Date(Date.UTC(
            targetDate.getFullYear(),
            targetDate.getMonth(),
            targetDate.getDate()
        ));

        // Upsert the word for that date
        const dailyWord = await DailyWord.findOneAndUpdate(
            { date: normalizedDate },
            {
                word: word.toUpperCase(),
                date: normalizedDate,
                createdBy: req.userId,
                hint: hint || ''
            },
            { upsert: true, new: true }
        );

        res.json({
            message: 'Daily word set successfully',
            date: normalizedDate,
            word: dailyWord.word
        });
    } catch (error) {
        console.error('Set word error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ADMIN: Get all daily words
router.get('/admin/words', auth, isAdmin, async (req, res) => {
    try {
        const words = await DailyWord.find()
            .populate('createdBy', 'name')
            .sort({ date: -1 })
            .limit(30);

        res.json(words);
    } catch (error) {
        console.error('Get words error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ADMIN: Delete a daily word
router.delete('/admin/words/:id', auth, isAdmin, async (req, res) => {
    try {
        await DailyWord.findByIdAndDelete(req.params.id);
        res.json({ message: 'Word deleted successfully' });
    } catch (error) {
        console.error('Delete word error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ADMIN: Force regenerate today's word
router.post('/admin/regenerate', auth, isAdmin, async (req, res) => {
    try {
        const today = getTodayDate();

        // Delete existing word for today
        await DailyWord.deleteOne({ date: today });

        // Generate new word
        const word = await generateDailyWord();
        const hint = await generateHintForWord(word);

        const dailyWord = new DailyWord({
            word: word.toUpperCase(),
            date: today,
            createdBy: req.userId,
            hint: hint || ''
        });

        await dailyWord.save();

        res.json({
            message: 'New word generated successfully',
            word: dailyWord.word,
            hint: dailyWord.hint
        });
    } catch (error) {
        console.error('Regenerate error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const topStreaks = await User.find({ 'wordleStreak.current': { $gt: 0 } })
            .select('name studentId wordleStreak avatar')
            .sort({ 'wordleStreak.current': -1 })
            .limit(10);

        res.json(topStreaks);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
