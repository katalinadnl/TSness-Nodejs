import { BadgeService } from '../services/badgeService';

export type UserTheme = 'default' | 'debutant' | 'intermediaire' | 'avance' | 'champion';

export class ThemeService {
    private badgeService: BadgeService;

    constructor() {
        this.badgeService = new BadgeService();
    }

    /**
     * Détermine le thème d'un utilisateur basé sur ses badges
     */
    async getUserTheme(userId: string): Promise<UserTheme> {
        try {
            const userBadges = await this.badgeService.getUserBadges(userId);
            
            if (userBadges.length === 0) {
                return 'default';
            }

            const badgeNames = userBadges.map(userBadge => userBadge.badge?.name?.toLowerCase());
            
            if (badgeNames.includes('champion')) {
                return 'champion';
            } else if (badgeNames.includes('avancé')) {
                return 'avance';
            } else if (badgeNames.includes('intermédiaire')) {
                return 'intermediaire';
            } else if (badgeNames.includes('débutant')) {
                return 'debutant';
            }

            return 'default';
        } catch (error) {
            console.error('Erreur lors de la récupération du thème utilisateur:', error);
            return 'default';
        }
    }

    /**
     * Récupère les informations de thème pour un utilisateur
     */
    async getUserThemeInfo(userId: string) {
        const theme = await this.getUserTheme(userId);
        
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
            theme,
            ...themeInfos[theme]
        };
    }
}