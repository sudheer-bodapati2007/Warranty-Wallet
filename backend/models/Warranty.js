import mongoose from 'mongoose';

const warrantySchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    brand: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Electronics', 'Appliances', 'Furniture', 'Vehicles', 'Accessories', 'Other'],
      default: 'Other'
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required']
    },
    warrantyDuration: {
      type: Number,
      required: [true, 'Warranty duration is required'],
      min: [1, 'Warranty duration must be at least 1']
    },
    warrantyUnit: {
      type: String,
      required: [true, 'Warranty unit is required'],
      enum: ['Months', 'Years'],
      default: 'Months'
    },
    warrantyExpiryDate: {
      type: Date,
      required: [true, 'Warranty expiry date is required']
    },
    store: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: null
    },
    serialNumber: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    productImage: {
      type: String,
      default: ''
    },
    invoiceFile: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Add index on product name and brand for search performance
warrantySchema.index({ productName: 'text', brand: 'text', store: 'text' });

const Warranty = mongoose.model('Warranty', warrantySchema);

export default Warranty;
