import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';

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

