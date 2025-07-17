import express from 'express';
import {
    createInvitation,
    getAllInvitations,
    getInvitationById,
    updateInvitation,
    deleteInvitation
} from '../controllers/invitationController';

const router = express.Router();

router.get('/', getAllInvitations as any);
router.get('/:id', getInvitationById as any);
router.post('/', createInvitation as any);
router.put('/:id', updateInvitation as any);
router.delete('/:id', deleteInvitation as any);

export default router;
