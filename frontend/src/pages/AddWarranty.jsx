import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  DollarSign, 
  Tag, 
  Store, 
  Hash, 
  FileCheck,
  X,
  AlertCircle
} from 'lucide-react';
import { createWarranty } from '../services/api';
import { formatDate } from '../utils/formatters';

const CATEGORIES = ['Electronics', 'Appliances', 'Furniture', 'Vehicles', 'Accessories', 'Other'];
const UNITS = ['Months', 'Years'];

const AddWarranty = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    category: 'Electronics',
    purchaseDate: new Date().toISOString().split('T')[0], // today YYYY-MM-DD
    warrantyDuration: 12,
    warrantyUnit: 'Months',
    store: '',
    price: '',
    serialNumber: '',
    notes: ''
  });

  const [productImageFile, setProductImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Helper calculation for live expiry preview
  const getCalculatedExpiryPreview = () => {
    if (!formData.purchaseDate || !formData.warrantyDuration) return null;
    const date = new Date(formData.purchaseDate);
    const num = Number(formData.warrantyDuration) || 0;
    if (formData.warrantyUnit === 'Years') {
      date.setFullYear(date.getFullYear() + num);
    } else {
      date.setMonth(date.getMonth() + num);
    }
    return date;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      setProductImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleInvoiceChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Document file size must be less than 5MB');
        return;
      }
      setInvoiceFile(file);
      setError('');
    }
  };

  const removeImage = () => {
    setProductImageFile(null);
    setImagePreview(null);
  };

  const removeInvoice = () => {
    setInvoiceFile(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.productName.trim()) errors.productName = 'Product name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.purchaseDate) errors.purchaseDate = 'Purchase date is required';
    if (!formData.warrantyDuration || Number(formData.warrantyDuration) <= 0) {
      errors.warrantyDuration = 'Valid warranty duration is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const submissionData = new FormData();
      Object.keys(formData).forEach((key) => {
        submissionData.append(key, formData[key]);
      });

      if (productImageFile) {
        submissionData.append('productImage', productImageFile);
      }
      if (invoiceFile) {
        submissionData.append('invoiceFile', invoiceFile);
      }

      const response = await createWarranty(submissionData);
      if (response.success) {
        navigate('/warranties', { state: { message: 'Warranty product added successfully!' } });
      } else {
        setError(response.message || 'Failed to save warranty.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server error occurred while saving warranty.');
    } finally {
      setLoading(false);
    }
  };

  const expiryPreviewDate = getCalculatedExpiryPreview();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Back Link */}
      <Link
        to="/warranties"
        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Warranties</span>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Add New Warranty
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Enter product details, upload invoice documents, and set warranty period.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        
        {/* Basic Details Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>Product Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                placeholder="e.g. Sony WH-1000XM5 Headphones"
                value={formData.productName}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:bg-white ${
                  fieldErrors.productName
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {fieldErrors.productName && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.productName}</p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                name="brand"
                placeholder="e.g. Sony, Apple, Samsung"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Warranty Calculation Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Warranty Period</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4">
            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Purchase Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Warranty Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Warranty Duration <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                name="warrantyDuration"
                value={formData.warrantyDuration}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Warranty Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration Unit <span className="text-rose-500">*</span>
              </label>
              <select
                name="warrantyUnit"
                value={formData.warrantyUnit}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Computed Expiry Banner Preview */}
          {expiryPreviewDate && (
            <div className="mt-4 p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Calculated Warranty Expiry Date:
              </span>
              <span className="text-sm font-bold text-blue-700">
                {formatDate(expiryPreviewDate)}
              </span>
            </div>
          )}
        </div>

        {/* Additional Purchase Info */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
            <Store className="w-5 h-5 text-blue-600" />
            <span>Store & Receipts</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4">
            {/* Store */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Store / Vendor
              </label>
              <input
                type="text"
                name="store"
                placeholder="e.g. Amazon, Best Buy"
                value={formData.store}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Price Paid ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Serial Number
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="serialNumber"
                  placeholder="e.g. S/N 9842104"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Uploads Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Files & Attachments</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {/* Product Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Image (JPG, PNG, WEBP)
              </label>
              {imagePreview ? (
                <div className="relative h-40 rounded-xl border border-slate-200 overflow-hidden group bg-slate-100">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-lg shadow-sm hover:bg-rose-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-600">Click to upload product image</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Max file size 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Invoice Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Invoice / Warranty Document (PDF or Image)
              </label>
              {invoiceFile ? (
                <div className="flex items-center justify-between p-4 h-40 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {invoiceFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(invoiceFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeInvoice}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all">
                  <FileText className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-600">Click to upload invoice / document</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">PDF, JPG, PNG up to 5MB</span>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={handleInvoiceChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Additional Notes
          </label>
          <textarea
            name="notes"
            rows="3"
            placeholder="e.g. Extended warranty purchased. Claim process involves contacting Apple Support with serial number."
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <Link
            to="/warranties"
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Warranty...</span>
              </>
            ) : (
              <span>Save Warranty</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddWarranty;
