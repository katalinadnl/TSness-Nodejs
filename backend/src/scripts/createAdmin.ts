import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

async function createAdmin() {
    await connectDB();

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = new User({
        username: 'superadmin',
        email: 'admin@tsness.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true
    });

    try {
        const savedAdmin = await admin.save();
        console.log('Admin créé avec succès !');
        console.log('ID:', savedAdmin._id);

        const token = jwt.sign(
            { userId: savedAdmin._id },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        console.log('Token JWT de l\'utilisateur :');
        console.log(token);

    } catch (error) {
        console.log('Erreur :', error);
    }

    process.exit(0);
}

createAdmin();