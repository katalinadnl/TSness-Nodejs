import { Request, Response } from 'express';
import express from 'express';
import { ThemeService } from '../services/themeService';
import { authenticateToken } from '../middleware/auth';
import {requireRole} from "../middleware/requireRole";
import {UserRole} from "../models/common/enums";

export class ThemeController {
    private themeService: ThemeService;

    constructor() {
        this.themeService = new ThemeService();
    }

    async getUserTheme(req: Request, res: Response): Promise<void> {
        try {

            const themeInfo = await this.themeService.getUserThemeInfo(req.user!._id.toString());

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

    async getAllThemes(req: Request, res: Response): Promise<void> {
        try {
            const themes = await this.themeService.getAllThemes();

            res.status(200).json({
                success: true,
                message: 'Themes successfully retrieved',
                data: themes
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error retrieving themes',
                error: (error as Error).message
            });
        }
    }
    async createTheme(req: Request, res: Response): Promise<void> {
        try {
            const theme = await this.themeService.createTheme(req.body);

            res.status(201).json({
                success: true,
                message: 'Theme created successfully',
                data: theme
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error creating theme',
                error: (error as Error).message
            });
        }
    }

    async updateTheme(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const theme = await this.themeService.updateTheme(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Theme updated successfully',
                data: theme
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'error updating theme',
                error: (error as Error).message
            });
        }
    }

    async deleteTheme(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await this.themeService.deleteTheme(id);

            res.status(200).json({
                success: true,
                message: 'Theme removed successfully'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error deleting theme',
                error: (error as Error).message
            });
        }
    }

    async activateTheme(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const theme = await this.themeService.activateTheme(id);

            res.status(200).json({
                success: true,
                message: 'Theme activated successfully',
                data: theme
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error activating theme',
                error: (error as Error).message
            });
        }
    }
    async deactivateTheme(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const theme = await this.themeService.deactivateTheme(id);

            res.status(200).json({
                success: true,
                message: 'Theme disabled successfully',
                data: theme
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error deactivating theme',
                error: (error as Error).message
            });
        }
    }

    buildRoutes() {
        const router = express.Router();

        router.use(authenticateToken);

        router.get('/my-theme', this.getUserTheme.bind(this));
        router.get('/all', this.getAllThemes.bind(this));
        router.get('/user/:userId', this.getUserThemeById.bind(this));
        router.post('/', requireRole([UserRole.SUPER_ADMIN]), this.createTheme.bind(this));
        router.put('/:id', requireRole([UserRole.SUPER_ADMIN]), this.updateTheme.bind(this));
        router.delete('/:id', requireRole([UserRole.SUPER_ADMIN]), this.deleteTheme.bind(this));
        router.put('/:id/activate', requireRole([UserRole.SUPER_ADMIN]), this.activateTheme.bind(this));
        router.put('/:id/deactivate', requireRole([UserRole.SUPER_ADMIN]), this.deactivateTheme.bind(this));

        return router;
    }
}