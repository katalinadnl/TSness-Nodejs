import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { Challenge } from '../models/Challenge';
import { ChallengeAndParticipationStatus } from '../models/common/enums';


class ChallengeSocialController {
    /**
     * Inviter un utilisateur à un défi
     */
    inviteToChallenge: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { challengeId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json({ message: 'userId manquant dans le body.' });
                return;
            }

            if (!mongoose.Types.ObjectId.isValid(challengeId) || !mongoose.Types.ObjectId.isValid(userId)) {
                res.status(400).json({ message: 'ID invalide.' });
                return;
            }

            const challenge = await Challenge.findById(challengeId);
            if (!challenge) {
                res.status(404).json({ message: 'Défi non trouvé.' });
                return;
            }

            if (challenge.participants.some((p) => p.userId.equals(userId))) {
                res.status(400).json({ message: 'Utilisateur déjà invité ou participant.' });
                return;
            }

            challenge.participants.push({
                userId,
                status: ChallengeAndParticipationStatus.INVITED,
                progress: 0,
                caloriesBurned: 0
            });

            await challenge.save();
            res.status(200).json({ message: 'Invitation envoyée.' });
        } catch (err) {
            res.status(500).json({ message: 'Erreur serveur', error: err });
        }
    };

    /**
     * Accepter une invitation à un défi
     */
    acceptChallengeInvitation: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { challengeId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json({ message: 'userId manquant dans le body.' });
                return;
            }

            if (!mongoose.Types.ObjectId.isValid(challengeId) || !mongoose.Types.ObjectId.isValid(userId)) {
                res.status(400).json({ message: 'ID invalide.' });
                return;
            }

            const challenge = await Challenge.findById(challengeId);
            if (!challenge) {
                res.status(404).json({ message: 'Défi non trouvé.' });
                return;
            }

            const participant = challenge.participants.find((p) => p.userId.equals(userId));
            if (!participant) {
                res.status(404).json({ message: 'Invitation non trouvée.' });
                return;
            }

            if (participant.status !== ChallengeAndParticipationStatus.INVITED) {
                res.status(400).json({ message: 'Invitation déjà acceptée ou terminée.' });
                return;
            }

            participant.status = ChallengeAndParticipationStatus.ACCEPTED;

            await challenge.save();
            res.status(200).json({ message: 'Invitation acceptée.' });
        } catch (err) {
            res.status(500).json({ message: 'Erreur serveur', error: err });
        }
    };

    /**
     * Refuser une invitation à un défi
     */
    refuseChallengeInvitation: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { challengeId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json({ message: 'userId manquant dans le body.' });
                return;
            }

            if (!mongoose.Types.ObjectId.isValid(challengeId) || !mongoose.Types.ObjectId.isValid(userId)) {
                res.status(400).json({ message: 'ID invalide.' });
                return;
            }

            const challenge = await Challenge.findById(challengeId);
            if (!challenge) {
                res.status(404).json({ message: 'Défi non trouvé.' });
                return;
            }

            const participant = challenge.participants.find((p) => p.userId.equals(userId));
            if (!participant) {
                res.status(404).json({ message: 'Invitation non trouvée.' });
                return;
            }

            if (participant.status !== ChallengeAndParticipationStatus.INVITED) {
                res.status(400).json({ message: 'Invitation déjà traitée.' });
                return;
            }

            challenge.participants = challenge.participants.filter((p) => !p.userId.equals(userId));

            await challenge.save();
            res.status(200).json({ message: 'Invitation refusée.' });
        } catch (err) {
            res.status(500).json({ message: 'Erreur serveur', error: err });
        }
    };

    /**
     * Lister les invitations reçues pour un utilisateur
     */
    getUserInvitations: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                res.status(400).json({ message: 'ID utilisateur invalide.' });
                return;
            }

            const challenges = await Challenge.find({
                participants: {
                    $elemMatch: {
                        userId: new mongoose.Types.ObjectId(userId),
                        status: ChallengeAndParticipationStatus.INVITED
                    }
                }
            });

            res.status(200).json(challenges);
        } catch (err) {
            res.status(500).json({ message: 'Erreur serveur', error: err });
        }
    };

    buildRoutes() {
        const router = express.Router();
        router.post('/:challengeId/invite', this.inviteToChallenge.bind(this));
        router.post('/:challengeId/accept', this.acceptChallengeInvitation.bind(this));
        router.post('/:challengeId/refuse', this.refuseChallengeInvitation.bind(this));
        router.get('/invitations/:userId', this.getUserInvitations.bind(this));
        return router;
    }
}

export { ChallengeSocialController };

