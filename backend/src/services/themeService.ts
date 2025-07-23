import { BadgeService } from './badgeService';
import { Theme, ITheme } from '../models/Theme';
import { Types } from 'mongoose';

export type UserTheme = 'default' | 'debutant' | 'intermediaire' | 'avance' | 'champion' | string;

export class ThemeService {
    private badgeService: BadgeService;

    constructor() {
        this.badgeService = new BadgeService();
    }

    async getUserTheme(userId: string): Promise<UserTheme> {
        try {
            const userBadges = await this.badgeService.getUserBadges(userId);
            console.log(`[DEBUG] User badges ${userId}:`, userBadges.map(ub => ({
                badgeName: ub.badge?.name,
                themeId: ub.badge?.themeId
            })));

            if (userBadges.length === 0) {
                console.log(`[DEBUG] No badge for the user ${userId}, return to default theme`);
                return 'default';
            }

            const associatedThemes = [];
            for (const userBadge of userBadges) {
                if (userBadge.badge?.themeId) {
                    try {
                        const theme = await this.getThemeById(userBadge.badge.themeId.toString());
                        if (theme && theme.isActive) {
                            associatedThemes.push(theme);
                        } else if (theme && !theme.isActive) {
                            console.log(`Theme ${theme.name} (${theme.slug}) disabled for badge ${userBadge.badge.name}, switch to default theme`);
                        }
                    } catch (err) {
                        console.warn(`Theme ${userBadge.badge.themeId} not found for badge ${userBadge.badge.name}`);
                    }
                }
            }

            if (associatedThemes.length > 0) {
                const themeHierarchy = ['champion', 'avance', 'intermediaire', 'debutant'];
                
                for (const level of themeHierarchy) {
                    const matchingTheme = associatedThemes.find(theme => 
                        theme.slug.toLowerCase().includes(level)
                    );
                    if (matchingTheme) {
                        console.log(`[DEBUG] Theme selected for the user ${userId}: ${matchingTheme.name} (${matchingTheme.slug})`);
                        return matchingTheme.slug as UserTheme;
                    }
                }

                const latestTheme = associatedThemes.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )[0];

                console.log(`[DEBUG] No theme in hierarchy, use most recent: ${latestTheme.name} (${latestTheme.slug})`);
                return latestTheme.slug as UserTheme;
            }

            console.log(`[DEBUG] No custom theme active, revert to default theme`);
            return 'default';
        } catch (error) {
            console.error('error in retrieving the user theme:', error);
            return 'default';
        }
    }

    async getUserThemeInfo(userId: string) {
        const themeIdentifier = await this.getUserTheme(userId);

        const predefinedThemes = ['default', 'debutant', 'intermediaire', 'avance', 'champion'];

        if (!predefinedThemes.includes(themeIdentifier)) {
            try {
                const customTheme = await Theme.findOne({ slug: themeIdentifier, isActive: true });
                if (customTheme) {
                    return {
                        theme: themeIdentifier,
                        name: customTheme.name,
                        description: customTheme.description,
                        colors: customTheme.colors
                    };
                }
            } catch (error) {
                console.error('Error while retrieving custom theme:', error);
            }
        }
        
        const themeInfos = {
            default: {
                name: 'Thème par défaut',
                description: 'Thème standard de TSness',
                colors: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    accent: '#06b6d4',
                    background: '#ffffff',
                    backgroundSoft: '#f8fafc',
                    text: '#1e293b',
                    textMuted: '#64748b'
                }
            },
            debutant: {
                name: 'Thème Débutant',
                description: 'Thème violet pour les nouveaux aventuriers',
                colors: {
                    primary: '#8b5cf6',
                    secondary: '#a855f7',
                    accent: '#c084fc',
                    background: '#1a1625',
                    backgroundSoft: '#2d1b3d',
                    text: '#e2e8f0',
                    textMuted: '#a855f7'
                }
            },
            intermediaire: {
                name: 'Thème Intermédiaire',
                description: 'Thème bleu pour les progressants',
                colors: {
                    primary: '#3b82f6',
                    secondary: '#06b6d4',
                    accent: '#0ea5e9',
                    background: '#0f172a',
                    backgroundSoft: '#1e293b',
                    text: '#e2e8f0',
                    textMuted: '#64748b'
                }
            },
            avance: {
                name: 'Thème Avancé',
                description: 'Thème orange pour les experts',
                colors: {
                    primary: '#f97316',
                    secondary: '#ea580c',
                    accent: '#fb923c',
                    background: '#1c1410',
                    backgroundSoft: '#2d1b0e',
                    text: '#fef3e2',
                    textMuted: '#fdba74'
                }
            },
            champion: {
                name: 'Thème Champion',
                description: 'Thème doré pour les légendes',
                colors: {
                    primary: '#eab308',
                    secondary: '#f59e0b',
                    accent: '#fbbf24',
                    background: '#1c1a0d',
                    backgroundSoft: '#2d2411',
                    text: '#fefce8',
                    textMuted: '#fde047'
                }
            }
        };

        return {
            theme: themeIdentifier,
            ...themeInfos[themeIdentifier as keyof typeof themeInfos] || themeInfos.default
        };
    }

    async getAllThemes(): Promise<ITheme[]> {
        return await Theme.find().sort({ createdAt: -1 });
    }

    async createTheme(data: any): Promise<ITheme> {
        const slug = data.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const themeData = {
            ...data,
            slug: slug
        };

        const theme = new Theme(themeData);
        return await theme.save();
    }

    async getThemeById(id: string): Promise<ITheme> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID invalide');
        }

        const theme = await Theme.findById(id);
        if (!theme) {
            throw new Error('Theme not found');
        }

        return theme;
    }

    async updateTheme(id: string, data: any): Promise<ITheme> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID invalide');
        }

        if (data.name) {
            data.slug = data.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        }

        const theme = await Theme.findByIdAndUpdate(id, data, { new: true });
        if (!theme) {
            throw new Error('Thème non trouvé');
        }

        return theme;
    }

    async deleteTheme(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID invalide');
        }

        const theme = await Theme.findByIdAndDelete(id);
        if (!theme) {
            throw new Error('Theme not found');
        }
    }

    async activateTheme(id: string): Promise<ITheme> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID invalide');
        }

        const theme = await Theme.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true }
        );

        if (!theme) {
            throw new Error('Theme not found');
        }

        return theme;
    }

    async deactivateTheme(id: string): Promise<ITheme> {
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('ID invalide');
        }

        const theme = await Theme.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!theme) {
            throw new Error('Theme not found');
        }

        return theme;
    }
}