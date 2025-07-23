import { Badge, IBadge } from '../models/Badge';
import { Types } from 'mongoose';
import { ChallengeService } from "./challengeService";
import { UserBadge, IUserBadge } from '../models/UserBadge';

const challengeService = new ChallengeService();

interface UserStats {
    completedChallenges: number;
    totalCaloriesBurned: number;
    activeChallenges: number;
    averageProgress: number;
}

export class BadgeService {
    async getAllBadges(): Promise<IBadge[]> {
        return await Badge.find().sort({ createdAt: -1 });
    }

    async getBadgeById(id: string): Promise<IBadge> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('invalid ID');
        }

        const badge = await Badge.findById(id);
        if (!badge) {
            throw new Error('Badge not found');
        }

        return badge;
    }

    async createBadge(data: any): Promise<IBadge> {
        const badge = new Badge(data);
        return await badge.save();
    }

    async updateBadge(id: string, data: any): Promise<IBadge> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid ID');
        }

        const badge = await Badge.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });

        if (!badge) {
            throw new Error('Badge not found');
        }

        return badge;
    }

    async deleteBadge(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid ID');
        }

        const badge = await Badge.findByIdAndDelete(id);
        if (!badge) {
            throw new Error('Badge not found');
        }
    }

    private evaluateRule(rule: string, userStats: UserStats): boolean {
        try {
            const ruleRegex = /(\w+)\s*(>=|<=|>|<|==)\s*(\d+)/;
            const match = rule.match(ruleRegex);

            if (!match) {
                console.warn(`Rule of the badge invalid: ${rule}`);
                return false;
            }

            const [, statName, operator, valueStr] = match;
            const value = parseInt(valueStr, 10);
            const userValue = userStats[statName as keyof UserStats];

            if (userValue === undefined) {
                console.warn(`User statistics unknown: ${statName}`);
                return false;
            }

            switch (operator) {
                case '>=': return userValue >= value;
                case '<=': return userValue <= value;
                case '>': return userValue > value;
                case '<': return userValue < value;
                case '==': return userValue === value;
                default: return false;
            }
        } catch (error) {
            console.error('Error in evaluating the rule:', error);
            return false;
        }
    }

    private async getUserStats(userId: string): Promise<UserStats> {
        return await challengeService.getUserStats(userId);
    }

    async evaluateAndAwardBadges(userId: string): Promise<IUserBadge[]> {
        try {
            const allBadges = await Badge.find({}).lean();

            const userBadges = await UserBadge.find({ userId }).lean();
            const earnedBadgeIds = userBadges.map(ub => ub.badgeId.toString());

            const userStats = await this.getUserStats(userId);

            const newBadges: IUserBadge[] = [];

            for (const badge of allBadges) {
                if (earnedBadgeIds.includes(badge._id.toString())) {
                    continue;
                }

                if (this.evaluateRule(badge.rule, userStats)) {
                    const newUserBadge = new UserBadge({
                        userId,
                        badgeId: badge._id,
                        earnedAt: new Date()
                    });

                    try {
                        await newUserBadge.save();
                        const populatedBadge = await newUserBadge.populate('badgeId');
                        newBadges.push(populatedBadge);
                        console.log(`Badge "${badge.name}" given to the userId ${userId}`);
                    } catch (saveError: any) {
                        if (saveError.code !== 11000) {
                            console.error('Error in attribution of the badge:', saveError);
                        }
                    }
                }
            }

            return newBadges;
        } catch (error) {
            throw error;
        }
    }

    async getUserBadges(userId: string): Promise<any[]> {
        try {
            const userBadges = await UserBadge.find({ userId })
                .populate('badgeId')
                .sort({ earnedAt: -1 })
                .lean();

            return userBadges.map(userBadge => ({
                _id: userBadge._id,
                userId: userBadge.userId,
                badgeId: userBadge.badgeId._id,
                badge: userBadge.badgeId,
                earnedAt: userBadge.earnedAt,
                createdAt: userBadge.createdAt,
                updatedAt: userBadge.updatedAt
            }));
        } catch (error) {
            throw error;
        }
    }

    async getAllBadgesWithStatus(userId: string): Promise<{ badge: IBadge; earned: boolean; earnedAt?: Date }[]> {
        try {
            await this.evaluateAndAwardBadges(userId);

            const allBadges = await Badge.find({}).lean();

            const userBadges = await UserBadge.find({ userId }).lean();
            const userBadgeMap = new Map(
                userBadges.map(ub => [ub.badgeId.toString(), ub.earnedAt])
            );

            return allBadges.map(badge => ({
                badge,
                earned: userBadgeMap.has(badge._id.toString()),
                earnedAt: userBadgeMap.get(badge._id.toString())
            }));
        } catch (error) {
            throw error;
        }
    }

    async getUsersLeaderboard(): Promise<{ user: any; badgeCount: number; badges: any[] }[]> {
        try {
            const { User } = await import('../models/User');

            const users = await User.find({ role: 'client' }).lean();
            console.log('DEBUG - Users found:', users.length);

            const leaderboard = [];

            for (const user of users) {
                const userBadges = await this.getUserBadges(user._id.toString());
                console.log(`DEBUG - User ${user.username} has ${userBadges.length} badges`);

                leaderboard.push({
                    user: {
                        _id: user._id,
                        username: user.username,
                        firstName: user.firstName,
                        lastName: user.lastName
                    },
                    badgeCount: userBadges.length,
                    badges: userBadges
                });
            }

            console.log('DEBUG - Final leaderboard:', leaderboard.length, 'entries');

            return leaderboard.sort((a, b) => b.badgeCount - a.badgeCount);
        } catch (error) {
            console.error('Error in leaderboard:', error);
            throw error;
        }
    }
}

export default new BadgeService();