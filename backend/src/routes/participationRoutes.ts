import express from 'express';
import {
    createParticipation,
    getAllParticipations,
    getParticipationById,
    updateParticipation,
    deleteParticipation
} from '../controllers/participationController';

const router = express.Router();

router.get('/', getAllParticipations as any);
router.get('/:id', getParticipationById as any);
router.post('/', createParticipation as any);
router.put('/:id', updateParticipation as any);
router.delete('/:id', deleteParticipation as any);

export default router;
