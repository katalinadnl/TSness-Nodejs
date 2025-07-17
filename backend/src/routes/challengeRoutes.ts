import express from 'express';
import {
    createChallenge,
    getAllChallenges,
    getChallengeById,
    updateChallenge,
    deleteChallenge
} from '../controllers/challengeController';

const router = express.Router();

router.get('/', getAllChallenges as any);
router.get('/:id', getChallengeById as any);
router.post('/', createChallenge as any);
router.put('/:id', updateChallenge as any);
router.delete('/:id', deleteChallenge as any);

export default router;
