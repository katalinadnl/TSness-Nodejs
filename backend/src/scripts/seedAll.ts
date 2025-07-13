import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedUsers } from './seedUsers';
import { seedBadges } from './seedBadges';
import { seedExercisesAndRooms } from './seedExerciseAndRooms';

dotenv.config();

(async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI is not defined in .env');

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected');

        await seedUsers();
        await seedBadges();
        await seedExercisesAndRooms();

        console.log('All seeding completed!');
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit(0);
    }
})();
