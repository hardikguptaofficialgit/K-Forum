import axios from 'axios';
import { franc } from 'franc';
import dotenv from 'dotenv';
dotenv.config();

// --- Bad Words List (Fallback) ---
const BAD_WORDS_LIST = [
    // Hindi / Indian Regional - Explicit
    "madharchod", "madarchod", "madarjaat", "bhenchod", "behenchod", "bhen ke lode", "bhenkelode",
    "chutiya", "chootiya", "chut", "choot", "lavda", "lauda", "loda", "lode", "land", "lund",
    "bhosdike", "bhosadike", "bhosdiwale", "randi", "randwa", "saala", "saale", "harami", "haramkhor",
    "kamine", "kamina", "bhadwe", "bhadwa", "gand", "gaand", "gandu", "jhaatu", "jhaat", "tatte",
    "chodu", "chodna", "chod", "gaandmara", "gaand mara", "maa ki", "behen ki", "bhen ki",
    // Abbreviated Hindi
    "mc", "bc", "mkc", "bkl", "mka", "tmkc", "bsdk", "bkc", "mkb", "bkb", "lkb",
    // Phrase patterns
    "teri maa ki", "behen ka", "maa chod", "bhen chod", "teri behen", "tera baap",
    "maa ka bhosda", "behen ka loda", "gand mara", "lund choos", "chut ka",
    // English explicit
    "fuck", "fucking", "fucker", "shit", "bitch", "asshole", "bastard", "dick", "pussy",
    "whore", "slut", "cunt", "nigger", "faggot", "motherfucker", "cocksucker", "bullshit",
    "fuckhead", "dipshit", "jackass", "cock", "penis", "vagina",
    // Insults (context-aware)
    "stupid", "idiot", "dumb", "useless", "trash", "garbage", "loser", "moron", "retard", "pathetic",
    "horrible", "disgusting", "pagal", "bewakoof", "gadha", "ullu", "chutiye", "gandu"
];

// --- Harassment Patterns (regex-based) ---
const HARASSMENT_PATTERNS = [
    /you\s+(are|r)\s+(stupid|useless|trash|garbage|dumb|idiot|pathetic|horrible)/i,
    /nobody\s+(likes|wants)\s+you/i,
    /just\s+(leave|go\s+away|die)/i,
    /you('ll|will)\s+regret/i,
    /people\s+like\s+you/i,
    /go\s+away/i,
    /you\s+ruin/i,
    /hate\s+you/i,
    /kill\s+(you|yourself)/i,
    /shut\s+(up|the\s+fuck)/i,
    /you\s+suck/i,
    /get\s+lost/i,
    /drop\s+dead/i,
    /tu\s+(bilkul|bahut)\s+\w+\s+hai/i,
    /tum\s+\w+\s+ho/i,
    // Hindi abusive phrases
    /bhen\s*k[ei]\s*lod[ea]/i,
    /maa\s*k[ei]\s*(lod[ea]|chut|bhosda)/i,
    /teri\s*(maa|behen|behan)/i,
    /ter[ai]\s*baap/i,
    /gand\s*mar/i,
    /lund\s*choos/i,
    /chut\s*(k[ei]|mara)/i,
];

// --- Text Normalization (for obfuscation detection) ---
const normalizeText = (text) => {
    if (!text) return "";
    let normalized = text.toLowerCase();

    // Leetspeak substitutions
    normalized = normalized
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/@/g, 'a')
        .replace(/\$/g, 's')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/!/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/8/g, 'b')
        .replace(/\./g, '')
        .replace(/_/g, '')
        .replace(/-/g, '');

    // Remove repeated characters
    normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');

    return normalized;
};

// --- Detect Language ---
const detectLanguage = (text) => {
    try {
        const langCode = franc(text);
        return langCode === 'und' ? 'unknown' : langCode;
    } catch {
        return 'unknown';
    }
};

// --- Local Fallback Moderation ---
const checkLocalFallback = (text) => {
    try {
        const normalized = normalizeText(text);
        const strictNormalized = normalized.replace(/[^a-z]/g, '');
        const spacedText = normalized.replace(/[^a-z]/g, ' ');
        const words = spacedText.split(/\s+/).filter(w => w.length > 0);

        const foundWords = [];

        for (const badWord of BAD_WORDS_LIST) {
            if (words.includes(badWord)) {
                foundWords.push(badWord);
                continue;
            }
            if (badWord.length > 3 && strictNormalized.includes(badWord)) {
                foundWords.push(badWord);
            }
        }

        const matchedPatterns = [];
        for (const pattern of HARASSMENT_PATTERNS) {
            if (pattern.test(text)) {
                matchedPatterns.push(pattern.toString());
            }
        }

        if (foundWords.length > 0 || matchedPatterns.length > 0) {
            const confidence = Math.min(0.5 + (foundWords.length * 0.15) + (matchedPatterns.length * 0.2), 1);
            return {
                isUnsafe: true,
                confidence,
                categories: matchedPatterns.length > 0 ? ['harassment', 'local_filter'] : ['local_filter'],
                flaggedWords: [...new Set(foundWords)]
            };
        }

        return null;
    } catch (e) {
        console.error("Local moderation error:", e);
        return null;
    }
};

// ============================================
// GOOGLE PERSPECTIVE API (Best for multi-language)
// ============================================
const checkPerspectiveAPI = async (text) => {
    if (!process.env.PERSPECTIVE_API_KEY) {
        return null;
    }

    try {
        console.log("Using Google Perspective API...");

        const response = await axios.post(
            `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
            {
                comment: { text },
                languages: ["en", "hi"],  // English and Hindi
                requestedAttributes: {
                    TOXICITY: {},
                    SEVERE_TOXICITY: {},
                    IDENTITY_ATTACK: {},
                    INSULT: {},
                    PROFANITY: {},
                    THREAT: {}
                }
            },
            { timeout: 10000 }
        );

        const scores = response.data.attributeScores;

        // Get all scores
        const toxicity = scores.TOXICITY?.summaryScore?.value || 0;
        const severeToxicity = scores.SEVERE_TOXICITY?.summaryScore?.value || 0;
        const identityAttack = scores.IDENTITY_ATTACK?.summaryScore?.value || 0;
        const insult = scores.INSULT?.summaryScore?.value || 0;
        const profanity = scores.PROFANITY?.summaryScore?.value || 0;
        const threat = scores.THREAT?.summaryScore?.value || 0;

        // Get the maximum score
        const maxScore = Math.max(toxicity, severeToxicity, identityAttack, insult, profanity, threat);

        // Build categories list
        const categories = [];
        if (toxicity >= 0.5) categories.push('toxicity');
        if (severeToxicity >= 0.5) categories.push('severe_toxicity');
        if (identityAttack >= 0.5) categories.push('identity_attack');
        if (insult >= 0.5) categories.push('insult');
        if (profanity >= 0.5) categories.push('profanity');
        if (threat >= 0.5) categories.push('threat');

        console.log("Perspective API Result:", {
            toxicity: (toxicity * 100).toFixed(1) + '%',
            insult: (insult * 100).toFixed(1) + '%',
            profanity: (profanity * 100).toFixed(1) + '%',
            maxScore: (maxScore * 100).toFixed(1) + '%'
        });

        return {
            isUnsafe: maxScore >= 0.45,
            confidence: maxScore,
            categories,
            flaggedWords: [],
            source: 'perspective'
        };

    } catch (error) {
        console.warn("Perspective API Error:", error.response?.data?.error?.message || error.message);
        return null;
    }
};

// ============================================
// MAIN MODERATION FUNCTION
// ============================================
export const moderateText = async (text) => {
    const language = detectLanguage(text);

    // ========================================
    // 1. FIRST: Check Local Fallback (Fastest, catches Hindi slang)
    // ========================================
    const localResult = checkLocalFallback(text);
    if (localResult && localResult.isUnsafe) {
        console.log("Local filter caught unsafe content:", localResult.flaggedWords);
        return { ...localResult, language };
    }

    // ========================================
    // 2. SECOND: Try Google Perspective API (Best for multi-language)
    // ========================================
    const perspectiveResult = await checkPerspectiveAPI(text);
    if (perspectiveResult) {
        return { ...perspectiveResult, language };
    }

    // ========================================
    // 3. THIRD: Try OpenAI Moderation API
    // ========================================
    try {
        if (process.env.OPENAI_API_KEY) {
            console.log("Using OpenAI Moderation API...");

            const response = await axios.post(
                "https://api.openai.com/v1/moderations",
                {
                    model: "omni-moderation-latest",
                    input: text
                },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 10000
                }
            );

            const result = response.data.results[0];
            const scores = Object.values(result.category_scores || {});
            const maxScore = scores.length ? Math.max(...scores) : 0;
            const flaggedCategories = Object.keys(result.categories || {}).filter(
                key => result.categories[key]
            );

            console.log("OpenAI Moderation Result:", { maxScore, flaggedCategories });

            return {
                isUnsafe: maxScore >= 0.45,
                confidence: maxScore,
                categories: flaggedCategories,
                flaggedWords: [],
                language
            };
        }
    } catch (apiError) {
        console.warn("OpenAI API Error:", apiError.message);
    }

    // ========================================
    // 4. FOURTH: Try Gemini API
    // ========================================
    try {
        if (process.env.GEMINI_API_KEY) {
            console.log("Using Gemini API fallback...");
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `Analyze this text for toxicity. Return ONLY valid JSON:
{
  "isUnsafe": boolean,
  "confidence": number between 0.0 and 1.0,
  "categories": ["harassment", "hate", "sexual", "violence", etc if applicable]
}

Text: "${text}"`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textOutput = response.text();
            const jsonStr = textOutput.replace(/```json\n?|\n?```/g, "").trim();
            const parsed = JSON.parse(jsonStr);

            return {
                isUnsafe: parsed.isUnsafe || parsed.confidence >= 0.45,
                confidence: parsed.confidence || 0,
                categories: parsed.categories || [],
                flaggedWords: [],
                language
            };
        }
    } catch (geminiError) {
        console.warn("Gemini API Error:", geminiError.message);
    }

    // ========================================
    // 5. FALLBACK: No issues found
    // ========================================
    return {
        isUnsafe: false,
        confidence: 0.1,
        categories: [],
        flaggedWords: [],
        language
    };
};

// Legacy export
export const moderateContent = moderateText;
