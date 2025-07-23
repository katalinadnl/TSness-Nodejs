import express, { Request, Response, Router } from 'express';
import { BadgeService } from '../services/badgeService';
import { authenticateToken } from '../middleware/auth';
import { Error } from 'mongoose';
import {requireRole} from "../middleware/requireRole";
import {UserRole} from "../models/common/enums";

export class BadgeController {
    constructor(private readonly badgeService: BadgeService) {}

    async getAllBadges(req: Request, res: Response): Promise<void> {
        try {
            const badges = await this.badgeService.getAllBadges();
            res.status(200).json({ success: true, message: 'All badges fetched successfully', data: badges });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Intern Error ! Check you code :)', error: (error as Error).message });
        }
    }

    async getBadgeById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const badge = await this.badgeService.getBadgeById(id);
            res.status(200).json({ success: true, message: 'The only badge fetched successully', data: badge });
        } catch (error) {
            const statusCode = (error as Error).message.includes('not found') || (error as Error).message.includes('invalid ID') ? 404 : 500;
            res.status(statusCode).json({ success: false, message: (error as Error).message });
        }
    }

    async createBadge(req: Request, res: Response): Promise<void> {
        try {
            const badge = await this.badgeService.createBadge(req.body);
            res.status(201).json({ success: true, message: 'Badge created', data: badge });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Creation error', error: (error as Error).message });
        }
    }

    async updateBadge(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const badge = await this.badgeService.updateBadge(id, req.body);
            res.status(200).json({ success: true, message: 'badge updated', data: badge });
        } catch (error) {
            const statusCode = (error as Error).message.includes('not found') || (error as Error).message.includes('invalid ID') ? 404 : 400;
            res.status(statusCode).json({ success: false, message: (error as Error).message });
        }
    }

    async deleteBadge(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await this.badgeService.deleteBadge(id);
            res.status(200).json({ success: true, message: 'Badge deleted' });
        } catch (error) {
            const statusCode = (error as Error).message.includes('not found') || (error as Error).message.includes('invalid ID') ? 404 : 500;
            res.status(statusCode).json({ success: false, message: (error as Error).message });
        }
    }

    async getUserBadges(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?._id || req.params.userId;
            if (!userId) {
                res.status(400).json({ success: false, message: 'user required' });
                return;
            }

            const badges = await this.badgeService.getUserBadges(userId);
            res.status(200).json({
                success: true,
                message: 'user badges retrieved successfully',
                data: badges
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving user badges',
                error: (error as Error).message
            });
        }
    }

    async getAllBadgesWithStatus(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?._id;
            if (!userId) {
                res.status(400).json({ success: false, message: 'user required' });
                return;
            }

            const badgesWithStatus = await this.badgeService.getAllBadgesWithStatus(userId);
            res.status(200).json({
                success: true,
                message: 'badges with status retrieved successfully',
                data: badgesWithStatus
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving badges with status',
                error: (error as Error).message
            });
        }
    }

    async evaluateUserBadges(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?._id?.toString();
            if (!userId) {
                res.status(400).json({ success: false, message: 'user required' });
                return;
            }

            const newBadges = await this.badgeService.evaluateAndAwardBadges(userId);
            res.status(200).json({
                success: true,
                message: `${newBadges.length} badges evaluated and awarded successfully`,
                data: newBadges
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error evaluating and awarding badges',
                error: (error as Error).message
            });
        }
    }

    async getLeaderboard(req: Request, res: Response): Promise<void> {
        try {
            const leaderboard = await this.badgeService.getUsersLeaderboard();
            res.status(200).json({
                success: true,
                message: 'Leaderboard retrieved successfully',
                data: leaderboard
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving leaderboard',
                error: (error as Error).message
            });
        }
    }

    buildRoutes(): Router {
        const router = express.Router();

        router.use((req, res, next) => {
            console.log('DEBUG - Badge route accessed:', req.method, req.path);
            next();
        });

        router.use(authenticateToken);

        router.get('/', this.getAllBadges.bind(this));
        router.get('/leaderboard', this.getLeaderboard.bind(this));
        router.get('/user/my-badges', this.getUserBadges.bind(this));
        router.get('/user/all-with-status', this.getAllBadgesWithStatus.bind(this));
        router.post('/user/evaluate', this.evaluateUserBadges.bind(this));
        router.get('/:id', this.getBadgeById.bind(this));
        router.post('/', requireRole([UserRole.SUPER_ADMIN]), this.createBadge.bind(this));
        router.put('/:id', requireRole([UserRole.SUPER_ADMIN]), this.updateBadge.bind(this));
        router.delete('/:id', requireRole([UserRole.SUPER_ADMIN]), this.deleteBadge.bind(this));

        return router;
    }
}
