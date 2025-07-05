import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

dotenv.config();

async function getExistingAdmin() {
    await connectDB();

    try {
        const admin = await User.findOne({ role: 'super_admin' });

        if (!admin) {
            console.log('Aucun admin trouvé');
            process.exit(1);
        }

        console.log('Admin trouvé !');
        console.log('ID:', admin._id);
        console.log('Username:', admin.username);
        console.log('Email:', admin.email);

        const token = jwt.sign(
            { userId: admin._id },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        console.log('Token JWT avec l\'admin existant :');
        console.log(token);

    } catch (error) {
        console.log('Erreur :', error);
    }

    process.exit(0);
}

getExistingAdmin();