import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/db';
import userRoutes from './routes/userRoutes';
import { User } from './models/User';
import trainingRoomRoutes from './routes/trainingRoomRoutes';
import exerciseTypeRoutes from './routes/exerciseTypeRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'API Fitness - Gestion des salles d\'entraînement et types d\'exercices',
        version: '1.0.0',
        endpoints: {
            trainingRooms: '/api/training-rooms',
            exerciseTypes: '/api/exercise-types'
        }
    });
});

app.use('/api/training-rooms', trainingRoomRoutes);
app.use('/api/exercise-types', exerciseTypeRoutes);

app.get('/users', (_req: Request, res: Response) => {
    res.send('ici ya des users');
});

app.post('/api/test-login', async (req: Request, res: Response): Promise<void> => {
    try {
        const admin = await User.findOne({ role: 'super_admin' }).select('_id username email role');

        if (!admin) {
            res.status(404).json({
                success: false,
                message: 'Aucun super admin trouvé en base'
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

        const token = jwt.sign(
            { userId: admin._id },
            jwtSecret,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            message: "Token généré avec le vrai super admin",
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

app.use(notFoundHandler);
app.use(errorHandler);

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