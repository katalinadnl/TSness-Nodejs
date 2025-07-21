import { Challenge } from '../models/Challenge';
import { UserBadge } from '../models/UserBadge';
import { User } from '../models/User';
import { Badge } from '../models/Badge';

export const seedChallengesAndBadges = async () => {
    console.log('Seeding challenges and user badges...');

    const clients = await User.find({ role: 'client' });
    const badges = await Badge.find({});

    if (clients.length === 0) {
        console.log('Aucun client trouvé pour les badges');
        return;
    }

    await Challenge.deleteMany({});
    await UserBadge.deleteMany({});

    for (const client of clients) {
        let numChallenges = 1;
        
        if (client.username === 'clientuser2') {
            numChallenges = 5;
        } else if (client.username === 'marie_durant') {
            numChallenges = 10;
        } else if (client.username === 'clientuser') {
            numChallenges = 1;
        }
        
        console.log(`Création de ${numChallenges} défis pour ${client.username}`);

        for (let j = 0; j < numChallenges; j++) {
            const challenge = new Challenge({
                title: `Défi ${j + 1} - ${client.firstName}`,
                description: `Défi d'entraînement n°${j + 1}`,
                creatorId: client._id,
                duration: 30 + (j * 10),
                difficultyLevel: ['beginner', 'intermediate', 'advanced'][j % 3],
                goals: `Objectif du défi ${j + 1}`,
                participants: [{
                    userId: client._id,
                    status: 'completed',
                    progress: 100,
                    caloriesBurned: 200 + (j * 50)
                }]
            });
            
            await challenge.save();
        }

        const earnedBadges = [];
        
        for (const badge of badges) {
            const rule = badge.rule;
            const match = rule.match(/completedChallenges >= (\d+)/);
            
            if (match) {
                const requiredChallenges = parseInt(match[1]);
                if (numChallenges >= requiredChallenges) {
                    earnedBadges.push(badge);
                }
            }
        }

        for (const badge of earnedBadges) {
            const userBadge = new UserBadge({
                userId: client._id.toString(),
                badgeId: badge._id,
                earnedAt: new Date()
            });
            
            await userBadge.save();
            console.log(`Badge "${badge.name}" attribué à ${client.username}`);
        }
    }

    console.log('Challenges et badges seedés avec succès!');
    
    const summary = await Promise.all(clients.map(async (client) => {
        const challengeCount = await Challenge.countDocuments({ 
            'participants.userId': client._id,
            'participants.status': 'completed' 
        });
        const badgeCount = await UserBadge.countDocuments({ userId: client._id.toString() });
        return `   - ${client.username}: ${challengeCount} défis, ${badgeCount} badges`;
    }));
    
    console.log('Résumé:');
    summary.forEach(line => console.log(line));
};