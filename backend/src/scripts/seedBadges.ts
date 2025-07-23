import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Badge } from '../models/Badge';
import { Theme } from '../models/Theme';

dotenv.config();

export const seedBadges = async () => {
    console.log('Seeding badges...');

    await Badge.deleteMany({});

    const themeDebutant = await Theme.findOne({ slug: 'theme-debutant' });
    const themeIntermediaire = await Theme.findOne({ slug: 'theme-intermediaire' });  
    const themeAvance = await Theme.findOne({ slug: 'theme-avance' });
    const themeChampion = await Theme.findOne({ slug: 'theme-champion' });

    console.log('Thèmes trouvés:');
    console.log('- Débutant:', themeDebutant?.name, '(slug:', themeDebutant?.slug, ')');
    console.log('- Intermédiaire:', themeIntermediaire?.name, '(slug:', themeIntermediaire?.slug, ')');
    console.log('- Avancé:', themeAvance?.name, '(slug:', themeAvance?.slug, ')');
    console.log('- Champion:', themeChampion?.name, '(slug:', themeChampion?.slug, ')');

    const sampleBadges = [
        {
            name: 'Débutant',
            description: 'Attribué après avoir complété votre premier défi.',
            iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/debutant.png',
            rule: 'completedChallenges >= 1',
            themeId: themeDebutant?._id || null
        },
        {
            name: 'Intermédiaire',
            description: 'Attribué après avoir complété 3 défis.',
            iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/qualite.png',
            rule: 'completedChallenges >= 3',
            themeId: themeIntermediaire?._id || null
        },
        {
            name: 'Avancé',
            description: 'Attribué après avoir complété 7 défis.',
            iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/badge.png',
            rule: 'completedChallenges >= 7',
            themeId: themeAvance?._id || null
        },
        {
            name: 'Champion',
            description: 'Attribué après 15 défis réussis.',
            iconUrl: 'https://raw.githubusercontent.com/katalinadnl/TSness-Nodejs/refs/heads/feat/badges/backend/assets/icons/football.png',
            rule: 'completedChallenges >= 15',
            themeId: themeChampion?._id || null
        }
    ];

    const createdBadges = await Badge.insertMany(sampleBadges);

    console.log(`${createdBadges.length} badges created with theme associations:`);
    createdBadges.forEach(badge => {
        console.log(`- ${badge.name}: ${badge.themeId ? 'Associé au thème' : 'Aucun thème'}`);
    });
};
