import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/common/enums';

export const requireRole = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'You cannot access this resource with your role : access denied'
            });
            return;
        }

        next();
    };
};
