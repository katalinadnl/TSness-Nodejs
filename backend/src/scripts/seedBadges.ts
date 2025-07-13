import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Badge } from '../models/Badge';

dotenv.config();

const sampleBadges = [
    {
        name: 'Débutant',
        description: 'Attribué après avoir complété votre premier défi.',
        iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/debutant.png',
        rule: 'completedChallenges >= 1'
    },
    {
        name: 'Intermédiaire',
        description: 'Attribué après avoir complété 5 défis.',
        iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/qualite.png',
        rule: 'completedChallenges >= 5'
    },
    {
        name: 'Avancé',
        description: 'Attribué après avoir complété 10 défis.',
        iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/badge.png',
        rule: 'completedChallenges >= 10'
    },
    {
        name: 'Champion',
        description: 'Attribué après 20 défis réussis.',
        iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/football.png',
        rule: 'completedChallenges >= 20'
    }
];

export const seedBadges = async () => {
    console.log('Seeding badges...');

    await Badge.deleteMany({});
    const createdBadges = await Badge.insertMany(sampleBadges);

    console.log(`${createdBadges.length} badges created`);
};
