import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { Theme } from '../models/Theme';

dotenv.config();

const seedThemes = async () => {
  try {
    await connectDB();
    await Theme.deleteMany({});

    const themes = [
      {
        name: 'Thème Sombre',
        description: 'Un thème sombre et élégant pour une expérience moderne',
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          background: '#1a1a1a',
          backgroundSoft: '#2d2d2d',
          text: '#ffffff',
          textMuted: '#a0a0a0'
        },
        isActive: true
      },
      {
        name: 'Thème Nature',
        description: 'Des couleurs vertes inspirées de la nature',
        colors: {
          primary: '#22c55e',
          secondary: '#16a34a',
          accent: '#84cc16',
          background: '#f0fdf4',
          backgroundSoft: '#dcfce7',
          text: '#166534',
          textMuted: '#16a34a'
        },
        isActive: true
      },
      {
        name: 'Thème Coucher de Soleil',
        description: 'Des tons chauds orange et rouge',
        colors: {
          primary: '#f97316',
          secondary: '#ea580c',
          accent: '#fb923c',
          background: '#fff7ed',
          backgroundSoft: '#fed7aa',
          text: '#9a3412',
          textMuted: '#ea580c'
        },
        isActive: false
      },
      {
        name: 'Thème Océan',
        description: 'Des bleus profonds comme l\'océan',
        colors: {
          primary: '#0ea5e9',
          secondary: '#0284c7',
          accent: '#38bdf8',
          background: '#f0f9ff',
          backgroundSoft: '#e0f2fe',
          text: '#0c4a6e',
          textMuted: '#0284c7'
        },
        isActive: true
      }
    ];

    for (const themeData of themes) {
      // Générer le slug
      const slug = themeData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[^a-z0-9\\s-]/g, "")
        .replace(/\\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const theme = new Theme({
        ...themeData,
        slug: slug
      });
      
      await theme.save();
    }

    console.log('Thèmes créés avec succès!');
    console.log(`${themes.length} thèmes ajoutés`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création des thèmes:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedThemes();
}

export default seedThemes;