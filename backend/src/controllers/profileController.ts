import { Request, Response, Router } from 'express';
import { User } from '../models/User';
import { UserBadge } from '../models/UserBadge';
import { ThemeService } from '../services/themeService';
import { authenticateToken } from '../middleware/auth';

export class ProfileController {
    private themeService: ThemeService;

    constructor() {
        this.themeService = new ThemeService();
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            
            if (!userId) {
                res.status(401).json({ message: 'Unauthenticated user' });
                return;
            }

            const user = await User.findById(userId).select('-password');
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            const userBadges = await UserBadge.find({ userId })
                .populate('badgeId')
                .sort({ earnedAt: -1 });

            const themeInfo = await this.themeService.getUserThemeInfo(userId.toString());

            const stats = {
                totalBadges: userBadges.length,
                score: user.score || 0,
                memberSince: user.createdAt
            };

            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    score: user.score || 0,
                    createdAt: user.createdAt
                },
                badges: userBadges,
                theme: themeInfo,
                stats
            });
        } catch (error) {
            console.error('Error retrieving profile:', error);
            res.status(500).json({ message: 'Server error while retrieving profile' });
        }
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?._id;
            const { firstName, lastName, username, email } = req.body;

            if (!firstName || !lastName || !username || !email) {
                res.status(400).json({ 
                    message: 'All fields are required',
                    fields: ['firstName', 'lastName', 'username', 'email']
                });
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({ message: 'Invalid email format' });
                return;
            }

            const existingUser = await User.findOne({
                $and: [
                    { _id: { $ne: userId } },
                    { $or: [{ username }, { email }] }
                ]
            });

            if (existingUser) {
                if (existingUser.username === username) {
                    res.status(400).json({ message: 'This username is already taken' });
                    return;
                }
                if (existingUser.email === email) {
                    res.status(400).json({ message: 'This email address is already in use' });
                    return;
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    username: username.trim(),
                    email: email.trim().toLowerCase()
                },
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedUser) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json({
                message: 'Profile successfully updated',
                user: {
                    id: updatedUser._id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    role: updatedUser.role,
                    score: updatedUser.score || 0,
                    createdAt: updatedUser.createdAt
                }
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            
            if ((error as any).name === 'ValidationError') {
                const messages = Object.values((error as any).errors).map((err: any) => err.message);
                res.status(400).json({ 
                    message: 'Validation error',
                    details: messages
                });
                return;
            }

            res.status(500).json({ message: 'Server error while updating profile' });
        }
    }

    buildRoutes() {
        const router = Router();
        
        router.use(authenticateToken);
        
        router.get('/', (req, res) => this.getProfile(req, res));
        router.put('/', (req, res) => this.updateProfile(req, res));
        
        return router;
    }
}