import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {connectDB} from './config/db';
import trainingRoomRoutes from './routes/trainingRoomRoutes';
import exerciseTypeRoutes from './routes/exerciseTypeRoutes';
import badgeRoutes from './routes/badgeRoutes';
import gymRoutes from "./routes/gymRoutes";
import challengeRoutes from './routes/challengeRoutes';
import participationRoutes from './routes/participationRoutes';
import invitationRoutes from './routes/invitationRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import {errorHandler, notFoundHandler} from './middleware/errorHandler';
import loginRoutes from "./routes/loginRoutes";
import {UserService} from "./services/userService";
import {UserController} from "./controllers/userController";

dotenv.config();

// init des dépendances (services)
const userService = new UserService();

// conf express
const app = express();
app.use(cors());
app.use(express.json());

//init des controllers
const userController = new UserController(userService);

// init des routes
app.use('/api/users', userController.buildRoutes());
app.use('/api/training-rooms', trainingRoomRoutes);
app.use('/api/exercise-types', exerciseTypeRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/invitations', invitationRoutes);

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


app.get('/users', (_req: Request, res: Response) => {
    res.send('ici ya des users');
});

// init des middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
            console.log(`Documentation:`);
            console.log(`   - Home: http://localhost:${PORT}/`);
            console.log(`   - Test Login: POST http://localhost:${PORT}/api/login/test-login`);
            console.log(`   - Users API: http://localhost:${PORT}/api/users`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();