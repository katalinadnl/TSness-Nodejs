import { Challenge } from '../models/Challenge';
import { User } from '../models/User';
import { Gym } from '../models/Gym';
import { ExerciseType } from '../models/ExerciseType';
import {DifficultyLevel, ChallengeGoal, UserRole} from '../models/common/enums';

export const seedChallenges = async () => {
    console.log('Seeding challenges...');

    await Challenge.deleteMany({});

    const superAdmin = await User.findOne({ role: UserRole.SUPER_ADMIN });
    const gymOwner = await User.findOne({ role: UserRole.GYM_OWNER });
    const client = await User.findOne({ role: UserRole.CLIENT });
    const gym = await Gym.findOne({ ownerId: gymOwner?._id });
    const exerciseTypes = await ExerciseType.find({});

    if (!superAdmin || !gymOwner || !client || !gym || exerciseTypes.length === 0) {
        throw new Error('Missing required seed data (users, gym, or exercise types)');
    }

    await Challenge.create([
        {
            title: 'Défi Brûle-Graisses',
            description: 'Un défi intense pour brûler un max de calories en peu de temps.',
            creatorId: gymOwner._id,
            gymId: gym._id,
            recommendedExerciseTypeIds: [exerciseTypes[0]._id],
            duration: 45,
            difficultyLevel: DifficultyLevel.INTERMEDIATE,
            goals: ChallengeGoal.LOSE_WEIGHT,
            participants: []
        },
        {
            title: 'Défi Cardio Client',
            description: 'Défi personnel pour booster le cardio à la maison.',
            creatorId: client._id,
            gymId: null,
            recommendedExerciseTypeIds: [],
            duration: 30,
            difficultyLevel: DifficultyLevel.BEGINNER,
            goals: ChallengeGoal.IMPROVE_ENDURANCE,
            participants: []
        },
        {
            title: 'Challenge Musculation Avancé',
            description: 'Un programme de musculation avancé pour les habitués.',
            creatorId: gymOwner._id,
            gymId: gym._id,
            recommendedExerciseTypeIds: exerciseTypes.slice(0, 2).map(e => e._id),
            duration: 60,
            difficultyLevel: DifficultyLevel.ADVANCED,
            goals: ChallengeGoal.GAIN_MUSCLE,
            participants: []
        }
    ]);

    console.log('✅ Challenges seeded.');
};
