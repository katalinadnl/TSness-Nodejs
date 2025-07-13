import { Request, Response } from 'express';
import { Badge } from '../models/Badge';

export const getAllBadges = async (req: Request, res: Response) => {
    try {
        const badges = await Badge.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: badges });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching badges', error: (error as Error).message });
    }
};

export const getBadgeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const badge = await Badge.findById(id);
        if (!badge) {
            return res.status(404).json({ success: false, message: 'Badge not found' });
        }
        res.status(200).json({ success: true, data: badge });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching badge', error: (error as Error).message });
    }
};

export const createBadge = async (req: Request, res: Response) => {
    try {
        const badgeData = req.body;
        const badge = new Badge(badgeData);
        await badge.save();
        res.status(201).json({ success: true, message: 'Badge created successfully', data: badge });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error creating badge', error: (error as Error).message });
    }
};

export const updateBadge = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const badge = await Badge.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!badge) {
            return res.status(404).json({ success: false, message: 'Badge not found' });
        }
        res.status(200).json({ success: true, message: 'Badge updated successfully', data: badge });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error updating badge', error: (error as Error).message });
    }
};

export const deleteBadge = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const badge = await Badge.findByIdAndDelete(id);
        if (!badge) {
            return res.status(404).json({ success: false, message: 'Badge not found' });
        }
        res.status(200).json({ success: true, message: 'Badge deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting badge', error: (error as Error).message });
    }
};
