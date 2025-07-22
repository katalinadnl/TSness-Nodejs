import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { Participation } from '../models/Participation';
import { Challenge } from '../models/Challenge';
import { authenticateToken } from '../middleware/auth';
import { JwtUser } from '../middleware/auth';

export class ParticipationController {
    async getAll(req: Request, res: Response) {
        try {
            const user = req.user as JwtUser;
            if (user.role !== 'super_admin') {
                return res.status(403).json({ message: 'Accès refusé' });
            }

            const participations = await Participation.find()
                .populate('userId', 'username email')
                .populate('challengeId', 'title');

            res.status(200).json({ success: true, count: participations.length, data: participations });
        } catch (error) {
            res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

    async getMine(req: Request, res: Response) {
        try {
            const user = req.user as JwtUser;
            if (!user._id) return res.status(401).json({ message: 'Non authentifié' });

            const participations = await Participation.find({ userId: user._id })
                .populate('challengeId', 'title description duration');

            res.status(200).json({ success: true, count: participations.length, data: participations });
        } catch (error) {
            res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

    async deleteMine(req: Request, res: Response) {
        try {
            const user = req.user as JwtUser;
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id))
                return res.status(400).json({ message: 'ID invalide' });

            const participation = await Participation.findById(id);
            if (!participation)
                return res.status(404).json({ message: 'Participation non trouvée' });

            if (!participation.userId.equals(user._id)) {
                return res.status(403).json({ message: 'Vous ne pouvez pas supprimer cette participation' });
            }

            await Challenge.findByIdAndUpdate(participation.challengeId, {
                $pull: { participants: { userId: participation.userId } }
            });

            await Participation.findByIdAndDelete(id);

            res.status(200).json({ success: true, message: 'Participation supprimée' });
        } catch (error) {
            res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

    async getForGymOwner(req: Request, res: Response) {
        try {
            const user = req.user as JwtUser;
            if (user.role !== 'gym_owner') {
                return res.status(403).json({ message: 'Accès refusé' });
            }

            const challenges = await Challenge.find({ creatorId: user._id });
            const challengeIds = challenges.map(c => c._id);

            const participations = await Participation.find({ challengeId: { $in: challengeIds } })
                .populate('userId', 'username email')
                .populate('challengeId', 'title');

            res.status(200).json({ success: true, count: participations.length, data: participations });
        } catch (error) {
            res.status(500).json({ message: 'Erreur serveur', error });
        }
    }

    buildRoutes(): Router {
        const router = express.Router();

        router.use(authenticateToken);

        router.get('/', this.getAll.bind(this) as express.RequestHandler);
        router.get('/me', this.getMine.bind(this) as express.RequestHandler);
        router.delete('/:id', this.deleteMine.bind(this) as express.RequestHandler);
        router.get('/gym-owner/mine', this.getForGymOwner.bind(this) as express.RequestHandler);

        return router;
    }
}
