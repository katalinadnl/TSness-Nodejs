import { User, IUser} from '../models/User';
import mongoose, {Error} from 'mongoose';
import bcrypt from "bcryptjs";
import {UserRole} from "../models/common/enums";

export class UserService {

    async getAllUsers(
        page = 1,
        limit = 10,
        requestingRole: UserRole,
        filters?: any
    ) {
        const skip = (page - 1) * limit;
        const query: any = {};

        if (requestingRole === UserRole.SUPER_ADMIN && filters?.role) {
            query.role = filters.role;
        } else if (requestingRole !== UserRole.SUPER_ADMIN) {
            query.role = UserRole.CLIENT;
        }

        if (requestingRole === UserRole.SUPER_ADMIN && filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        if (filters?.search) {
            query.$or = [
                { username: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } },
                { firstName: { $regex: filters.search, $options: 'i' } },
                { lastName: { $regex: filters.search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
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

    async getUserById(userId: string, requestingRole: UserRole) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('invalid user ID');
        }

        const user = await User.findById(userId)
            .select('-password')

        if (!user) {
            throw new Error('User not found');
        }

        if (requestingRole !== UserRole.SUPER_ADMIN && user.role !== UserRole.CLIENT) {
            throw new Error('Access denied');
        }

        return user;
    }

    async deactivateUser(userId: string, adminId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('invalid user ID');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.role === UserRole.SUPER_ADMIN) {
            throw new Error('Is not possible to deactivate a super admin');
        }

        if (user._id.toString() === adminId) {
            throw new Error('You cannot deactivate yourself');
        }

        user.isActive = false;
        await user.save();

        return {
            message: 'User deactivated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isActive: user.isActive
            }
        };
    }

    async activateUser(userId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('invalid user ID');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.isActive = true;
        await user.save();

        return {
            message: 'User activated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isActive: user.isActive
            }
        };
    }

    async deleteUser(userId: string, adminId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('invalid user ID');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.role === UserRole.SUPER_ADMIN) {
            throw new Error('Is not possible to delete a super admin');
        }

        if (user._id.toString() === adminId) {
            throw new Error('Is not possible to delete yourself');
        }

        user.isDeleted = true;
        user.isActive = false;
        user.deletedAt = new Date();
        await user.save();

        return {
            message: 'User deleted successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isDeleted: user.isDeleted,
                deletedAt: user.deletedAt
            }
        };
    }

    async permanentDeleteUser(userId: string, adminId: string) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('invalid user ID');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.role === UserRole.SUPER_ADMIN) {
            throw new Error('Is not possible to permanently delete a super admin');
        }

        if (user._id.toString() === adminId) {
            throw new Error('You cannot permanently delete yourself');
        }

        await User.findByIdAndDelete(userId);

        return {
            message: 'User permanently deleted',
            userId: userId
        };
    }

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
                        $sum: {$cond: [{$eq: ['$role', UserRole.CLIENT]}, 1, 0]}
                    },
                    gymOwners: {
                        $sum: {$cond: [{$eq: ['$role', UserRole.GYM_OWNER]}, 1, 0]}
                    },
                    superAdmins: {
                        $sum: {$cond: [{$eq: ['$role', UserRole.SUPER_ADMIN]}, 1, 0]}
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

    async createClient(data: any): Promise<IUser> {
        return this.createUserWithRole(data, UserRole.CLIENT);
    }

    async createGymOwner(data: any): Promise<IUser> {
        return this.createUserWithRole(data, UserRole.GYM_OWNER);
    }

    async createSuperAdmin(data: any): Promise<IUser> {
        return this.createUserWithRole(data, UserRole.SUPER_ADMIN);
    }

    private async createUserWithRole(data: any, role: string): Promise<IUser> {
        const existingUser = await User.findOne({
            $or: [{ email: data.email }, { username: data.username }]
        });
        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }

        const hashedPassword = bcrypt.hashSync(data.password, 10);
        const user = new User({
            ...data,
            password: hashedPassword,
            role,
            isActive: true,
            isDeleted: false
        });

        return user.save();
    }

    async updateOwnProfile(userId: string, updates: Partial<IUser>) {
        const user = await User.findById(userId);
        if (!user) throw new Error('user not found');

        const allowedFields = ['firstName', 'lastName', 'email', 'username', 'password'];

        for (const field of allowedFields) {
            if ((updates as any)[field] !== undefined) {
                if (field === 'password') {
                    user.password = bcrypt.hashSync((updates as any)[field], 10);
                } else {
                    (user as any)[field] = (updates as any)[field];
                }
            }
        }

        await user.save();
        return user;
    }

    async updateUserByAdmin(userId: string, updates: Partial<IUser>, adminId: string): Promise<IUser> {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('invalid user ID');
        }

        if (userId === adminId) {
            throw new Error('You cannot update your own profile from here');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('user not found');
        }

        const allowedFields = ['username', 'email', 'firstName', 'lastName', 'role', 'isActive'];

        for (const key of allowedFields) {
            if ((updates as any)[key] !== undefined) {
                (user as any)[key] = (updates as any)[key];
            }
        }

        if (updates.password) {
            user.password = bcrypt.hashSync(updates.password, 10);
        }

        await user.save();
        return user;
    }


}