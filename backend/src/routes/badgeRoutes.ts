import express from 'express';
import {
    getAllBadges,
    getBadgeById,
    createBadge,
    updateBadge,
    deleteBadge
} from '../controllers/badgeController';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/', getAllBadges as any);
router.get('/:id', getBadgeById as any);
router.post('/', createBadge as any);
router.put('/:id', updateBadge as any);
router.delete('/:id', deleteBadge as any);

export default router;
