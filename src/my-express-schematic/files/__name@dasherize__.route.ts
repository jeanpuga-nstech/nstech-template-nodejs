import { Router } from 'express';
import __classify__Controller from '../controllers/__dasherize__.controller';

const router = Router();
const controller = new __classify__Controller();

// CRUD Routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;