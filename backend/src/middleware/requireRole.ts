import { Request, Response, NextFunction } from 'express';

export const requireRole = (roles: ('client' | 'gym_owner' | 'super_admin')[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Accès interdit à ce rôle blabla' });
            return;
        }

        next();
    };
};
