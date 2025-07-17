import {User} from '../models/User';
import mongoose, {Error} from 'mongoose';
import bcrypt from "bcryptjs";

export class UserService {

// Récupérer tous les utilisateurs (avec pagination)
    async getAllUsers(page: number = 1, limit: number = 10, filters?: any) {
        const skip = (page - 1) * limit;

        const query: any = {};

        // Filtres optionnels
        if (filters?.role) {
            query.role = filters.role;
        }
        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        if (filters?.search) {
            query.$or = [
                {username: {$regex: filters.search, $options: 'i'}},
                {email: {$regex: filters.search, $options: 'i'}},
                {firstName: {$regex: filters.search, $options: 'i'}},
                {lastName: {$regex: filters.search, $options: 'i'}}
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .populate('gymId', 'name address')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        return {
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    }

    // Récupérer un utilisateur par ID
    async getUserById(userId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('ID utilisateur invalide');
        }

        const user = await User.findById(userId)
            .select('-password')
            .populate('gymId', 'name address');

        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        return user;
    }

    // Désactiver un utilisateur
    async deactivateUser(userId: string, adminId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('ID utilisateur invalide');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        if (user.role === 'super_admin') {
            throw new Error('Impossible de désactiver un super administrateur');
        }

        if (user._id.toString() === adminId) {
            throw new Error('Vous ne pouvez pas vous désactiver vous-même');
        }

        user.isActive = false;
        await user.save();

        return {
            message: 'Utilisateur désactivé avec succès',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isActive: user.isActive
            }
        };
    }

    // Réactiver un utilisateur
    async activateUser(userId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('ID utilisateur invalide');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        user.isActive = true;
        await user.save();

        return {
            message: 'Utilisateur réactivé avec succès',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isActive: user.isActive
            }
        };
    }

    // Supprimer un utilisateur (soft delete)
    async deleteUser(userId: string, adminId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('ID utilisateur invalide');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        if (user.role === 'super_admin') {
            throw new Error('Impossible de supprimer un super administrateur');
        }

        if (user._id.toString() === adminId) {
            throw new Error('Vous ne pouvez pas vous supprimer vous-même');
        }

        user.isDeleted = true;
        user.isActive = false;
        user.deletedAt = new Date();
        await user.save();

        return {
            message: 'Utilisateur supprimé avec succès',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isDeleted: user.isDeleted,
                deletedAt: user.deletedAt
            }
        };
    }

    // Supprimer définitivement un utilisateur (hard delete)
    async permanentDeleteUser(userId: string, adminId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('ID utilisateur invalide');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        if (user.role === 'super_admin') {
            throw new Error('Impossible de supprimer définitivement un super administrateur');
        }

        if (user._id.toString() === adminId) {
            throw new Error('Vous ne pouvez pas vous supprimer vous-même');
        }

        await User.findByIdAndDelete(userId);

        return {
            message: 'Utilisateur supprimé définitivement',
            userId: userId
        };
    }

    // Obtenir les statistiques des utilisateurs
    async getUserStats() {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: {$sum: 1},
                    activeUsers: {
                        $sum: {$cond: [{$eq: ['$isActive', true]}, 1, 0]}
                    },
                    inactiveUsers: {
                        $sum: {$cond: [{$eq: ['$isActive', false]}, 1, 0]}
                    },
                    clients: {
                        $sum: {$cond: [{$eq: ['$role', 'client']}, 1, 0]}
                    },
                    gymOwners: {
                        $sum: {$cond: [{$eq: ['$role', 'gym_owner']}, 1, 0]}
                    },
                    superAdmins: {
                        $sum: {$cond: [{$eq: ['$role', 'super_admin']}, 1, 0]}
                    }
                }
            }
        ]);

        return stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            inactiveUsers: 0,
            clients: 0,
            gymOwners: 0,
            superAdmins: 0
        };
    }

    async createUser(username: string, email: string, password: string, firstname: string, lastname: string) {
        const existingUser = await User.findOne({
            $or: [
                {email: email},
                {username: username}
            ]
        });
        if (existingUser) {
            throw new Error('Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà');
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const user = new User({
            username: username,
            email: email,
            password: hashedPassword,
            firstName: firstname,
            lastName: lastname,
            role: 'client',
            isActive: true,
            isDeleted: false
        });

        return await user.save();
    }

}