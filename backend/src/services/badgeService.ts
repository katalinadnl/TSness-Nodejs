import { Badge, IBadge } from '../models/Badge';
import { Types } from 'mongoose';

export class BadgeService {
    async getAllBadges(): Promise<IBadge[]> {
        return await Badge.find().sort({ createdAt: -1 });
    }

    async getBadgeById(id: string): Promise<IBadge> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID invalide');
        }

        const badge = await Badge.findById(id);
        if (!badge) {
            throw new Error('Badge non trouvé');
        }

        return badge;
    }

    async createBadge(data: any): Promise<IBadge> {
        const badge = new Badge(data);
        return await badge.save();
    }

    async updateBadge(id: string, data: any): Promise<IBadge> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID invalide');
        }

        const badge = await Badge.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });

        if (!badge) {
            throw new Error('Badge non trouvé');
        }

        return badge;
    }

    async deleteBadge(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID invalide');
        }

        const badge = await Badge.findByIdAndDelete(id);
        if (!badge) {
            throw new Error('Badge non trouvé');
        }
    }
}
