import express, {Request, Response, Router} from 'express';
import {UserService} from '../services/userService';
import {Error} from "mongoose";
import {authenticateToken, requireSuperAdmin} from "../middleware/auth";

export class UserController {

    constructor(readonly userService: UserService) {
        this.userService = userService;
    }

    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const filters = {
                role: req.query.role as string,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                search: req.query.search as string
            };

            const result = await this.userService.getAllUsers(page, limit, filters);

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

    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const {id} = req.params;
            const user = await this.userService.getUserById(id);

            res.status(200).json({
                success: true,
                message: 'Utilisateur récupéré avec succès',
                data: {user}
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

    async deactivateUser(req: Request, res: Response): Promise<void> {
        try {
            const {id} = req.params;
            const adminId = req.user?._id.toString();

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication requise'
                });
                return;
            }

            const result = await this.userService.deactivateUser(id, adminId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: {user: result.user}
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

    async activateUser(req: Request, res: Response): Promise<void> {
        try {
            const {id} = req.params;
            const result = await this.userService.activateUser(id);

            res.status(200).json({
                success: true,
                message: result.message,
                data: {user: result.user}
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

    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const {id} = req.params;
            const adminId = req.user?._id.toString();

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication requise'
                });
                return;
            }

            const result = await this.userService.deleteUser(id, adminId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: {user: result.user}
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

    async permanentDeleteUser(req: Request, res: Response): Promise<void> {
        try {
            const {id} = req.params;
            const adminId = req.user?._id.toString();

            if (!adminId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication requise'
                });
                return;
            }

            const result = await this.userService.permanentDeleteUser(id, adminId);

            res.status(200).json({
                success: true,
                message: result.message,
                data: {userId: result.userId}
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

    async getUserStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await this.userService.getUserStats();

            res.status(200).json({
                success: true,
                message: 'Statistiques récupérées avec succès',
                data: {stats}
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

    async createUser(req: Request, res: Response): Promise<void> {

        const user = {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
        };
        console.log('Creating user with data:', user);

        const createdUser = await this.userService.createUser(
            user.username,
            user.email,
            user.password,
            user.firstname,
            user.lastname
        );

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: {
                user: {
                    id: createdUser._id,
                    username: createdUser.username,
                    email: createdUser.email,
                    firstName: createdUser.firstName,
                    lastName: createdUser.lastName,
                    role: createdUser.role,
                    isActive: createdUser.isActive
                }
            }
        });

    }


    buildRoutes() {
        const router = express.Router();

        router.use(authenticateToken);

        router.get('/stats', requireSuperAdmin, this.getUserStats.bind(this));
        router.delete('/:id/permanent', requireSuperAdmin, this.permanentDeleteUser.bind(this));
        router.get('/', requireSuperAdmin, this.getAllUsers.bind(this));
        router.get('/:id', requireSuperAdmin, this.getUserById.bind(this));
        router.put('/:id/deactivate', requireSuperAdmin, this.deactivateUser.bind(this));
        router.put('/:id/activate', requireSuperAdmin, this.activateUser.bind(this));
        router.delete('/:id', requireSuperAdmin, this.deleteUser.bind(this));
        router.post('/', requireSuperAdmin, this.createUser.bind(this));

        return router;
    }
}