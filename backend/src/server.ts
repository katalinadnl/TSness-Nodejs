import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {connectDB} from './config/db';
import gymRoutes from "./routes/gymRoutes";
import participationRoutes from './routes/participationRoutes';
import invitationRoutes from './routes/invitationRoutes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import {UserService} from "./services/userService";
import {UserController} from "./controllers/userController";
import {ExerciseTypeController} from "./controllers/exerciseTypeController";
import {TrainingRoomController} from "./controllers/trainingRoomController";
import {LoginController} from "./controllers/loginController";
import { BadgeController } from './controllers/badgeController';
import { BadgeService } from './services/badgeService';
import { ChallengeService } from './services/challengeService';
import { ChallengeController } from './controllers/challengeController';
import { ThemeController } from './controllers/themeController';


dotenv.config();

// init des dépendances (services)
const userService = new UserService();
const badgeService = new BadgeService();
const challengeService = new ChallengeService();

// conf express
const app = express();
app.use(cors());
app.use(express.json());

//init des controllers
const userController = new UserController(userService);
const exerciseTypeController = new ExerciseTypeController();
const trainingRoomController = new TrainingRoomController();
const loginController = new LoginController();
const badgeController = new BadgeController(badgeService);
const challengeController = new ChallengeController(challengeService);
const themeController = new ThemeController();

app.use('/api/challenges', challengeController.buildRoutes());

// init des routes
app.use('/api/users', userController.buildRoutes());
app.use('/api/login', loginController.buildRoutes());
app.use('/api/training-rooms', trainingRoomController.buildRoutes());
app.use('/api/exercise-types', exerciseTypeController.buildRoutes());
app.use('/api/badges', badgeController.buildRoutes());
app.use('/api/challenges', challengeController.buildRoutes());
app.use('/api/themes', themeController.buildRoutes());
app.use('/api/gyms', gymRoutes);
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