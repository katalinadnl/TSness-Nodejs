import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireSuperAdmin, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/stats', requireSuperAdmin, UserController.getUserStats);
router.delete('/:id/permanent', requireSuperAdmin, UserController.permanentDeleteUser);


router.get('/', requireSuperAdmin, UserController.getAllUsers);
router.get('/:id', requireSuperAdmin, UserController.getUserById);
router.put('/:id/deactivate', requireSuperAdmin, UserController.deactivateUser);
router.put('/:id/activate', requireSuperAdmin, UserController.activateUser);
router.delete('/:id', requireSuperAdmin, UserController.deleteUser);

export default router;
