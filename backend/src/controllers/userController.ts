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
                search: req.query.search as string,
                requestingRole: req.user?.role
            };

            const result = await this.userService.getAllUsers(page, limit, filters);

            res.status(200).json({
                success: true,
                message: 'user retrieved successfully',
                data: result
            });
        } catch (error) {
            console.error('error while fetching the users:', error);
            res.status(500).json({
                success: false,
                message: 'internal error',
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
                message: 'user retrieved successfully',
                data: {user}
            });
        } catch (error) {
            const statusCode = (error as Error).message.includes('invalid') ||
            (error as Error).message.includes('not found') ? 404 : 500;

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
                    message: 'Auth required'
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
            const statusCode = (error as Error).message.includes('invalid') ||
            (error as Error).message.includes('not found') ? 404 :
                (error as Error).message.includes('impossible') ? 403 : 500;

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
            const statusCode = (error as Error).message.includes('invalid') ||
            (error as Error).message.includes('not found') ? 404 : 500;

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
                    message: 'you must be authenticated'
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
            const statusCode = (error as Error).message.includes('invalid') ||
            (error as Error).message.includes('not found') ? 404 :
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
                    message: 'you must be authenticated'
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
            const statusCode = (error as Error).message.includes('invalid') ||
            (error as Error).message.includes('not found') ? 404 :
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
                message: 'statistics retrieved successfully',
                data: {stats}
            });
        } catch (error) {
            console.error('statistics not fetched:', error);
            res.status(500).json({
                success: false,
                message: 'internal error',
                error: (error as Error).message
            });
        }
    }

    async createClient(req: Request, res: Response) {
        try {
            const user = await this.userService.createClient(req.body);
            res.status(201).json({ success: true, message: 'Client created', data: { user } });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    async createGymOwner(req: Request, res: Response) {
        try {
            const user = await this.userService.createGymOwner(req.body);
            res.status(201).json({ success: true, message: 'owner gym created', data: { user } });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    async createSuperAdmin(req: Request, res: Response) {
        try {
            const user = await this.userService.createSuperAdmin(req.body);
            res.status(201).json({ success: true, message: 'Admin created', data: { user } });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    async updateOwnProfile(req: Request, res: Response) {
        try {
            const updated = await this.userService.updateOwnProfile(req.user!._id.toString(), req.body);
            res.status(200).json({ success: true, message: 'update profile', data: { user: updated } });
        } catch (error) {
            res.status(400).json({ success: false, message: (error as Error).message });
        }
    }

    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.id;
            const adminId = req.user!._id.toString();
            const updates = req.body;

            const updatedUser = await this.userService.updateUserByAdmin(userId, updates, adminId);

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: { user: updatedUser }
            });
        } catch (error) {
            const statusCode = (error as Error).message.includes('invalid') ||
            (error as Error).message.includes('not found') ? 404 :
                (error as Error).message.includes('You cannot') ? 403 : 500;

            res.status(statusCode).json({
                success: false,
                message: (error as Error).message
            });
        }
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
        router.post('/create-client', requireSuperAdmin, this.createClient.bind(this));
        router.post('/create-gym-owner', requireSuperAdmin, this.createGymOwner.bind(this));
        router.post('/create-admin', requireSuperAdmin, this.createSuperAdmin.bind(this));
        router.put('/me', authenticateToken, this.updateOwnProfile.bind(this));
        router.put('/:id', requireSuperAdmin, this.updateUser.bind(this));


        return router;
    }
}