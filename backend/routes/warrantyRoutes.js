import express from 'express';
import {
  getWarranties,
  getWarrantyStats,
  getWarrantyById,
  createWarranty,
  updateWarranty,
  deleteWarranty,
  getInvoiceFile,
  getInvoiceUrl
} from '../controllers/warrantyController.js';
import { warrantyUpload } from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for all warranty endpoints
router.use(protect);

router.get('/stats', getWarrantyStats);

// Secure invoice viewing/streaming endpoint & signed URL generator
router.get('/:id/invoice', getInvoiceFile);
router.get('/:id/invoice-url', getInvoiceUrl);

router.route('/')
  .get(getWarranties)
  .post(warrantyUpload, createWarranty);

router.route('/:id')
  .get(getWarrantyById)
  .put(warrantyUpload, updateWarranty)
  .delete(deleteWarranty);

export default router;
