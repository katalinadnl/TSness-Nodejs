import { Request, Response } from 'express';
import express from 'express';
import { ThemeService } from '../services/themeService';
import { authenticateToken } from '../middleware/auth';

export class ThemeController {
    private themeService: ThemeService;

    constructor() {
        this.themeService = new ThemeService();
    }

    /**
     * Récupère le thème de l'utilisateur connecté
     */
    async getUserTheme(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'user not authenticated'
                });
                return;
            }

            const themeInfo = await this.themeService.getUserThemeInfo(req.user._id.toString());

            res.status(200).json({
                success: true,
                message: 'theme retrieved successfully',
                data: themeInfo
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving theme',
                error: (error as Error).message
            });
        }
    }

    /**
     * Récupère le thème d'un utilisateur spécifique (pour les admins)
     */
    async getUserThemeById(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: 'userId is required'
                });
                return;
            }

            const themeInfo = await this.themeService.getUserThemeInfo(userId);

            res.status(200).json({
                success: true,
                message: 'theme retrieved successfully',
                data: themeInfo
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving theme for user',
                error: (error as Error).message
            });
        }
    }

    buildRoutes() {
        const router = express.Router();

        router.use(authenticateToken);

        router.get('/my-theme', this.getUserTheme.bind(this));
        
        router.get('/user/:userId', this.getUserThemeById.bind(this));

        return router;
    }
}