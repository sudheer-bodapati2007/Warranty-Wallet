import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Warranty from '../models/Warranty.js';
import { calculateExpiryDate, decorateWarranty } from '../utils/warrantyHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Delete a file safely from disk
 */
const removeFileIfExists = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) console.error(`Error deleting file ${fullPath}:`, err);
    });
  }
};

/**
 * @desc    Get all warranties with search, filter, and sort options
 * @route   GET /api/warranties
 * @access  Public
 */
export const getWarranties = async (req, res, next) => {
  try {
    const { search, category, status, sort } = req.query;

    let query = {};

    // Search by product name, brand, or store
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { productName: searchRegex },
        { brand: searchRegex },
        { store: searchRegex }
      ];
    }

    // Filter by Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Dates for status queries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    // Filter by Status
    if (status && status !== 'All') {
      if (status === 'ACTIVE') {
        query.warrantyExpiryDate = { $gt: thirtyDaysFromNow };
      } else if (status === 'EXPIRING_SOON') {
        query.warrantyExpiryDate = { $gte: today, $lte: thirtyDaysFromNow };
      } else if (status === 'EXPIRED') {
        query.warrantyExpiryDate = { $lt: today };
      }
    }

    // Build Sort options
    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sort === 'ending_soon') {
      sortOptions = { warrantyExpiryDate: 1 };
    } else if (sort === 'name') {
      sortOptions = { productName: 1 };
    }

    const warranties = await Warranty.find(query).sort(sortOptions);
    const decoratedWarranties = warranties.map(decorateWarranty);

    res.status(200).json({
      success: true,
      count: decoratedWarranties.length,
      data: decoratedWarranties
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/warranties/stats
 * @access  Public
 */
export const getWarrantyStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const total = await Warranty.countDocuments();
    const active = await Warranty.countDocuments({ warrantyExpiryDate: { $gt: thirtyDaysFromNow } });
    const expiringSoon = await Warranty.countDocuments({
      warrantyExpiryDate: { $gte: today, $lte: thirtyDaysFromNow }
    });
    const expired = await Warranty.countDocuments({ warrantyExpiryDate: { $lt: today } });

    // Also fetch expiring soon products sorted by nearest expiry for dashboard
    const expiringSoonItems = await Warranty.find({
      warrantyExpiryDate: { $gte: today, $lte: thirtyDaysFromNow }
    })
      .sort({ warrantyExpiryDate: 1 })
      .limit(6);

    // Fetch recent products
    const recentItems = await Warranty.find()
      .sort({ createdAt: -1 })
      .limit(4);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        expiringSoon,
        expired,
        expiringSoonItems: expiringSoonItems.map(decorateWarranty),
        recentItems: recentItems.map(decorateWarranty)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single warranty by ID
 * @route   GET /api/warranties/:id
 * @access  Public
 */
export const getWarrantyById = async (req, res, next) => {
  try {
    const warranty = await Warranty.findById(req.params.id);

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Warranty not found'
      });
    }

    res.status(200).json({
      success: true,
      data: decorateWarranty(warranty)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new warranty product
 * @route   POST /api/warranties
 * @access  Public
 */
export const createWarranty = async (req, res, next) => {
  try {
    const {
      productName,
      brand,
      category,
      purchaseDate,
      warrantyDuration,
      warrantyUnit,
      store,
      price,
      serialNumber,
      notes
    } = req.body;

    if (!productName || !category || !purchaseDate || !warrantyDuration || !warrantyUnit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: productName, category, purchaseDate, warrantyDuration, warrantyUnit.'
      });
    }

    // Compute expiry date automatically
    const warrantyExpiryDate = calculateExpiryDate(purchaseDate, warrantyDuration, warrantyUnit);

    // Handle files if uploaded
    let productImage = '';
    let invoiceFile = '';

    if (req.files) {
      if (req.files.productImage && req.files.productImage[0]) {
        productImage = `/uploads/${req.files.productImage[0].filename}`;
      }
      if (req.files.invoiceFile && req.files.invoiceFile[0]) {
        invoiceFile = `/uploads/${req.files.invoiceFile[0].filename}`;
      }
    }

    const warranty = await Warranty.create({
      productName,
      brand: brand || '',
      category,
      purchaseDate,
      warrantyDuration: Number(warrantyDuration),
      warrantyUnit,
      warrantyExpiryDate,
      store: store || '',
      price: price ? Number(price) : null,
      serialNumber: serialNumber || '',
      notes: notes || '',
      productImage,
      invoiceFile
    });

    res.status(201).json({
      success: true,
      message: 'Warranty product added successfully',
      data: decorateWarranty(warranty)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update existing warranty
 * @route   PUT /api/warranties/:id
 * @access  Public
 */
export const updateWarranty = async (req, res, next) => {
  try {
    let warranty = await Warranty.findById(req.params.id);

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Warranty not found'
      });
    }

    const {
      productName,
      brand,
      category,
      purchaseDate,
      warrantyDuration,
      warrantyUnit,
      store,
      price,
      serialNumber,
      notes
    } = req.body;

    // Use updated or existing values for expiry calculation
    const updatedPurchaseDate = purchaseDate || warranty.purchaseDate;
    const updatedDuration = warrantyDuration !== undefined ? Number(warrantyDuration) : warranty.warrantyDuration;
    const updatedUnit = warrantyUnit || warranty.warrantyUnit;

    const warrantyExpiryDate = calculateExpiryDate(updatedPurchaseDate, updatedDuration, updatedUnit);

    let productImage = warranty.productImage;
    let invoiceFile = warranty.invoiceFile;

    // Handle new uploaded files & clean up old files
    if (req.files) {
      if (req.files.productImage && req.files.productImage[0]) {
        if (warranty.productImage) {
          removeFileIfExists(warranty.productImage);
        }
        productImage = `/uploads/${req.files.productImage[0].filename}`;
      }
      if (req.files.invoiceFile && req.files.invoiceFile[0]) {
        if (warranty.invoiceFile) {
          removeFileIfExists(warranty.invoiceFile);
        }
        invoiceFile = `/uploads/${req.files.invoiceFile[0].filename}`;
      }
    }

    warranty.productName = productName || warranty.productName;
    warranty.brand = brand !== undefined ? brand : warranty.brand;
    warranty.category = category || warranty.category;
    warranty.purchaseDate = updatedPurchaseDate;
    warranty.warrantyDuration = updatedDuration;
    warranty.warrantyUnit = updatedUnit;
    warranty.warrantyExpiryDate = warrantyExpiryDate;
    warranty.store = store !== undefined ? store : warranty.store;
    warranty.price = price !== undefined ? (price ? Number(price) : null) : warranty.price;
    warranty.serialNumber = serialNumber !== undefined ? serialNumber : warranty.serialNumber;
    warranty.notes = notes !== undefined ? notes : warranty.notes;
    warranty.productImage = productImage;
    warranty.invoiceFile = invoiceFile;

    const updatedWarranty = await warranty.save();

    res.status(200).json({
      success: true,
      message: 'Warranty updated successfully',
      data: decorateWarranty(updatedWarranty)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete warranty
 * @route   DELETE /api/warranties/:id
 * @access  Public
 */
export const deleteWarranty = async (req, res, next) => {
  try {
    const warranty = await Warranty.findById(req.params.id);

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Warranty not found'
      });
    }

    // Clean up uploaded files from filesystem
    removeFileIfExists(warranty.productImage);
    removeFileIfExists(warranty.invoiceFile);

    await warranty.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Warranty deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
