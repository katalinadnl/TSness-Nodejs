import { Types } from 'mongoose';
import { Challenge } from '../models/Challenge';
import { Gym } from '../models/Gym';
import { TrainingRoom } from '../models/TrainingRoom';
import { Participation } from '../models/Participation';

export class ChallengeService {
    
    /**
     * Compte le nombre de défis complétés par un utilisateur
     */
    async getCompletedChallengesCount(userId: string): Promise<number> {
        try {
            const challenges = await Challenge.find({
                'participants.userId': userId,
                'participants.status': 'completed'
            }).lean();

            return challenges.length;
        } catch (error) {
            console.error('Erreur lors du comptage des défis complétés:', error);
            return 0;
        }
    }

    /**
     * Récupère les statistiques d'un utilisateur pour les badges
     */
    async getUserStats(userId: string): Promise<{
        completedChallenges: number;
        totalCaloriesBurned: number;
        activeChallenges: number;
        averageProgress: number;
    }> {
        try {
            const challenges = await Challenge.find({
                'participants.userId': userId
            }).lean();
            
            let totalCaloriesBurned = 0;
            let totalProgress = 0;
            let activeCount = 0;
            let completedCount = 0;

            challenges.forEach(challenge => {
                const participant = challenge.participants.find(
                    p => p.userId.toString() === userId
                );
                if (participant) {
                    if (participant.status === 'completed') {
                        completedCount++;
                        totalCaloriesBurned += participant.caloriesBurned;
                    } else if (participant.status === 'accepted') {
                        totalProgress += participant.progress;
                        activeCount++;
                    }
                }
            });

            return {
                completedChallenges: completedCount,
                totalCaloriesBurned,
                activeChallenges: activeCount,
                averageProgress: activeCount > 0 ? totalProgress / activeCount : 0
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return {
                completedChallenges: 0,
                totalCaloriesBurned: 0,
                activeChallenges: 0,
                averageProgress: 0
            };
        }
    }
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

            const rooms = await TrainingRoom.find({ gymId: data.gymId });

            if (data.equipment?.length > 0) {
                const allEquipments = rooms.flatMap(r => r.equipment);
                const allEquipmentsValid = data.equipment.every((eq: string) => allEquipments.includes(eq));
                if (!allEquipmentsValid) {
                    throw new Error("Certains équipements ne sont pas disponibles dans les salles de votre salle de sport.");
                }
            }

            if (data.recommendedExerciseTypeIds?.length > 0) {
                const validExerciseTypeIds = rooms
                    .map(r => r.assignedExerciseTypeId?.toString())
                    .filter(Boolean);

                const allExerciseValid = data.recommendedExerciseTypeIds.every((id: string) =>
                    validExerciseTypeIds.includes(id)
                );

                if (!allExerciseValid) {
                    throw new Error("Certains types d'exercices ne sont pas liés aux salles de votre gym.");
                }
            }
        }

        if (creatorRole === 'client') {
            if (data.gymId) {
                throw new Error('Un client ne peut pas lier un défi à une salle');
            }

            data.gymId = null;
            data.equipment = [];
            data.recommendedExerciseTypeIds = [];
        }

        const challenge = new Challenge({
            ...data,
            creatorId: new Types.ObjectId(creatorId),
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

        if (filters.goals) {
            query.goals = filters.goals;
        }

        if (filters.exerciseTypeId) {
            query.recommendedExerciseTypeIds = filters.exerciseTypeId;
        }

        if (filters.minDuration || filters.maxDuration) {
            query.duration = {};
            if (filters.minDuration) query.duration.$gte = Number(filters.minDuration);
            if (filters.maxDuration) query.duration.$lte = Number(filters.maxDuration);
        }

        return await Challenge.find(query)
            .populate('gymId')
            .populate('recommendedExerciseTypeIds');
    }


    async participateInChallenge(challengeId: string, userId: string) {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) throw new Error('Défi non trouvé');

        const objectUserId = new Types.ObjectId(userId);

        const already = challenge.participants.some(p => p.userId.equals(objectUserId));
        if (already) throw new Error('Déjà inscrit à ce défi');

        challenge.participants.push({
            userId: objectUserId,
            status: 'accepted',
            progress: 0,
            caloriesBurned: 0
        });

        await challenge.save();

        await Participation.create({
            userId: objectUserId,
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

    async deleteChallenge(challengeId: string, userId: string, userRole: string): Promise<void> {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) throw new Error('Défi non trouvé');

        if (userRole === 'super_admin') {
            // peut tout supprimer
        } else if (userRole === 'client') {
            if (!challenge.creatorId.equals(userId)) {
                throw new Error("Vous n'avez pas le droit de supprimer ce défi");
            }
        } else if (userRole === 'gym_owner') {
            const gym = await Gym.findById(challenge.gymId);
            if (!gym || !gym.ownerId.equals(userId)) {
                throw new Error("Vous n'avez pas le droit de supprimer ce défi");
            }
        } else {
            throw new Error("Rôle non autorisé");
        }

        await Challenge.findByIdAndDelete(challengeId);
        await Participation.deleteMany({ challengeId });
    }

    async shareChallenge(challengeId: string, userIds: string[]): Promise<any> {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) throw new Error('Défi non trouvé');

        let added = 0;
        userIds.forEach(userId => {
            const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
            if (!challenge.participants.some(p => p.userId.equals(objectId))) {
                challenge.participants.push({
                    userId: objectId,
                    status: 'invited',
                    progress: 0,
                    caloriesBurned: 0
                });
                added++;
            }
        });
        if (added === 0) throw new Error('Aucun nouvel utilisateur invité');
        await challenge.save();
        return challenge;
    }

}
