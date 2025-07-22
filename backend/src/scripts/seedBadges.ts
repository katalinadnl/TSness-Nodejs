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
        description: 'Attribué après avoir complété 3 défis.',
        iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/qualite.png',
        rule: 'completedChallenges >= 3'
    },
    {
        name: 'Avancé',
        description: 'Attribué après avoir complété 7 défis.',
        iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/badge.png',
        rule: 'completedChallenges >= 7'
    },
    {
        name: 'Champion',
        description: 'Attribué après 15 défis réussis.',
        iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/football.png',
        rule: 'completedChallenges >= 15'
    }
];

export const seedBadges = async () => {
    console.log('Seeding badges...');

    await Badge.deleteMany({});
    const createdBadges = await Badge.insertMany(sampleBadges);

    console.log(`${createdBadges.length} badges created`);
};
