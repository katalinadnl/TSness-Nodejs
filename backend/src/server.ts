import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
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

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}

startServer().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});

