import express from 'express';
import {
  getAllTrainingRooms,
  getTrainingRoomById,
  createTrainingRoom,
  updateTrainingRoom,
  deleteTrainingRoom,
  approveTrainingRoom,
  assignExerciseType,
  setDifficultyLevel
} from '../controllers/trainingRoomController';

const router = express.Router();

router.get('/', getAllTrainingRooms as any);

router.get('/:id', getTrainingRoomById as any);

router.post('/', createTrainingRoom as any);

router.put('/:id', updateTrainingRoom as any);

router.delete('/:id', deleteTrainingRoom as any);

router.patch('/:id/approve', approveTrainingRoom as any);

router.patch('/:id/assign-exercise-type', assignExerciseType as any);

router.patch('/:id/set-difficulty', setDifficultyLevel as any);

export default router;
