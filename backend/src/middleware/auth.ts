import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Types } from 'mongoose';

export type JwtUser = {
    _id: Types.ObjectId;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'client' | 'gym_owner' | 'super_admin';
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
};

declare global {
    namespace Express {
        interface Request {
            user?: JwtUser;
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
        const validRoles = ['client', 'gym_owner', 'super_admin'] as const;

        if (!validRoles.includes(decoded.role as any)) {
            res.status(403).json({
                success: false,
                message: 'Rôle utilisateur invalide'
            });
            return;
        }

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
            role: decoded.role as typeof validRoles[number]
        };

        next();

    } catch (error) {
        res.status(403).json({
            success: false,
            message: 'Token invalide'
        });
    }
};

export const requireOwner = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication requise'
        });
        return;
    }

    if (req.user.role !== 'gym_owner') {
        res.status(403).json({
            success: false,
            message: 'Accès réservé aux propriétaires de salle'
        });
        return;
    }

    next();
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