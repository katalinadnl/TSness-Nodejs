import { Request, Response } from 'express';
import { Participation } from '../models/Participation';
import mongoose from 'mongoose';

export const createParticipation = async (req: Request, res: Response) => {
    try {
        const participation = new Participation(req.body);
        const saved = await participation.save();
        res.status(201).json(saved);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating participation', error });
    }
};

export const getAllParticipations = async (_req: Request, res: Response) => {
    try {
        const participations = await Participation.find()
            .populate('userId', 'username email')
            .populate('challengeId', 'title');
        res.status(200).json(participations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching participations', error });
    }
};

export const getParticipationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const participation = await Participation.findById(id)
            .populate('userId', 'username email')
            .populate('challengeId', 'title');
        if (!participation)
            return res.status(404).json({ message: 'Participation not found' });

        res.status(200).json(participation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching participation', error });
    }
};

export const updateParticipation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const updated = await Participation.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });
        if (!updated)
            return res.status(404).json({ message: 'Participation not found' });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error updating participation', error });
    }
};

export const deleteParticipation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const deleted = await Participation.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ message: 'Participation not found' });

        res.status(200).json({ message: 'Participation deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting participation', error });
    }
};
