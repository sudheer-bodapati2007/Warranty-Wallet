import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Warranty from '../models/Warranty.js';
import { calculateExpiryDate, decorateWarranty } from '../utils/warrantyHelpers.js';
import { storeFile, deleteStoredFile, getSignedFileUrl } from '../services/storageService.js';
import { downloadAndStoreRemoteImage } from '../services/productImageSearchService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

/**
 * @desc    Get all warranties with search, filter, and sort options (Scoped to User)
 * @route   GET /api/warranties
 * @access  Private
 */
export const getWarranties = async (req, res, next) => {
  try {
    const { search, category, status, sort } = req.query;

    // Strict user ownership filter
    let query = { user: req.user._id };

    // Search by product name, brand, or store
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { productName: searchRegex },
            { brand: searchRegex },
            { store: searchRegex }
          ]
        }
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
 * @desc    Get dashboard statistics (Scoped to User)
 * @route   GET /api/warranties/stats
 * @access  Private
 */
export const getWarrantyStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(23, 59, 59, 999);

    const total = await Warranty.countDocuments({ user: userId });
    const active = await Warranty.countDocuments({
      user: userId,
      warrantyExpiryDate: { $gt: thirtyDaysFromNow }
    });
    const expiringSoon = await Warranty.countDocuments({
      user: userId,
      warrantyExpiryDate: { $gte: today, $lte: thirtyDaysFromNow }
    });
    const expired = await Warranty.countDocuments({
      user: userId,
      warrantyExpiryDate: { $lt: today }
    });

    // Fetch expiring soon products sorted by nearest expiry for dashboard
    const expiringSoonItems = await Warranty.find({
      user: userId,
      warrantyExpiryDate: { $gte: today, $lte: thirtyDaysFromNow }
    })
      .sort({ warrantyExpiryDate: 1 })
      .limit(6);

    // Fetch recent products
    const recentItems = await Warranty.find({ user: userId })
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
 * @desc    Get single warranty by ID (Scoped to User)
 * @route   GET /api/warranties/:id
 * @access  Private
 */
export const getWarrantyById = async (req, res, next) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user._id
    });

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
 * @desc    Create new warranty product (Scoped to User with Cloud Storage)
 * @route   POST /api/warranties
 * @access  Private
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
      notes,
      onlineProductImage
    } = req.body;

    if (!productName || !category || !purchaseDate || !warrantyDuration || !warrantyUnit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: productName, category, purchaseDate, warrantyDuration, warrantyUnit.'
      });
    }

    // Compute expiry date automatically
    const warrantyExpiryDate = calculateExpiryDate(purchaseDate, warrantyDuration, warrantyUnit);

    // Handle files if uploaded via persistent storage service
    let productImage = '';
    let invoiceFile = '';

    if (req.files) {
      if (req.files.productImage && req.files.productImage[0]) {
        const stored = await storeFile(req.files.productImage[0], 'images', req.user._id);
        productImage = stored.url;
      }
      if (req.files.invoiceFile && req.files.invoiceFile[0]) {
        const stored = await storeFile(req.files.invoiceFile[0], 'invoices', req.user._id);
        invoiceFile = stored.url;
      }
    }

    // If no manual image uploaded, check if online product image was selected
    if (!productImage && onlineProductImage) {
      try {
        const stored = await downloadAndStoreRemoteImage(onlineProductImage, req.user._id);
        productImage = stored.url;
      } catch (imgErr) {
        console.warn('Could not persist online product image:', imgErr.message);
        // Do not persist arbitrary URLs: keep the warranty without a product image.
        productImage = '';
      }
    }

    const warranty = await Warranty.create({
      user: req.user._id,
      productName: productName.trim(),
      brand: brand ? brand.trim() : '',
      category,
      purchaseDate,
      warrantyDuration: Number(warrantyDuration),
      warrantyUnit,
      warrantyExpiryDate,
      store: store ? store.trim() : '',
      price: price ? Number(price) : null,
      serialNumber: serialNumber ? serialNumber.trim() : '',
      notes: notes ? notes.trim() : '',
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
 * @desc    Update existing warranty (Scoped to User with Safe File Replacement)
 * @route   PUT /api/warranties/:id
 * @access  Private
 */
export const updateWarranty = async (req, res, next) => {
  try {
    let warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user._id
    });

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
      notes,
      removeProductImage,
      removeInvoiceFile,
      onlineProductImage
    } = req.body;

    // Use updated or existing values for expiry calculation
    const updatedPurchaseDate = purchaseDate || warranty.purchaseDate;
    const updatedDuration = warrantyDuration !== undefined ? Number(warrantyDuration) : warranty.warrantyDuration;
    const updatedUnit = warrantyUnit || warranty.warrantyUnit;

    const warrantyExpiryDate = calculateExpiryDate(updatedPurchaseDate, updatedDuration, updatedUnit);

    let productImage = warranty.productImage;
    let invoiceFile = warranty.invoiceFile;

    // Handle explicit file removal
    if (removeProductImage === 'true' && warranty.productImage) {
      await deleteStoredFile(warranty.productImage);
      productImage = '';
    }
    if (removeInvoiceFile === 'true' && warranty.invoiceFile) {
      await deleteStoredFile(warranty.invoiceFile);
      invoiceFile = '';
    }

    // Handle new uploaded files & safely clean up old files
    if (req.files) {
      if (req.files.productImage && req.files.productImage[0]) {
        if (warranty.productImage) {
          await deleteStoredFile(warranty.productImage);
        }
        const stored = await storeFile(req.files.productImage[0], 'images', req.user._id);
        productImage = stored.url;
      }
      if (req.files.invoiceFile && req.files.invoiceFile[0]) {
        if (warranty.invoiceFile) {
          await deleteStoredFile(warranty.invoiceFile);
        }
        const stored = await storeFile(req.files.invoiceFile[0], 'invoices', req.user._id);
        invoiceFile = stored.url;
      }
    }

    // Handle online product image replacement if selected
    if (
      (!req.files || !req.files.productImage) &&
      onlineProductImage &&
      onlineProductImage !== warranty.productImage
    ) {
      try {
        const stored = await downloadAndStoreRemoteImage(onlineProductImage, req.user._id);
        if (warranty.productImage) {
          await deleteStoredFile(warranty.productImage);
        }
        productImage = stored.url;
      } catch (imgErr) {
        console.warn('Could not persist online product image during update:', imgErr.message);
        // Preserve the previously stored image on failure
        productImage = warranty.productImage;
      }
    }

    warranty.productName = productName ? productName.trim() : warranty.productName;
    warranty.brand = brand !== undefined ? brand.trim() : warranty.brand;
    warranty.category = category || warranty.category;
    warranty.purchaseDate = updatedPurchaseDate;
    warranty.warrantyDuration = updatedDuration;
    warranty.warrantyUnit = updatedUnit;
    warranty.warrantyExpiryDate = warrantyExpiryDate;
    warranty.store = store !== undefined ? store.trim() : warranty.store;
    warranty.price = price !== undefined ? (price ? Number(price) : null) : warranty.price;
    warranty.serialNumber = serialNumber !== undefined ? serialNumber.trim() : warranty.serialNumber;
    warranty.notes = notes !== undefined ? notes.trim() : warranty.notes;
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
 * @desc    Delete warranty (Scoped to User with File Cleanup)
 * @route   DELETE /api/warranties/:id
 * @access  Private
 */
export const deleteWarranty = async (req, res, next) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Warranty not found'
      });
    }

    // Clean up uploaded files from storage
    if (warranty.productImage) {
      await deleteStoredFile(warranty.productImage);
    }
    if (warranty.invoiceFile) {
      await deleteStoredFile(warranty.invoiceFile);
    }

    await warranty.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Warranty deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get authorized invoice access (Signed cloud URL or secure stream)
 * @route   GET /api/warranties/:id/invoice
 * @access  Private
 */
export const getInvoiceFile = async (req, res, next) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Warranty not found'
      });
    }

    if (!warranty.invoiceFile) {
      return res.status(404).json({
        success: false,
        message: 'No invoice document attached to this warranty'
      });
    }

    // Cloud storage: generate temporary presigned URL
    if (warranty.invoiceFile.startsWith('cloud://') || !warranty.invoiceFile.startsWith('/uploads/')) {
      const signedUrl = await getSignedFileUrl(warranty.invoiceFile, 900); // 15 min
      return res.redirect(signedUrl);
    }

    // Local fallback: securely stream file
    const filename = path.basename(warranty.invoiceFile);
    const fullPath = path.join(uploadsDir, filename);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Invoice file not found on disk'
      });
    }

    res.sendFile(fullPath);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get authorized temporary URL for invoice viewing/download
 * @route   GET /api/warranties/:id/invoice-url
 * @access  Private
 */
export const getInvoiceUrl = async (req, res, next) => {
  try {
    const warranty = await Warranty.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!warranty) {
      return res.status(404).json({
        success: false,
        message: 'Warranty not found'
      });
    }

    if (!warranty.invoiceFile) {
      return res.status(404).json({
        success: false,
        message: 'No invoice document attached to this warranty'
      });
    }

    // Cloud storage: generate temporary presigned URL
    if (warranty.invoiceFile.startsWith('cloud://') || !warranty.invoiceFile.startsWith('/uploads/')) {
      const signedUrl = await getSignedFileUrl(warranty.invoiceFile, 900); // 15 min
      return res.status(200).json({
        success: true,
        url: signedUrl,
        isCloud: true
      });
    }

    // Local fallback: returns the static/streaming route
    return res.status(200).json({
      success: true,
      url: `/api/warranties/${warranty._id}/invoice`,
      isCloud: false
    });
  } catch (error) {
    next(error);
  }
};
