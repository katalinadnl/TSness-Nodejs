import express, {Request, Response} from "express";
import {User} from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export class LoginController {

    async signin(req: Request, res: Response): Promise<void> {
        try {
            const username = req.body.username;
            const admin = await User.findOne({username: username}).select('_id username email role password isActive isDeleted');

            if (!admin) {
                res.status(404).json({
                    success: false,
                    message: 'Aucun utilisateur trouvé en base'
                });
                return;
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                res.status(500).json({
                    success: false,
                    message: 'JWT_SECRET non configuré'
                });
                return;
            }

            const password = req.body.password;
            const adminPassword = admin.password;
            const result = bcrypt.compareSync(password, adminPassword);

            if (!result) {
                res.status(401).json({
                    success: false,
                    message: 'Mot de passe incorrect'
                });
                return;
            }

            const token = jwt.sign(
                {userId: admin._id},
                jwtSecret,
                {expiresIn: '24h'}
            );

            res.json({
                success: true,
                token: token,
                message: "Token généré",
                admin: {
                    id: admin._id,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role
                }
            });
        } catch (error) {
            console.error('Erreur génération token:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la génération du token',
                error: (error as Error).message
            });
        }
    }

    verifyToken(req: Request, res: Response): void {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token manquant'
            });
            return;
        }

        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                res.status(500).json({
                    success: false,
                    message: 'JWT_SECRET non configuré'
                });
                return;
            }

            const decoded = jwt.verify(token, jwtSecret);
            res.json({
                success: true,
                message: 'Token valide',
                decoded: decoded
            });
        } catch (error) {
            res.status(403).json({
                success: false,
                message: 'Token invalide',
                error: (error as Error).message
            });
        }
    }

    buildRoutes() {
        const router = express.Router();

        router.post('/signin', this.signin.bind(this));
        router.get('/verify-token', this.verifyToken.bind(this));

        return router;
    }

}