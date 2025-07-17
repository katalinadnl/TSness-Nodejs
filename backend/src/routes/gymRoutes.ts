import express from 'express';
import {
    createGym,
    getAllGyms,
    getGymById,
    updateGym,
    deleteGym
} from '../controllers/gymController';

const router = express.Router();

router.post('/', createGym as any);
router.get('/', getAllGyms as any);
router.get('/:id', getGymById as any);
router.put('/:id', updateGym as any);
router.delete('/:id', deleteGym as any);

export default router;
