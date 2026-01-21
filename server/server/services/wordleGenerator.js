import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_build');

// Curated list of 5-letter words related to college/KIIT/student life as fallback
const FALLBACK_WORDS = [
    // Academic
    "STUDY", "LEARN", "BOOKS", "CLASS", "NOTES", "EXAMS", "GRADE", "MARKS",
    "TEACH", "BRAIN", "SMART", "THINK", "WRITE", "PAPER", "ESSAY", "TOPIC",
    // Campus Life
    "DORMS", "HOSTEL", "ROOMS", "BUDDY", "SQUAD", "CROWD", "PARTY", "VIBE",
    "CLUBS", "FESTS", "MUSIC", "DANCE", "STAGE", "GAMES", "SPORT", "FIELD",
    // Tech/Engineering
    "CODES", "LOGIC", "DEBUG", "STACK", "LINUX", "REACT", "LOOPS", "ARRAY",
    "ROBOT", "CYBER", "CLOUD", "NODES", "QUERY", "PIXEL", "BYTES", "INPUT",
    // Food/Canteen
    "FOODS", "MEALS", "SNACK", "PIZZA", "JUICE", "BEANS", "BREAD", "SPICE",
    // Emotions/Student Life
    "SLEEP", "TIRED", "CHILL", "RELAX", "HAPPY", "PEACE", "DREAM", "GOALS",
    "FOCUS", "GRIND", "HUSTLE", "BREAK", "NIGHT", "EARLY", "PRIME",
    // Places/Campus
    "BLOCK", "TOWER", "PLAZA", "LAWNS", "COURT", "STAGE", "TRACK", "BENCH",
    // Miscellaneous College Terms
    "BATCH", "MAJOR", "MINOR", "CROWD", "GROUP", "TEAMS", "LEADS", "SKILL",
    "INTRO", "FINAL", "TERMS", "SCALE", "POINT", "RANGE", "LEVEL", "PRIZE"
];

const WORD_GENERATION_PROMPT = `Generate exactly ONE 5-letter English word related to college student life, university campus, academics, technology, engineering, hostels, or student activities.

Requirements:
- EXACTLY 5 letters (no more, no less)
- Common English word (not obscure)
- Related to student/college life themes like: studying, exams, coding, hostel life, friends, food, campus, fests, clubs, sports, technology, programming
- Easy to medium difficulty for a Wordle game

Examples of good words: STUDY, EXAMS, CODES, PIZZA, SLEEP, GAMES, BOOKS, NOTES, CLASS, PARTY

Return ONLY the single 5-letter word in uppercase, nothing else.`;

export const generateDailyWord = async () => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.log("No GEMINI_API_KEY, using fallback word list");
            return getRandomFallbackWord();
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(WORD_GENERATION_PROMPT);
        const response = await result.response;
        const word = response.text().trim().toUpperCase();

        // Validate the word
        if (word.length === 5 && /^[A-Z]+$/.test(word)) {
            console.log(`AI generated word: ${word}`);
            return word;
        } else {
            console.log(`AI returned invalid word: "${word}", using fallback`);
            return getRandomFallbackWord();
        }
    } catch (error) {
        console.error("AI word generation error:", error.message);
        return getRandomFallbackWord();
    }
};

const getRandomFallbackWord = () => {
    const randomIndex = Math.floor(Math.random() * FALLBACK_WORDS.length);
    const word = FALLBACK_WORDS[randomIndex];
    console.log(`Using fallback word: ${word}`);
    return word;
};

// Generate a hint for the word using AI
export const generateHintForWord = async (word) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return null;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Give a very short, cryptic hint (max 5 words) for the word "${word}" without revealing the word itself. The hint should be related to college/student life context. Return ONLY the hint, nothing else.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const hint = response.text().trim();

        // Validate hint doesn't contain the word
        if (hint.toUpperCase().includes(word)) {
            return null;
        }

        return hint.length > 50 ? hint.substring(0, 50) : hint;
    } catch (error) {
        console.error("Hint generation error:", error.message);
        return null;
    }
};

export default { generateDailyWord, generateHintForWord };
