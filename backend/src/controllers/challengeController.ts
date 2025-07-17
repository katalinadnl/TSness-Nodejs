import { Request, Response } from 'express';
import { Challenge } from '../models/Challenge';
import mongoose from 'mongoose';

export const createChallenge = async (req: Request, res: Response) => {
    try {
        const challenge = new Challenge(req.body);
        const saved = await challenge.save();
        res.status(201).json(saved);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating challenge', error });
    }
};

export const getAllChallenges = async (_req: Request, res: Response) => {
    try {
        const challenges = await Challenge.find()
            .populate('creatorId', 'username email')
            .populate('gymId', 'name')
            .populate('recommendedExerciseTypeIds', 'name');
        res.status(200).json(challenges);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching challenges', error });
    }
};

export const getChallengeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const challenge = await Challenge.findById(id)
            .populate('creatorId', 'username email')
            .populate('gymId', 'name')
            .populate('recommendedExerciseTypeIds', 'name');
        if (!challenge)
            return res.status(404).json({ message: 'Challenge not found' });

        res.status(200).json(challenge);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching challenge', error });
    }
};

export const updateChallenge = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const updated = await Challenge.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });
        if (!updated)
            return res.status(404).json({ message: 'Challenge not found' });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error updating challenge', error });
    }
};

export const deleteChallenge = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const deleted = await Challenge.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ message: 'Challenge not found' });

        res.status(200).json({ message: 'Challenge deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting challenge', error });
    }
};
