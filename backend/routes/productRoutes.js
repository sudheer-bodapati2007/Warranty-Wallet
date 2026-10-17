import express from 'express';
import { searchProductImages } from '../services/productImageSearchService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for product search APIs
router.use(protect);

/**
 * @desc    Search for product images online by product name
 * @route   GET /api/products/image-search?q=...
 * @access  Private
 */
router.get('/image-search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const results = await searchProductImages(q);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

export default router;
