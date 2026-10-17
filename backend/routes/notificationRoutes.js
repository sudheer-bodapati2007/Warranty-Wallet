import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  triggerReminderCheck
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to allow either valid CRON_SECRET header or authenticated user
const cronOrProtect = (req, res, next) => {
  const cronSecret = req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
    return next();
  }
  return protect(req, res, next);
};

// Scheduled/manual reminder trigger
router.post('/process-reminders', cronOrProtect, triggerReminderCheck);

// All other notification routes require standard user authentication
router.use(protect);

router.route('/')
  .get(getNotifications)
  .delete(clearAllNotifications);

router.put('/read-all', markAllNotificationsAsRead);

router.route('/:id')
  .delete(deleteNotification);

router.put('/:id/read', markNotificationAsRead);

export default router;
