import { Request, Response } from 'express';
import { Gym } from '../models/Gym';
import mongoose from 'mongoose';

export const createGym = async (req: Request, res: Response) => {
    try {
        const gym = new Gym(req.body);
        const savedGym = await gym.save();
        return res.status(201).json(savedGym);
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: 'Error creating gym', error });
    }
};

export const getAllGyms = async (_req: Request, res: Response) => {
    try {
        const gyms = await Gym.find();
        return res.status(200).json(gyms);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching gyms', error });
    }
};

export const getGymById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        const gym = await Gym.findById(id);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        return res.status(200).json(gym);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching gym', error });
    }
};

export const updateGym = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        const updatedGym = await Gym.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedGym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        return res.status(200).json(updatedGym);
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: 'Error updating gym', error });
    }
};

export const deleteGym = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        const deletedGym = await Gym.findByIdAndDelete(id);
        if (!deletedGym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        return res.status(200).json({ message: 'Gym deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error deleting gym', error });
    }
};
