import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { UserRole} from "../models/common/enums";
import { Types } from 'mongoose';

export type JwtUser = {
    _id: Types.ObjectId;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
};

declare module 'express' {
    interface Request {
        user?: JwtUser;
    }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'the token is required'
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                message: 'Error of server: JWT'
            });
            return;
        }

        const decoded = jwt.verify(token, jwtSecret) as { userId: string; role: string };
        const validRoles = Object.values(UserRole);

        if (!validRoles.includes(decoded.role as UserRole)) {
            res.status(403).json({
                success: false,
                message: 'User role is not valid'
            });
            return;
        }

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'User is not active, the account is disabled'
            });
            return;
        }

        req.user = {
            ...user.toObject(),
            role: decoded.role as UserRole
        };

        next();

    } catch (error) {
        res.status(403).json({
            success: false,
            message: 'invalid token',
        });
    }
};
