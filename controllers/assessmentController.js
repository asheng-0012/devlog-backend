const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The prompt we send to Gemini — it acts as a strict coding instructor
function buildPrompt(problemStatement, language, code) {
    return `
You are a strict but encouraging coding instructor reviewing a student's solution.

PROBLEM:
${problemStatement}

LANGUAGE: ${language}

STUDENT'S CODE:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Assess this solution and respond ONLY with a valid JSON object in this exact shape (no markdown, no extra text):
{
  "correctness": <integer 0-100>,
  "timeComplexity": "<e.g. O(n) or O(n log n)>",
  "spaceComplexity": "<e.g. O(1) or O(n)>",
  "points": <integer 0-50>,
  "feedback": "<2-3 sentences: what is correct, what needs improvement, one concrete suggestion>",
  "improvements": [
    "<specific improvement 1>",
    "<specific improvement 2>",
    "<specific improvement 3>"
  ]
}

SCORING RULES:
- correctness: 0 if the solution is empty or completely wrong, up to 100 if fully correct and optimal
- points: awarded for leaderboard (correctness >= 80 → 30-50 pts based on complexity; 50-79 → 10-29 pts; < 50 → 0-9 pts)
- timeComplexity and spaceComplexity: analyze the actual code, not the optimal
- feedback: be like a real instructor — direct and educational
- improvements: 3 actionable bullet points the student can apply immediately

Respond ONLY with the JSON. No code blocks, no explanation outside the JSON.
`.trim();
}

// POST /api/assess — called by the frontend after the student submits code
const assessCode = async (req, res) => {
    try {

        const { problemStatement, language, code } = req.body;

        if (!problemStatement || !language || !code) {
            return res.status(400).json({ message: 'problemStatement, language and code are all required' });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            return res.status(500).json({ message: 'Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
        const result = await model.generateContent(buildPrompt(problemStatement, language, code));
        const rawText = result.response.text().trim();

        // strip any accidental markdown code fences the model may add
        const jsonText = rawText.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();

        let assessment;
        try {
            assessment = JSON.parse(jsonText);
        } catch {
            // if parsing fails, return a safe fallback instead of crashing
            return res.status(502).json({ message: 'AI returned an unexpected format. Please try again.' });
        }

        // make sure all fields are present (belt + suspenders)
        const safe = {
            correctness: Number(assessment.correctness) || 0,
            timeComplexity: assessment.timeComplexity || '—',
            spaceComplexity: assessment.spaceComplexity || '—',
            points: Number(assessment.points) || 0,
            feedback: assessment.feedback || 'No feedback returned.',
            improvements: Array.isArray(assessment.improvements) ? assessment.improvements : [],
        };

        res.status(200).json(safe);

    } catch (error) {
        // Gemini quota / network errors
        res.status(500).json({ message: `AI assessment failed: ${error.message}` });
    }
};

module.exports = { assessCode };

