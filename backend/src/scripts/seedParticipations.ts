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
        const progress = Math.floor(Math.random() * 101);
        const calories = Math.floor(Math.random() * 500);
        const status = progress >= 100 ? 'completed' : progress > 0 ? 'accepted' : 'invited';

        const sessionCount = Math.floor(Math.random() * 4) + 1;

        const sessions = Array.from({ length: sessionCount }).map(() => ({
            date: new Date(),
            progress: Math.floor(Math.random() * 40) + 10,
            caloriesBurned: Math.floor(Math.random() * 150) + 50
        }));

        const totalProgress = sessions.reduce((acc, s) => acc + s.progress, 0);
        const totalCalories = sessions.reduce((acc, s) => acc + s.caloriesBurned, 0);

        const participation = await Participation.create({
            userId: client._id,
            challengeId: challenge._id,
            status,
            progress: totalProgress,
            caloriesBurned: totalCalories,
            startedAt: sessions[0]?.date,
            completedAt: totalProgress >= 100 ? new Date() : undefined,
            sessions
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
