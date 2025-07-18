import { Gym } from '../models/Gym';

export const seedGyms = async () => {
    console.log('Seeding gyms...');

    await Gym.deleteMany({});

    const gyms = await Gym.insertMany([
        {
            name: 'Downtown Fitness Center',
            address: '123 Main Street, Cityville',
            contactEmail: 'contact@downtownfitness.com',
            contactPhone: '123-456-7890',
            description: 'Spacious gym with modern equipment and classes.',
            equipment: ['Treadmills', 'Free Weights', 'Squat Racks', 'Ellipticals'],
            activities: ['Yoga', 'HIIT', 'CrossFit', 'Bodybuilding'],
            isApproved: true
        },
        {
            name: 'Elite Gym Club',
            address: '456 High Street, Townsville',
            contactEmail: 'info@elitegymclub.com',
            contactPhone: '987-654-3210',
            description: 'Premium training facilities with personal coaching.',
            equipment: ['Rowing Machines', 'Kettlebells', 'Pull-up Bars'],
            activities: ['Strength Training', 'Pilates', 'Cardio Workouts'],
            isApproved: true
        }
    ]);

    console.log(`Seeded ${gyms.length} gyms`);
    return gyms;
};
