import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'App is working and we can start the developement' });
});

app.get('/users', (_req: Request, res: Response) => {
    res.send('ici ya des users');
});

app.post('/api/test-login', async (req: Request, res: Response): Promise<void> => {
    try {
        const fakeUserId = "60d5ecb74b2b1c001f8d4c51";

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({
                success: false,
                message: 'JWT_SECRET non configuré'
            });
            return;
        }

        const token = jwt.sign(
            { userId: fakeUserId },
            jwtSecret,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            message: "Token de test généré (valide 24h)",
            note: "Ceci est un token de test - L'utilisateur n'existe pas vraiment en base"
        });
    } catch (error) {
        console.error('Erreur génération token:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du token',
            error: (error as Error).message
        });
    }
});

app.get('/api/verify-token', (req: Request, res: Response): void => {
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
});

app.use('/api/users', userRoutes);

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
            console.log(`Documentation:`);
            console.log(`   - Home: http://localhost:${PORT}/`);
            console.log(`   - Test Login: POST http://localhost:${PORT}/api/test-login`);
            console.log(`   - Users API: http://localhost:${PORT}/api/users`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();