import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dns from 'node:dns';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import warrantyRoutes from './routes/warrantyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Local overrides take precedence while normal .env remains the fallback.
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env.local') });
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') });

// Fix MongoDB Atlas SRV DNS resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Connect to Database
connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Explicit CORS Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (with fallback compatibility)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/products', productRoutes);

// Enhanced Health check endpoint reporting database status
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const readyState = mongoose.connection.readyState;
  const dbStatus = dbStates[readyState] || 'unknown';
  const isHealthy = readyState === 1;

  if (!isHealthy && process.env.NODE_ENV === 'production') {
    return res.status(503).json({
      status: 'error',
      message: 'Database connection is not healthy',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    status: isHealthy ? 'ok' : 'degraded',
    message: isHealthy
      ? 'Warranty Wallet API is running smoothly'
      : 'Warranty Wallet API is running with degraded database connection',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
