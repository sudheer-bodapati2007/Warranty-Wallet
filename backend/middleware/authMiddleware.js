import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

// Secret key fallback for development
const getJwtSecret = () => process.env.JWT_SECRET || 'dev_fallback_secret_warranty_wallet_key_2026';

/**
 * Generate a signed JWT token for a user
 * @param {string} userId
 * @returns {string} token
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Middleware: Protect routes and require valid authenticated user
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());

      // Fetch user without password field
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT Verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid or expired token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no authentication token provided'
    });
  }
};

/**
 * Rate Limiter for Authentication Endpoints (Login, Signup, Password Reset)
 * 15 requests per 15 minutes window
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});
