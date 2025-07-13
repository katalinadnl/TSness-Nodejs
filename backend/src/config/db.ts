import mongoose from 'mongoose';

export const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error('❌ MONGO_URI n\'est pas défini dans .env');
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', (error as Error).message);
        process.exit(1);
    }
};
