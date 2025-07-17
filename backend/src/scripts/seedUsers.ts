import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Gym } from '../models/Gym';

export const seedUsers = async () => {
    console.log('Seeding users...');

    await User.deleteMany({});

    const gym = await Gym.findOne();
    if (!gym) throw new Error('No gym found! Please seed gyms first.');

    const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);
    const hashedGymOwnerPassword = await bcrypt.hash('gymowner123', 10);
    const hashedClientPassword = await bcrypt.hash('client123', 10);

    const superAdmin = await User.create({
        username: 'superadmin',
        email: 'superadmin@example.com',
        password: hashedSuperAdminPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true
    });

    const gymOwner = await User.create({
        username: 'gymowner',
        email: 'gymowner@example.com',
        password: hashedGymOwnerPassword,
        firstName: 'Gym',
        lastName: 'Owner',
        role: 'gym_owner',
        gymId: gym._id,
        isActive: true
    });

    const client = await User.create({
        username: 'clientuser',
        email: 'client@example.com',
        password: hashedClientPassword,
        firstName: 'Client',
        lastName: 'User',
        role: 'client',
        isActive: true
    });

    console.log('Users seeded:');
    console.log(`   - SuperAdmin: ${superAdmin.username} (${superAdmin.email})`);
    console.log(`   - GymOwner: ${gymOwner.username} (${gymOwner.email}) linked to Gym: ${gym.name}`);
    console.log(`   - Client: ${client.username} (${client.email})`);
};
