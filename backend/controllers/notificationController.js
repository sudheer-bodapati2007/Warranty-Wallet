import Notification from '../models/Notification.js';
import { processWarrantyReminders } from '../services/reminderService.js';

/**
 * @desc    Get user notifications with unread count
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('warranty', 'productName brand category warrantyExpiryDate productImage')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all notifications for user
 * @route   DELETE /api/notifications
 * @access  Private
 */
export const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger reminder processing scan
 * @route   POST /api/notifications/process-reminders
 * @access  Private (or authorized via CRON_SECRET)
 */
export const triggerReminderCheck = async (req, res, next) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    const isCronAuthorized = process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;

    // If cron secret is supplied, scan all users; otherwise, scope to current user
    const targetUserId = isCronAuthorized ? null : req.user?._id;

    const report = await processWarrantyReminders({
      targetUserId,
      simulateEmail: process.env.NODE_ENV === 'test'
    });

    res.status(200).json({
      success: true,
      message: 'Reminder processing complete',
      data: report
    });
  } catch (error) {
    next(error);
  }
};
