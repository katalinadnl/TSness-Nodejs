import express from 'express';
import {
  getAllExerciseTypes,
  getExerciseTypeById,
  createExerciseType,
  updateExerciseType,
  deleteExerciseType,
  getTrainingRoomsByExerciseType,
  getExerciseTypesByMuscle
} from '../controllers/exerciseTypeController';

const router = express.Router();

router.get('/by-muscle/:muscle', getExerciseTypesByMuscle as any);

router.get('/', getAllExerciseTypes as any);

router.get('/:id', getExerciseTypeById as any);

router.post('/', createExerciseType as any);

router.put('/:id', updateExerciseType as any);

router.delete('/:id', deleteExerciseType as any);

router.get('/:id/training-rooms', getTrainingRoomsByExerciseType as any);

export default router;
