import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export const seedUsers = async () => {
    console.log('Seeding users...');

    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await User.create({
        username: 'superadmin',
        email: 'superadmin@example.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true,
        isDeleted: false
    });

    console.log('Super admin created:');
    console.log(`   - Username: ${superAdmin.username}`);
    console.log(`   - Email: ${superAdmin.email}`);
};

