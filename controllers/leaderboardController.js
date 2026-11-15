const Submission = require('../models/submission');
const User = require('../models/user');

// Aggregate points per user for a given time window and return top 7 + current user
const getLeaderboard = async (req, res) => {
    try {

        const period = req.query.period === 'weekly' ? 'weekly' : 'daily';

        // figure out the start of the window
        const now = new Date();
        const start = new Date(now);
        if (period === 'daily') {
            start.setHours(0, 0, 0, 0); // midnight today
        } else {
            // start of this week (Monday)
            const day = start.getDay(); // 0 = Sun
            const diff = day === 0 ? 6 : day - 1;
            start.setDate(start.getDate() - diff);
            start.setHours(0, 0, 0, 0);
        }

        // aggregate: sum points and count unique solved problems per user in this window
        const agg = await Submission.aggregate([
            { $match: { createdAt: { $gte: start } } },
            {
                $group: {
                    _id: '$userId',
                    points: { $sum: '$points' },
                    // count unique solved problemIds (correctness >= 80)
                    solved: {
                        $sum: {
                            $cond: [{ $gte: ['$correctness', 80] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { points: -1 } }
        ]);

        // pull the user names from the User collection
        const userIds = agg.map(r => r._id);
        const users = await User.find({ _id: { $in: userIds }, showOnLeaderboard: true }).select('name');
        const nameMap = {};
        users.forEach(u => { nameMap[String(u._id)] = u.name; });

        // build the ranked list (only users who opted in to the leaderboard)
        const players = [];
        let rank = 1;
        for (const row of agg) {
            const name = nameMap[String(row._id)];
            if (!name) continue; // showOnLeaderboard = false → skip
            players.push({
                _id: String(row._id),
                rank,
                name,
                solved: row.solved,
                points: row.points
            });
            rank++;
        }

        // compute streak for current user
        const allUserSubs = await Submission.find({ userId: req.user._id });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const subDays = new Set(
            allUserSubs.map(s => {
                const d = new Date(s.createdAt);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            })
        );
        let userStreak = 0;
        const ONE_DAY = 86400000;
        let check = today.getTime();
        while (subDays.has(check)) {
            userStreak++;
            check -= ONE_DAY;
        }

        // find current user's position
        const myId = String(req.user._id);
        const myIndex = players.findIndex(p => p._id === myId);

        let you;
        if (myIndex === -1) {
            // current user has no submissions this period
            you = {
                _id: myId,
                name: req.user.name,
                rank: players.length + 1,
                points: 0,
                streak: userStreak,
                solved: 0,
                gap: players.length > 0 ? players[players.length - 1].points : 0,
            };
        } else {
            const myPlayer = players[myIndex];
            const aboveMe = myIndex > 0 ? players[myIndex - 1] : null;
            you = {
                ...myPlayer,
                streak: userStreak,
                gap: aboveMe ? Math.max(0, aboveMe.points - myPlayer.points) : 0,
            };
        }

        // how many hours / days until reset
        const resetMs = period === 'daily'
            ? new Date(now).setHours(24, 0, 0, 0) - now.getTime()
            : (7 - (now.getDay() === 0 ? 7 : now.getDay() - 1)) * 86400000;

        const resetHours = Math.ceil(resetMs / 3600000);
        const resets = period === 'daily'
            ? `Daily board resets in ${resetHours} hour${resetHours !== 1 ? 's' : ''}`
            : `Weekly board resets in ${Math.ceil(resetMs / 86400000)} day${Math.ceil(resetMs / 86400000) !== 1 ? 's' : ''}`;

        res.status(200).json({
            period,
            label: period === 'daily' ? 'Daily' : 'Weekly',
            resets,
            chartTitle: period === 'daily' ? 'Points today' : 'Points this week',
            totalPlayers: players.length,
            you,
            players: players.slice(0, 7), // top 7
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getLeaderboard };

