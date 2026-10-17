import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    warranty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warranty',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    daysRemaining: {
      type: Number,
      required: true
    },
    reminderInterval: {
      type: Number,
      required: true // e.g. 30, 7, 1, 0
    },
    type: {
      type: String,
      enum: ['EXPIRY_REMINDER', 'GENERAL'],
      default: 'EXPIRY_REMINDER'
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    sentEmail: {
      type: Boolean,
      default: false
    },
    emailError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Guarantee idempotency: Only 1 notification per user, warranty, and reminder interval
notificationSchema.index(
  { user: 1, warranty: 1, reminderInterval: 1 },
  { unique: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
