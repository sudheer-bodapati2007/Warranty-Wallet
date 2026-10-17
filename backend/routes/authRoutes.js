import express from 'express';
import {
  register,
  login,
  googleAuth,
  getMe,
  updatePreferences,
  forgotPassword,
  resetPassword,
  logout,
  updateAvatar,
  deleteAvatar
} from '../controllers/authController.js';
import { protect, authLimiter } from '../middleware/authMiddleware.js';
import { avatarUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:resetToken', authLimiter, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);
router.put('/avatar', protect, avatarUpload, updateAvatar);
router.delete('/avatar', protect, deleteAvatar);

export default router;
