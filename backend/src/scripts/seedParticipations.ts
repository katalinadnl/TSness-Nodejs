import { Participation } from '../models/Participation';
import { Challenge } from '../models/Challenge';
import { User } from '../models/User';

export const seedParticipations = async () => {
    console.log('Seeding participations...');

    await Participation.deleteMany({});

    const client = await User.findOne({ role: 'client' });
    const challenges = await Challenge.find({});

    if (!client || challenges.length === 0) {
        throw new Error('Client or challenges not found. Make sure to seed users and challenges first.');
    }

    const participations = [];

    for (const challenge of challenges) {
        const sessionCount = Math.floor(Math.random() * 4) + 1;

        const sessions = Array.from({ length: sessionCount }).map(() => ({
            date: new Date(),
            progress: Math.floor(Math.random() * 40) + 10,
            caloriesBurned: Math.floor(Math.random() * 150) + 50
        }));

        let totalProgress = 0;
        let totalCalories = 0;
        const cappedSessions = [];

        for (const session of sessions) {
            const remaining = 100 - totalProgress;
            const appliedProgress = Math.min(session.progress, remaining);
            totalProgress += appliedProgress;
            totalCalories += session.caloriesBurned;

            cappedSessions.push({
                ...session,
                progress: appliedProgress
            });

            if (totalProgress >= 100) break; // stop si on a atteint 100
        }

        const status = totalProgress >= 100 ? 'completed' : totalProgress > 0 ? 'accepted' : 'invited';

        const participation = await Participation.create({
            userId: client._id,
            challengeId: challenge._id,
            status,
            progress: totalProgress,
            caloriesBurned: totalCalories,
            startedAt: cappedSessions[0]?.date,
            completedAt: totalProgress >= 100 ? new Date() : undefined,
            sessions: cappedSessions
        });

        await Challenge.findByIdAndUpdate(challenge._id, {
            $push: {
                participants: {
                    userId: client._id,
                    status,
                    progress: totalProgress,
                    caloriesBurned: totalCalories
                }
            }
        });

        participations.push(participation);
    }

    console.log(`✅ ${participations.length} participations créées avec sessions`);
};
