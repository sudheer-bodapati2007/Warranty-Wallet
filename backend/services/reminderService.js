import mongoose from 'mongoose';
import Warranty from '../models/Warranty.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { calculateDaysRemaining } from '../utils/warrantyHelpers.js';
import { sendExpiryReminderEmail } from './emailService.js';

/**
 * Process expiry reminders for all users with active warranties.
 * Idempotent: uses Notification unique compound index on { user, warranty, reminderInterval }.
 *
 * @param {Object} options
 * @param {string} [options.targetUserId] - Optional user ID to process single user
 * @param {boolean} [options.simulateEmail] - If true, simulate email dispatch
 * @returns {Promise<Object>} Summary of processed reminders
 */
export const processWarrantyReminders = async (options = {}) => {
  const { targetUserId = null, simulateEmail = false } = options;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Consider warranties expiring up to 35 days in the future (or already expiring today)
  const maxLookahead = new Date(today);
  maxLookahead.setDate(maxLookahead.getDate() + 35);
  maxLookahead.setHours(23, 59, 59, 999);

  const warrantyQuery = {
    warrantyExpiryDate: { $gte: today, $lte: maxLookahead }
  };

  if (targetUserId) {
    warrantyQuery.user = targetUserId;
  }

  const upcomingWarranties = await Warranty.find(warrantyQuery).populate('user', 'name email reminderPreferences');

  const report = {
    processedCount: upcomingWarranties.length,
    notificationsCreated: 0,
    emailsSent: 0,
    skippedDuplicate: 0,
    errors: []
  };

  for (const warranty of upcomingWarranties) {
    try {
      const user = warranty.user;
      if (!user) continue;

      const daysRemaining = calculateDaysRemaining(warranty.warrantyExpiryDate);
      if (daysRemaining < 0) continue; // Skip past expiry

      const reminderPreferences = user.reminderPreferences || {
        emailReminders: true,
        inAppReminders: true,
        reminderDays: [30, 7, 1]
      };

      const configuredDays = reminderPreferences.reminderDays || [30, 7, 1];
      // Include 0 (expiring today) in candidate intervals
      const candidateIntervals = [...new Set([...configuredDays, 0])].sort((a, b) => b - a);

      for (const interval of candidateIntervals) {
        // Trigger notification if within window for this interval
        // e.g. for interval 30: triggered when daysRemaining <= 30
        if (daysRemaining <= interval) {
          // Check if notification already logged for this interval
          const existing = await Notification.findOne({
            user: user._id,
            warranty: warranty._id,
            reminderInterval: interval
          });

          if (existing) {
            report.skippedDuplicate++;
            continue;
          }

          const countdownText = daysRemaining === 0
            ? 'expires today!'
            : daysRemaining === 1
              ? 'expires in 1 day!'
              : `expires in ${daysRemaining} days!`;

          const title = daysRemaining === 0
            ? `⚠️ Warranty Expiring Today: ${warranty.productName}`
            : `Warranty Reminder: ${warranty.productName} (${daysRemaining}d remaining)`;

          const message = `The warranty coverage for your product "${warranty.productName}" ${countdownText} Please check your purchase records and invoice if warranty service is needed.`;

          // Create notification document
          let notificationDoc;
          try {
            notificationDoc = await Notification.create({
              user: user._id,
              warranty: warranty._id,
              title,
              message,
              daysRemaining,
              reminderInterval: interval,
              type: 'EXPIRY_REMINDER',
              isRead: false,
              sentEmail: false
            });
            report.notificationsCreated++;
          } catch (createErr) {
            // E11000 duplicate key error means already created concurrently
            if (createErr.code === 11000) {
              report.skippedDuplicate++;
              continue;
            }
            throw createErr;
          }

          // Dispatch email if user has email reminders enabled
          if (reminderPreferences.emailReminders && user.email) {
            const emailResult = await sendExpiryReminderEmail({
              toEmail: user.email,
              userName: user.name,
              productName: warranty.productName,
              brand: warranty.brand,
              expiryDate: new Date(warranty.warrantyExpiryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              daysRemaining,
              warrantyId: warranty._id
            });

            if (emailResult.success) {
              notificationDoc.sentEmail = true;
              await notificationDoc.save();
              report.emailsSent++;
            } else {
              notificationDoc.emailError = emailResult.error || 'Failed to dispatch email';
              await notificationDoc.save();
            }
          }
        }
      }
    } catch (err) {
      report.errors.push({
        warrantyId: warranty._id,
        error: err.message
      });
    }
  }

  return report;
};
