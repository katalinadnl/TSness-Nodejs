import { Types } from 'mongoose';
import { Challenge } from '../models/Challenge';
import { Gym } from '../models/Gym';
import { Participation } from '../models/Participation';

export class ChallengeService {
    async createChallenge(data: any, creatorId: string, creatorRole: string): Promise<any> {
        if (!Types.ObjectId.isValid(creatorId)) throw new Error('ID utilisateur invalide');

        if (creatorRole === 'gym_owner') {
            if (!Types.ObjectId.isValid(data.gymId)) {
                throw new Error('gymId requis pour un propriétaire');
            }

            const gym = await Gym.findById(data.gymId);
            if (!gym) throw new Error('Salle non trouvée');

            if (!gym.ownerId.equals(creatorId)) {
                throw new Error("Vous n'êtes pas propriétaire de cette salle");
            }
        }

        if (creatorRole === 'client' && data.gymId) {
            throw new Error('Un client ne peut pas lier un défi à une salle');
        }

        const challenge = new Challenge({
            ...data,
            creatorId: new Types.ObjectId(creatorId),
            gymId: data.gymId || null
        });

        return await challenge.save();
    }


    async getChallengesByOwner(ownerId: string): Promise<any[]> {
        return await Challenge.find({ creatorId: ownerId })
            .populate('gymId')
            .populate('recommendedExerciseTypeIds');
    }

    async getAllChallenges(filters: any = {}): Promise<any[]> {
        const query: any = {};

        if (filters.difficultyLevel) {
            query.difficultyLevel = filters.difficultyLevel;
        }

        if (filters.gymId) {
            query.gymId = filters.gymId;
        }

        return await Challenge.find(query)
            .populate('gymId')
            .populate('recommendedExerciseTypeIds');
    }

    async participateInChallenge(challengeId: string, userId: string) {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) throw new Error('Défi non trouvé');

        const already = challenge.participants.some(p => p.userId.equals(userId));
        if (already) throw new Error('Déjà inscrit à ce défi');

        challenge.participants.push({
            userId,
            status: 'accepted',
            progress: 0,
            caloriesBurned: 0
        });
        await challenge.save();

        await Participation.create({
            userId,
            challengeId,
            status: 'accepted',
            progress: 0,
            caloriesBurned: 0,
            startedAt: new Date()
        });

        return challenge;
    }

    async updateProgress(challengeId: string, userId: string, data: { progress: number, caloriesBurned: number }) {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) throw new Error('Défi non trouvé');

        const participant = challenge.participants.find(p => p.userId.equals(userId));
        if (!participant) throw new Error('Vous ne participez pas à ce défi');

        // Ajout cumulatif
        participant.progress += data.progress;
        participant.caloriesBurned += data.caloriesBurned;

        if (participant.progress >= 100 && participant.status !== 'completed') {
            participant.status = 'completed';
        }

        await challenge.save();

        // Mise à jour de Participation
        const participation = await Participation.findOne({ userId, challengeId });
        if (!participation) throw new Error('Participation introuvable');

        participation.progress += data.progress;
        participation.caloriesBurned += data.caloriesBurned;

// Ajout de la session
        participation.sessions.push({
            date: new Date(),
            progress: data.progress,
            caloriesBurned: data.caloriesBurned
        });

        if (participation.progress >= 100 && participation.status !== 'completed') {
            participation.status = 'completed';
            participation.completedAt = new Date();
        }

        await participation.save();


        return challenge;
    }

    async getMySessions(challengeId: string, userId: string) {
        const participation = await Participation.findOne({ challengeId, userId });

        if (!participation) {
            throw new Error('Aucune participation trouvée pour ce défi');
        }

        return {
            progress: participation.progress,
            caloriesBurned: participation.caloriesBurned,
            sessions: participation.sessions
        };
    }


}
