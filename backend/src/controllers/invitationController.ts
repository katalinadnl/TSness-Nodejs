import { Request, Response } from 'express';
import { Invitation } from '../models/Invitation';
import mongoose from 'mongoose';

export const createInvitation = async (req: Request, res: Response) => {
    try {
        const invitation = new Invitation(req.body);
        const saved = await invitation.save();
        res.status(201).json(saved);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating invitation', error });
    }
};

export const getAllInvitations = async (_req: Request, res: Response) => {
    try {
        const invitations = await Invitation.find()
            .populate('senderId', 'username email')
            .populate('receiverId', 'username email')
            .populate('challengeId', 'title');
        res.status(200).json(invitations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching invitations', error });
    }
};

export const getInvitationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const invitation = await Invitation.findById(id)
            .populate('senderId', 'username email')
            .populate('receiverId', 'username email')
            .populate('challengeId', 'title');
        if (!invitation)
            return res.status(404).json({ message: 'Invitation not found' });

        res.status(200).json(invitation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching invitation', error });
    }
};

export const updateInvitation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const updated = await Invitation.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });
        if (!updated)
            return res.status(404).json({ message: 'Invitation not found' });

        res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error updating invitation', error });
    }
};

export const deleteInvitation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ message: 'Invalid ID format' });

        const deleted = await Invitation.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ message: 'Invitation not found' });

        res.status(200).json({ message: 'Invitation deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting invitation', error });
    }
};
