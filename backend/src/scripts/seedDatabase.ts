import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ExerciseType } from '../models/ExerciseType';
import { TrainingRoom } from '../models/TrainingRoom';
import { DifficultyLevel } from '../types';

dotenv.config();

const sampleExerciseTypes = [
  {
    name: 'Musculation Haut du Corps',
    description: 'Exercices ciblant le développement des muscles du haut du corps',
    targetedMuscles: ['pectoraux', 'biceps', 'triceps', 'épaules', 'dos']
  },
  {
    name: 'Cardio Training',
    description: 'Exercices cardiovasculaires pour améliorer l\'endurance',
    targetedMuscles: ['cœur', 'jambes', 'core']
  },
  {
    name: 'Musculation Jambes',
    description: 'Exercices de renforcement pour les membres inférieurs',
    targetedMuscles: ['quadriceps', 'ischio-jambiers', 'mollets', 'fessiers']
  },
  {
    name: 'Yoga & Stretching',
    description: 'Exercices de flexibilité et relaxation',
    targetedMuscles: ['tout le corps', 'core', 'dos']
  },
  {
    name: 'CrossFit',
    description: 'Entraînement fonctionnel haute intensité',
    targetedMuscles: ['tout le corps', 'core', 'jambes', 'bras']
  }
];

const sampleTrainingRooms: any[] = [
  {
    name: 'Salle de Musculation Pro',
    capacity: 25,
    equipment: ['bancs de musculation', 'haltères', 'barres', 'machines guidées'],
    features: ['climatisation', 'miroirs', 'sol renforcé', 'musique'],
    isApproved: true,
    difficultyLevel: DifficultyLevel.ADVANCED,
    createdBy: 'Admin',
    assignedExerciseTypeId: null
  },
  {
    name: 'Studio Cardio',
    capacity: 20,
    equipment: ['tapis de course', 'vélos elliptiques', 'rameurs'],
    features: ['climatisation', 'écrans TV', 'sol amortissant'],
    isApproved: true,
    difficultyLevel: DifficultyLevel.BEGINNER,
    createdBy: 'Manager Fitness',
    assignedExerciseTypeId: null
  },
  {
    name: 'Salle CrossFit',
    capacity: 15,
    equipment: ['kettlebells', 'cordes', 'pneus', 'barres olympiques'],
    features: ['sol renforcé', 'hauteur sous plafond', 'ventilation'],
    isApproved: false,
    difficultyLevel: DifficultyLevel.ADVANCED,
    createdBy: 'Coach CrossFit',
    assignedExerciseTypeId: null
  },
  {
    name: 'Studio Yoga',
    capacity: 12,
    equipment: ['tapis de yoga', 'blocs', 'sangles', 'coussins'],
    features: ['éclairage tamisé', 'sol chauffant', 'musique douce'],
    isApproved: true,
    difficultyLevel: DifficultyLevel.BEGINNER,
    createdBy: 'Instructeur Yoga',
    assignedExerciseTypeId: null
  }
];

export const seedDatabase = async () => {
  try {
    console.log('🌱 Début du seeding de la base de données...');

    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ Connexion à MongoDB établie');

    await ExerciseType.deleteMany({});
    await TrainingRoom.deleteMany({});
    console.log('🧹 Collections nettoyées');

    const createdExerciseTypes = await ExerciseType.insertMany(sampleExerciseTypes);
    console.log(`✅ ${createdExerciseTypes.length} types d'exercices créés`);

    sampleTrainingRooms[0].assignedExerciseTypeId = createdExerciseTypes[0]._id as any;
    sampleTrainingRooms[1].assignedExerciseTypeId = createdExerciseTypes[1]._id as any;
    sampleTrainingRooms[2].assignedExerciseTypeId = createdExerciseTypes[4]._id as any;
    sampleTrainingRooms[3].assignedExerciseTypeId = createdExerciseTypes[3]._id as any;

    const createdRooms = await TrainingRoom.insertMany(sampleTrainingRooms);
    console.log(`✅ ${createdRooms.length} salles d'entraînement créées`);

    console.log('🎉 Seeding terminé avec succès !');
    console.log('\n📊 Résumé :');
    console.log(`- Types d'exercices : ${createdExerciseTypes.length}`);
    console.log(`- Salles d'entraînement : ${createdRooms.length}`);
    console.log(`- Salles approuvées : ${createdRooms.filter(room => room.isApproved).length}`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding :', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion fermée');
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
