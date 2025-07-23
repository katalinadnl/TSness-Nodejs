import { Types } from 'mongoose';
import { Challenge } from '../models/Challenge';
import { Gym } from '../models/Gym';
import { TrainingRoom } from '../models/TrainingRoom';
import { Participation } from '../models/Participation';
import badgeService from './badgeService';
import { User } from '../models/User';
import { ChallengeAndParticipationStatus, UserRole } from "../models/common/enums";

export class ChallengeService {
    

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
            console.error('error in getUserStats', error);
            return {
                completedChallenges: 0,
                totalCaloriesBurned: 0,
                activeChallenges: 0,
                averageProgress: 0
            };
        }
    }

    async createChallenge(data: any, creatorId: string, creatorRole: string): Promise<any> {
        if (!Types.ObjectId.isValid(creatorId)) throw new Error('id user invalid');

        if (creatorRole === UserRole.GYM_OWNER) {
            if (!Types.ObjectId.isValid(data.gymId)) {
                throw new Error('gymId required for gym owners');
            }

            const gym = await Gym.findById(data.gymId);
            if (!gym) throw new Error('Gym not found');

            if (!gym.ownerId.equals(creatorId)) {
                throw new Error("You are not the owner of this gym");
            }

            const rooms = await TrainingRoom.find({ gymId: data.gymId });

            if (data.equipment?.length > 0) {
                const allEquipments = rooms.flatMap(r => r.equipment);
                const allEquipmentsValid = data.equipment.every((eq: string) => allEquipments.includes(eq));
                if (!allEquipmentsValid) {
                    throw new Error("Some equipment is not linked to the rooms of your gym.");
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
                    throw new Error("Some recommended exercise types are not linked to the rooms of your gym.");
                }
            }
        }

        if (creatorRole === UserRole.CLIENT) {
            if (data.gymId) {
                throw new Error('Clients cannot create challenges linked to a gym');
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
        if (!challenge) throw new Error('Challenge not found');

        const objectUserId = new Types.ObjectId(userId);

        const already = challenge.participants.some(p => p.userId.equals(objectUserId));
        if (already) throw new Error('You are already participating in this challenge');

        challenge.participants.push({
            userId: objectUserId,
            status: ChallengeAndParticipationStatus.ACCEPTED,
            progress: 0,
            caloriesBurned: 0
        });

        await challenge.save();

        await Participation.create({
            userId: objectUserId,
            challengeId,
            status: ChallengeAndParticipationStatus.ACCEPTED,
            progress: 0,
            caloriesBurned: 0,
            startedAt: new Date()
        });

        return challenge;
    }

    async updateProgress(
        challengeId: string,
        userId: string,
        data: { progress: number; caloriesBurned: number }
    ) {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) throw new Error('Challenge not found');

        const participant = challenge.participants.find(p =>
            p.userId.equals(userId)
        );
        if (!participant) throw new Error('You are not participating in this challenge');

        // Progression cumulée côté Challenge
        const challengeRemaining = 100 - participant.progress;
        const addedProgress = Math.min(data.progress, challengeRemaining);
        participant.progress += addedProgress;
        participant.caloriesBurned += data.caloriesBurned;

        let justCompleted = false;
        if (participant.progress >= 100 && participant.status !== ChallengeAndParticipationStatus.COMPLETED) {
            participant.status = ChallengeAndParticipationStatus.COMPLETED;
            justCompleted = true;
        }

        await challenge.save();

        // Progression côté Participation
        const participation = await Participation.findOne({ userId, challengeId });
        if (!participation) throw new Error('Participation not found');

        const participationRemaining = 100 - participation.progress;
        const addedProgressPart = Math.min(data.progress, participationRemaining);
        participation.progress += addedProgressPart;
        participation.caloriesBurned += data.caloriesBurned;

        participation.sessions.push({
            date: new Date(),
            progress: addedProgressPart,
            caloriesBurned: data.caloriesBurned
        });

        if (participation.progress >= 100 && participation.status !== ChallengeAndParticipationStatus.COMPLETED) {
            participation.status = ChallengeAndParticipationStatus.COMPLETED;
            participation.completedAt = new Date();
            justCompleted = true;
        }

        await participation.save();

        // Attribution de badges si le défi vient d’être complété
        if (justCompleted) {
            await badgeService.evaluateAndAwardBadges(userId.toString());

            await User.findByIdAndUpdate(userId, {
                $inc: {
                    score: participation.caloriesBurned
                }
            });
        }

        return challenge;
    }


    async getMySessions(challengeId: string, userId: string) {
        const participation = await Participation.findOne({ challengeId, userId });

        if (!participation) {
            throw new Error('No participation found for this challenge');
        }

        return {
            progress: participation.progress,
            caloriesBurned: participation.caloriesBurned,
            sessions: participation.sessions
        };
    }

    async deleteChallenge(challengeId: string, userId: string, userRole: string): Promise<void> {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) throw new Error('Challenge not found');

        if (userRole === UserRole.SUPER_ADMIN) {
            // peut tout supprimer
        } else if (userRole === UserRole.CLIENT) {
            if (!challenge.creatorId.equals(userId)) {
                throw new Error("You cannot delete this challenge");
            }
        } else if (userRole === UserRole.GYM_OWNER) {
            const gym = await Gym.findById(challenge.gymId);
            if (!gym || !gym.ownerId.equals(userId)) {
                throw new Error("You cannot delete this challenge");
            }
        } else {
            throw new Error("You do not have permission to delete this challenge");
        }

        await Challenge.findByIdAndDelete(challengeId);
        await Participation.deleteMany({ challengeId });
    }

    async shareChallenge(challengeId: string, userIds: string[]): Promise<any> {
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) throw new Error('Challenge not found');

        let added = 0;
        userIds.forEach(userId => {
            const objectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
            if (!challenge.participants.some(p => p.userId.equals(objectId))) {
                challenge.participants.push({
                    userId: objectId,
                    status: ChallengeAndParticipationStatus.INVITED,
                    progress: 0,
                    caloriesBurned: 0
                });
                added++;
            }
        });
        if (added === 0) throw new Error('No new participants invited');
        await challenge.save();
        return challenge;
    }

}
