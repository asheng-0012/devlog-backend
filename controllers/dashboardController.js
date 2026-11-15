const Submission = require('../models/submission');

// Compute stats, weekly chart, recent list, and unique solved problem IDs
// from the logged-in user's real submission history
const getDashboard = async (req, res) => {
    try {

        const userId = req.user._id;

        // all submissions for this user, newest first
        const all = await Submission.find({ userId }).sort({ createdAt: -1 });

        // ---- total submissions ----
        const totalSubmissions = all.length;

        // ---- solved problems (correctness >= 80, count unique problemIds) ----
        const solvedIds = new Set(
            all.filter(s => s.correctness >= 80).map(s => s.problemId)
        );
        const solved = solvedIds.size;

        // ---- average correctness across all submissions ----
        const avgCorrectness = totalSubmissions
            ? Math.round(all.reduce((sum, s) => sum + s.correctness, 0) / totalSubmissions)
            : 0;

        // ---- streak: how many consecutive days (ending today) has the user submitted ----
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // collect the unique days (as timestamps) on which the user submitted
        const submissionDays = new Set(
            all.map(s => {
                const d = new Date(s.createdAt);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            })
        );

        let streak = 0;
        const ONE_DAY = 86400000;
        let check = today.getTime();
        while (submissionDays.has(check)) {
            streak++;
            check -= ONE_DAY;
        }

        // ---- last 7 days chart (Mon → Sun labels, # problems solved each day) ----
        const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const week = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date(today.getTime() - i * ONE_DAY);
            const dayStart = day.getTime();
            const dayEnd = dayStart + ONE_DAY;

            // count unique problems with correctness >= 80 solved on this day
            const daySubmissions = all.filter(s => {
                const t = new Date(s.createdAt).getTime();
                return t >= dayStart && t < dayEnd;
            });
            const daySolved = new Set(
                daySubmissions.filter(s => s.correctness >= 80).map(s => s.problemId)
            ).size;

            week.push({ day: DAY_LABELS[day.getDay()], solved: daySolved });
        }

        // ---- recent: last 5 submissions ----
        const recent = all.slice(0, 5).map(s => ({
            id: s.problemId,
            title: s.title,
            language: s.language,
            correctness: s.correctness,
        }));

        // ---- recommended: not implemented here, frontend keeps static list for now ----

        res.status(200).json({
            stats: { solved, streak, avgCorrectness, submissions: totalSubmissions },
            week,
            recent,
            solvedProblemIds: [...solvedIds], // so the Problems page can mark them
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboard };

