import express, { Request, Response, Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { Gym } from '../models/Gym';
import { User } from '../models/User';
import { TrainingRoom } from '../models/TrainingRoom';
import mongoose from 'mongoose';

export class GymController {
    async getAllGyms(req: Request, res: Response): Promise<void> {
        try {
            const userRole = req.user?.role;
            const userId = req.user?._id;

            let gyms;

            if (userRole === 'super_admin') {
                gyms = await Gym.find();
            } else if (userRole === 'gym_owner') {
                gyms = await Gym.find({ ownerId: userId });
            } else {
                res.status(403).json({ success: false, message: 'You have not the right to be here' });
                return;
            }

            res.status(200).json({ success: true, message: 'Gym fetched successfully', data: gyms });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal error', error: (error as Error).message });
        }
    }


    async getGymById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userRole = req.user?.role;
            const userId = req.user?._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                res.status(400).json({ success: false, message: 'invalid ID' });
                return;
            }

            const gym = await Gym.findById(id);
            if (!gym) {
                res.status(404).json({ success: false, message: 'Gym not found' });
                return;
            }

            if (userRole === 'gym_owner') {
                if (!userId || gym.ownerId.toString() !== userId.toString()) {
                    res.status(403).json({ success: false, message: 'access not authorized at this gym ' });
                    return;
                }
            }

            res.status(200).json({ success: true, message: 'Gyms fetched successfully', data: gym });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal error', error: (error as Error).message });
        }
    }

    async createGym(req: Request, res: Response): Promise<void> {
        try {
            const { ownerId } = req.body;

            if (!mongoose.Types.ObjectId.isValid(ownerId)) {
                res.status(400).json({ success: false, message: 'ownerId invalid' });
                return;
            }

            const owner = await User.findOne({ _id: ownerId, role: 'gym_owner' });
            if (!owner) {
                res.status(400).json({ success: false, message: 'Owner of this gym is not found or doesn\'t exist' });
                return;
            }

            const gym = new Gym(req.body);
            const saved = await gym.save();
            res.status(201).json({ success: true, message: 'Gym created', data: saved });
        } catch (error) {
            res.status(400).json({ success: false, message: 'error while creating the gym', error: (error as Error).message });
        }
    }

    async updateGym(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { ownerId } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                res.status(400).json({ success: false, message: 'invalid id' });
                return;
            }

            if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
                const owner = await User.findOne({ _id: ownerId, role: 'gym_owner' });
                if (!owner) {
                    res.status(400).json({ success: false, message: 'owner not found or incorrect role' });
                    return;
                }
            }

            const updated = await Gym.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
            if (!updated) {
                res.status(404).json({ success: false, message: 'gym not found' });
                return;
            }

            res.status(200).json({ success: true, message: 'gym updated', data: updated });
        } catch (error) {
            res.status(400).json({ success: false, message: 'error while updating the gym', error: (error as Error).message });
        }
    }


    async deleteGym(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                res.status(400).json({ success: false, message: 'invalid id' });
                return;
            }
            const deleted = await Gym.findByIdAndDelete(id);
            if (!deleted) {
                res.status(404).json({ success: false, message: 'gym not found' });
                return;
            }
            res.status(200).json({ success: true, message: 'gym deleted ! all gooooood !' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal error', error: (error as Error).message });
        }
    }

    async getGymsWithRooms(req: Request, res: Response): Promise<void> {
        try {
            const userRole = req.user?.role;
            const userId = req.user?._id;

            let gyms;
            if (userRole === 'super_admin') {
                gyms = await Gym.find();
            } else if (userRole === 'gym_owner') {
                gyms = await Gym.find({ ownerId: userId });
            } else {
                res.status(403).json({ success: false, message: 'Access not authorized' });
                return;
            }

            const fullGyms = await Promise.all(
                gyms.map(async (gym) => {
                    const rooms = await TrainingRoom.find({ gymId: gym._id }).populate('assignedExerciseTypeId');
                    return { ...gym.toObject(), trainingRooms: rooms };
                })
            );

            res.status(200).json({ success: true, message: 'gyms with details fetched', data: fullGyms });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal error', error: (error as Error).message });
        }
    }


    async getGymWithRoomsById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userRole = req.user?.role;
            const userId = req.user?._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                res.status(400).json({ success: false, message: 'invalid ID' });
                return;
            }

            const gym = await Gym.findById(id);
            if (!gym) {
                res.status(404).json({ success: false, message: 'gym not found' });
                return;
            }

            if (userRole === 'gym_owner') {
                if (!userId || gym.ownerId.toString() !== userId.toString()) {
                    res.status(403).json({ success: false, message: 'not authorized' });
                    return;
                }
            }

            const rooms = await TrainingRoom.find({ gymId: id }).populate('assignedExerciseTypeId');
            res.status(200).json({ success: true, message: 'gym with details ok', data: { ...gym.toObject(), trainingRooms: rooms } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'internal error', error: (error as Error).message });
        }
    }

    buildRoutes(): Router {
        const router = express.Router();

        router.use(authenticateToken);

        router.get('/', this.getAllGyms.bind(this));
        router.get('/full', this.getGymsWithRooms.bind(this));
        router.get('/:id', this.getGymById.bind(this));
        router.get('/:id/full', this.getGymWithRoomsById.bind(this));
        router.post('/', requireSuperAdmin, this.createGym.bind(this));
        router.put('/:id', requireSuperAdmin, this.updateGym.bind(this));
        router.delete('/:id', requireSuperAdmin, this.deleteGym.bind(this));

        return router;
    }
}
