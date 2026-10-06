import express from 'express';
import {
  getWarranties,
  getWarrantyStats,
  getWarrantyById,
  createWarranty,
  updateWarranty,
  deleteWarranty
} from '../controllers/warrantyController.js';
import { warrantyUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/stats', getWarrantyStats);

router.route('/')
  .get(getWarranties)
  .post(warrantyUpload, createWarranty);

router.route('/:id')
  .get(getWarrantyById)
  .put(warrantyUpload, updateWarranty)
  .delete(deleteWarranty);

export default router;
