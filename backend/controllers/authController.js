import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { storeFile, deleteStoredFile, getCloudinaryPublicId } from '../services/storageService.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({ email: emailNormalized });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: emailNormalized,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        role: user.role,
        reminderPreferences: user.reminderPreferences,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Explicitly include password hash for comparison
    const user = await User.findOne({ email: emailNormalized }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        role: user.role,
        reminderPreferences: user.reminderPreferences,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar || '',
        role: req.user.role,
        reminderPreferences: req.user.reminderPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update notification/reminder preferences
 * @route   PUT /api/auth/preferences
 * @access  Private
 */
export const updatePreferences = async (req, res, next) => {
  try {
    const { emailReminders, inAppReminders, reminderDays } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (emailReminders !== undefined) user.reminderPreferences.emailReminders = Boolean(emailReminders);
    if (inAppReminders !== undefined) user.reminderPreferences.inAppReminders = Boolean(inAppReminders);
    if (Array.isArray(reminderDays)) user.reminderPreferences.reminderDays = reminderDays;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.reminderPreferences
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Initiate password reset (generate expiring token)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    // Consistent response to prevent user email enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with that email address, password reset instructions have been generated.'
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // In production, an email would be dispatched (handled in emailService Phase 6)
    // For development convenience, we attach resetToken only when not in production
    const isDev = process.env.NODE_ENV !== 'production';

    res.status(200).json({
      ...genericResponse,
      ...(isDev ? { devResetToken: resetToken } : {})
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password with token
 * @route   PUT /api/auth/reset-password/:resetToken
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Hash token from URL param to compare with hashed token in DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sign out user
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * @desc    Authenticate with Google OAuth ID token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required'
      });
    }

    let payload;

    // In test environment, allow mock/simulated verification
    if (process.env.NODE_ENV === 'test' && credential.startsWith('simulated_google_token_')) {
      const email = credential.replace('simulated_google_token_', '');
      payload = {
        sub: `google_sim_${Date.now()}`,
        email: email.toLowerCase(),
        name: 'Test Google User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true
      };
    } else {
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(500).json({
          success: false,
          message: 'Google OAuth Client ID is not configured on the server. Please set GOOGLE_CLIENT_ID in your environment variables.'
        });
      }

      const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Unable to verify Google credentials'
      });
    }

    if (!payload.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Google account email is not verified'
      });
    }

    const { sub: googleId, email, name, picture } = payload;
    const emailNormalized = email.toLowerCase().trim();

    // Look up by googleId first, then by email for safe account linking
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email: emailNormalized });
      if (user) {
        // Link existing account safely
        user.googleId = googleId;
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        await user.save();
      } else {
        // Create new account
        user = await User.create({
          name: name ? name.trim() : 'Google User',
          email: emailNormalized,
          googleId,
          avatar: picture || ''
        });
      }
    } else {
      // If user exists and picture updated
      if (!user.avatar && picture) {
        user.avatar = picture;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        role: user.role,
        reminderPreferences: user.reminderPreferences,
        token
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Failed to authenticate with Google. Invalid or expired token.'
    });
  }
};

/**
 * @desc    Upload or update profile photo avatar
 * @route   PUT /api/auth/avatar
 * @access  Private
 */
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image file to upload as your profile photo'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clean up previous avatar only when it is stored by this app, including
    // local, S3/R2, and Cloudinary assets. External Google profile photos are
    // never deleted remotely.
    const isManagedAvatar =
      Boolean(user.avatar) &&
      (!user.avatar.startsWith('http://') &&
        !user.avatar.startsWith('https://') ||
        Boolean(getCloudinaryPublicId(user.avatar)));

    if (isManagedAvatar) {
      await deleteStoredFile(user.avatar);
    }

    const stored = await storeFile(req.file, 'avatars', user._id);
    user.avatar = stored.url;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        reminderPreferences: user.reminderPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove profile photo avatar
 * @route   DELETE /api/auth/avatar
 * @access  Private
 */
export const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.avatar) {
      const isManagedAvatar =
        !user.avatar.startsWith('http://') &&
        !user.avatar.startsWith('https://') ||
        Boolean(getCloudinaryPublicId(user.avatar));

      if (isManagedAvatar) {
        await deleteStoredFile(user.avatar);
      }
      user.avatar = '';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo removed successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: '',
        role: user.role,
        reminderPreferences: user.reminderPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};
