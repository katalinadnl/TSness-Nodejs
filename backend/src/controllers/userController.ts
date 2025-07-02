import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {

    static async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const filters = {
                role: req.query.role as string,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                search: req.query.search as string
            };

            const result = await UserService.getAllUsers(page, limit, filters);

            res.status(200).json({
                success: true,
                message: 'Utilisateurs récupérés avec succès',
                data: result
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                error: (error as Error).message
            });
        }
    }

    static async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = await UserService.getUserById(id);

            res.status(200).json({
                success: true,
                message: 'Utilisateur récupéré avec succès',
                data: { user }
            });
        } catch (error) {
            const statusCode = (error as Error).message.includes('invalide') ||
            (error as Error).message.includes('non trouvé') ? 404 : 500;

            res.status(statusCode).json({
                success: false,
                message: (error as Error).message
            });
        }
    }

    static async deactivateUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const adminId = req.user?._id.toString();

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication requise'
                });
                return;
            }

            const result = await UserService.deactivateUser(id, adminId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: { user: result.user }
            });
        } catch (error) {
            const statusCode = (error as Error).message.includes('invalide') ||
            (error as Error).message.includes('non trouvé') ? 404 :
                (error as Error).message.includes('Impossible') ? 403 : 500;

            res.status(statusCode).json({
                success: false,
                message: (error as Error).message
            });
        }
    }

    static async activateUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const result = await UserService.activateUser(id);

            res.status(200).json({
                success: true,
                message: result.message,
                data: { user: result.user }
            });
        } catch (error) {
            const statusCode = (error as Error).message.includes('invalide') ||
            (error as Error).message.includes('non trouvé') ? 404 : 500;

            res.status(statusCode).json({
                success: false,
                message: (error as Error).message
            });
        }
    }

    static async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const adminId = req.user?._id.toString();

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication requise'
                });
                return;
            }

            const result = await UserService.deleteUser(id, adminId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: { user: result.user }
            });
        } catch (error) {
            const statusCode = (error as Error).message.includes('invalide') ||
            (error as Error).message.includes('non trouvé') ? 404 :
                (error as Error).message.includes('Impossible') ? 403 : 500;

            res.status(statusCode).json({
                success: false,
                message: (error as Error).message
            });
        }
    }

    static async permanentDeleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const adminId = req.user?._id.toString();

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication requise'
                });
                return;
            }

            const result = await UserService.permanentDeleteUser(id, adminId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: { userId: result.userId }
            });
        } catch (error) {
            const statusCode = (error as Error).message.includes('invalide') ||
            (error as Error).message.includes('non trouvé') ? 404 :
                (error as Error).message.includes('Impossible') ? 403 : 500;

            res.status(statusCode).json({
                success: false,
                message: (error as Error).message
            });
        }
    }

    static async getUserStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await UserService.getUserStats();

            res.status(200).json({
                success: true,
                message: 'Statistiques récupérées avec succès',
                data: { stats }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                error: (error as Error).message
            });
        }
    }
}