import express, { Request, Response, Router } from 'express';
import { BadgeService } from '../services/badgeService';
import badgeService from '../models/badgeService';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { Error } from 'mongoose';

export class BadgeController {
    constructor(private readonly badgeService: BadgeService) {}

    async getAllBadges(req: Request, res: Response): Promise<void> {
        try {
            const badges = await this.badgeService.getAllBadges();
            res.status(200).json({ success: true, message: 'Badges récupérés avec succès', data: badges });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erreur interne', error: (error as Error).message });
        }
    }

    async getBadgeById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const badge = await this.badgeService.getBadgeById(id);
            res.status(200).json({ success: true, message: 'Badge récupéré', data: badge });
        } catch (error) {
            const statusCode = (error as Error).message.includes('non trouvé') || (error as Error).message.includes('ID invalide') ? 404 : 500;
            res.status(statusCode).json({ success: false, message: (error as Error).message });
        }
    }

    async createBadge(req: Request, res: Response): Promise<void> {
        try {
            const badge = await this.badgeService.createBadge(req.body);
            res.status(201).json({ success: true, message: 'Badge créé avec succès', data: badge });
        } catch (error) {
            res.status(400).json({ success: false, message: 'Erreur lors de la création', error: (error as Error).message });
        }
    }

    async updateBadge(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const badge = await this.badgeService.updateBadge(id, req.body);
            res.status(200).json({ success: true, message: 'Badge mis à jour', data: badge });
        } catch (error) {
            const statusCode = (error as Error).message.includes('non trouvé') || (error as Error).message.includes('ID invalide') ? 404 : 400;
            res.status(statusCode).json({ success: false, message: (error as Error).message });
        }
    }

    async deleteBadge(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await this.badgeService.deleteBadge(id);
            res.status(200).json({ success: true, message: 'Badge supprimé avec succès' });
        } catch (error) {
            const statusCode = (error as Error).message.includes('non trouvé') || (error as Error).message.includes('ID invalide') ? 404 : 500;
            res.status(statusCode).json({ success: false, message: (error as Error).message });
        }
    }

    async getUserBadges(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?._id || req.params.userId;
            if (!userId) {
                res.status(400).json({ success: false, message: 'ID utilisateur requis' });
                return;
            }

            const badges = await badgeService.getUserBadges(userId);
            res.status(200).json({ 
                success: true, 
                message: 'Badges utilisateur récupérés', 
                data: badges 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la récupération des badges utilisateur', 
                error: (error as Error).message 
            });
        }
    }

    async getAllBadgesWithStatus(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?._id;
            if (!userId) {
                res.status(400).json({ success: false, message: 'ID utilisateur requis' });
                return;
            }

            const badgesWithStatus = await badgeService.getAllBadgesWithStatus(userId);
            res.status(200).json({ 
                success: true, 
                message: 'Badges avec statut récupérés', 
                data: badgesWithStatus 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la récupération des badges avec statut', 
                error: (error as Error).message 
            });
        }
    }

    async evaluateUserBadges(req: Request, res: Response): Promise<void> {
        try {
            console.log('DEBUG - req.user:', (req as any).user);
            const userId = (req as any).user?._id?.toString();
            console.log('DEBUG - userId extracted:', userId);
            if (!userId) {
                res.status(400).json({ success: false, message: 'ID utilisateur requis' });
                return;
            }

            const newBadges = await badgeService.evaluateAndAwardBadges(userId);
            res.status(200).json({ 
                success: true, 
                message: `${newBadges.length} nouveaux badges attribués`, 
                data: newBadges 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de l\'évaluation des badges', 
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
        router.get('/:id', this.getBadgeById.bind(this));
        router.post('/', requireSuperAdmin, this.createBadge.bind(this));
        router.put('/:id', requireSuperAdmin, this.updateBadge.bind(this));
        router.delete('/:id', requireSuperAdmin, this.deleteBadge.bind(this));

        router.get('/user/my-badges', this.getUserBadges.bind(this));
        router.get('/user/all-with-status', this.getAllBadgesWithStatus.bind(this));
        router.post('/user/evaluate', this.evaluateUserBadges.bind(this));

        return router;
    }
}
