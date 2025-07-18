import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token d\'accès requis'
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                message: 'Erreur de configuration du serveur'
            });
            return;
        }

        const decoded = jwt.verify(token, jwtSecret) as { userId: string; role: string };
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
            return;
        }

        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Compte désactivé'
            });
            return;
        }

        req.user = {
            ...user.toObject(),
            role: decoded.role
        };

        next();

    } catch (error) {
        res.status(403).json({
            success: false,
            message: 'Token invalide'
        });
    }
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication requise'
        });
        return;
    }

    if (req.user.role !== 'super_admin') {
        res.status(403).json({
            success: false,
            message: 'Accès réservé aux super administrateurs'
        });
        return;
    }

    next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication requise'
        });
        return;
    }

    if (!['super_admin', 'gym_owner'].includes(req.user.role)) {
        res.status(403).json({
            success: false,
            message: 'Accès réservé aux administrateurs'
        });
        return;
    }

    next();
};

export const requireRoles = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication requise'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
            return;
        }

        next();
    };
};