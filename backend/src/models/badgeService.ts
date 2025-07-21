import { Badge, IBadge } from './Badge';
import { UserBadge, IUserBadge } from './UserBadge';
import { ChallengeService } from '../services/challengeService';

const challengeService = new ChallengeService();

interface UserStats {
    completedChallenges: number;
    totalCaloriesBurned: number;
    activeChallenges: number;
    averageProgress: number;
}

class BadgeService {
    /**
     * Évalue si un utilisateur mérite un badge selon sa règle
     */
    private evaluateRule(rule: string, userStats: UserStats): boolean {
        try {
            const ruleRegex = /(\w+)\s*(>=|<=|>|<|==)\s*(\d+)/;
            const match = rule.match(ruleRegex);
            
            if (!match) {
                console.warn(`Règle de badge invalide: ${rule}`);
                return false;
            }

            const [, statName, operator, valueStr] = match;
            const value = parseInt(valueStr, 10);
            const userValue = userStats[statName as keyof UserStats];

            if (userValue === undefined) {
                console.warn(`Statistique utilisateur inconnue: ${statName}`);
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
            console.error('Erreur lors de l\'évaluation de la règle:', error);
            return false;
        }
    }

    /**
     * Récupère les statistiques d'un utilisateur
     */
    private async getUserStats(userId: string): Promise<UserStats> {
        return await challengeService.getUserStats(userId);
    }

    /**
     * Évalue et attribue automatiquement les badges pour un utilisateur
     */
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
                        console.log(`Badge "${badge.name}" attribué à l'utilisateur ${userId}`);
                    } catch (saveError: any) {
                        if (saveError.code !== 11000) {
                            console.error('Erreur lors de l\'attribution du badge:', saveError);
                        }
                    }
                }
            }

            return newBadges;
        } catch (error) {
            console.error('Erreur lors de l\'évaluation des badges:', error);
            throw error;
        }
    }

    /**
     * Récupère tous les badges d'un utilisateur
     */
    async getUserBadges(userId: string): Promise<IUserBadge[]> {
        try {
            const userBadges = await UserBadge.find({ userId })
                .populate('badgeId')
                .sort({ earnedAt: -1 })
                .lean();
            
            return userBadges;
        } catch (error) {
            console.error('Erreur lors de la récupération des badges utilisateur:', error);
            throw error;
        }
    }

    /**
     * Récupère tous les badges disponibles avec leur statut pour un utilisateur
     */
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
            console.error('Erreur lors de la récupération des badges avec statut:', error);
            throw error;
        }
    }
}

export default new BadgeService();