import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProductImageSearch } from '../hooks/useProductImageSearch';
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
  AlertCircle,
  Clock,
  ShieldCheck,
  Info
} from 'lucide-react';
import { fetchWarrantyById, updateWarranty, getFileUrl } from '../services/api';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['Electronics', 'Appliances', 'Furniture', 'Vehicles', 'Accessories', 'Other'];
const UNITS = ['Days', 'Months', 'Years'];

const EditWarranty = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    productName: '',
    brand: '',
    category: 'Electronics',
    purchaseDate: '',
    warrantyDuration: 12,
    warrantyUnit: 'Months',
    store: '',
    price: '',
    serialNumber: '',
    notes: ''
  });

  const [existingProductImage, setExistingProductImage] = useState('');
  const [existingInvoiceFile, setExistingInvoiceFile] = useState('');

  const [productImageFile, setProductImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedOnlineImage, setSelectedOnlineImage] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);

  const imageSearchQuery = [formData.productName, formData.brand].filter(Boolean).join(' ').trim();
  const {
    results: onlineImages,
    loading: onlineImageSearchLoading,
    error: onlineImageSearchError
  } = useProductImageSearch(imageSearchQuery);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetchWarrantyById(id);
        if (res.success) {
          const w = res.data;
          // Format purchaseDate for <input type="date"> (YYYY-MM-DD)
          const formattedPurchaseDate = w.purchaseDate
            ? new Date(w.purchaseDate).toISOString().split('T')[0]
            : '';

          setFormData({
            productName: w.productName || '',
            brand: w.brand || '',
            category: w.category || 'Other',
            purchaseDate: formattedPurchaseDate,
            warrantyDuration: w.warrantyDuration || 12,
            warrantyUnit: w.warrantyUnit || 'Months',
            store: w.store || '',
            price: w.price !== null && w.price !== undefined ? w.price : '',
            serialNumber: w.serialNumber || '',
            notes: w.notes || ''
          });

          setExistingProductImage(w.productImage || '');
          setExistingInvoiceFile(w.invoiceFile || '');
        } else {
          setError('Failed to fetch warranty data.');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading product details.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Dynamic preview calculation
  const getCalculatedExpiryPreview = () => {
    if (!formData.purchaseDate || !formData.warrantyDuration) return null;
    const date = new Date(formData.purchaseDate);
    const num = Number(formData.warrantyDuration) || 0;
    if (formData.warrantyUnit === 'Days') {
      date.setDate(date.getDate() + num);
    } else if (formData.warrantyUnit === 'Years') {
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

    // Avoid keeping an image selected for an older product name/brand combination.
    if ((name === 'productName' || name === 'brand') && selectedOnlineImage) {
      setSelectedOnlineImage('');
      if (imagePreview === selectedOnlineImage) {
        setImagePreview(existingProductImage ? getFileUrl(existingProductImage) : null);
      }
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
      setSelectedOnlineImage('');
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSelectOnlineImage = (url) => {
    setSelectedOnlineImage(url);
    setProductImageFile(null);
    setImagePreview(url);
    setError('');
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
    setSelectedOnlineImage('');
    setImagePreview(null);
    setExistingProductImage('');
  };

  const removeInvoice = () => {
    setInvoiceFile(null);
    setExistingInvoiceFile('');
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.productName.trim()) errors.productName = 'Product name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.purchaseDate) errors.purchaseDate = 'Purchase date is required';
    if (!formData.warrantyDuration || Number(formData.warrantyDuration) <= 0) {
      errors.warrantyDuration = 'Valid warranty duration is required (minimum 1)';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Prevent accidental duplicate submission
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError('');

      const submissionData = new FormData();
      Object.keys(formData).forEach((key) => {
        submissionData.append(key, formData[key]);
      });

      if (productImageFile) {
        submissionData.append('productImage', productImageFile);
      } else if (selectedOnlineImage) {
        submissionData.append('onlineProductImage', selectedOnlineImage);
      } else if (!existingProductImage) {
        submissionData.append('removeProductImage', 'true');
      }

      if (invoiceFile) {
        submissionData.append('invoiceFile', invoiceFile);
      } else if (!existingInvoiceFile) {
        submissionData.append('removeInvoiceFile', 'true');
      }

      const response = await updateWarranty(id, submissionData);
      if (response.success) {
        navigate(`/warranties/${id}`, { state: { message: 'Warranty updated successfully!' } });
      } else {
        setError(response.message || 'Failed to update warranty.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server error occurred while updating warranty.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading product data for editing..." />;
  }

  const expiryPreviewDate = getCalculatedExpiryPreview();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Back Link */}
      <Link
        to={`/warranties/${id}`}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel & Back to Details</span>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Edit Warranty
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Update product details, replace receipts, or adjust warranty length.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center space-x-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200/90 dark:border-dark-750/80 shadow-xs p-6 sm:p-8 space-y-8 transition-colors">

        {/* Section 1: Product Information */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-800 flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>1. Product Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                placeholder="Product Name"
                value={formData.productName}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border ${
                  fieldErrors.productName ? 'border-rose-500' : 'border-slate-200 dark:border-dark-700'
                } rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {fieldErrors.productName && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.productName}</p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Section 2: Purchase Information */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-800 flex items-center space-x-2">
            <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>2. Purchase Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4">
            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Purchase Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border ${
                  fieldErrors.purchaseDate ? 'border-rose-500' : 'border-slate-200 dark:border-dark-700'
                } rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {fieldErrors.purchaseDate && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.purchaseDate}</p>
              )}
            </div>

            {/* Store / Vendor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Store / Vendor
              </label>
              <input
                type="text"
                name="store"
                value={formData.store}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Price Paid ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Serial Number */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Serial Number / Model ID
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Warranty Details */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-800 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>3. Warranty Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {/* Warranty Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Warranty Duration <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                name="warrantyDuration"
                value={formData.warrantyDuration}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border ${
                  fieldErrors.warrantyDuration ? 'border-rose-500' : 'border-slate-200 dark:border-dark-700'
                } rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {fieldErrors.warrantyDuration && (
                <p className="mt-1 text-xs text-rose-500">{fieldErrors.warrantyDuration}</p>
              )}
            </div>

            {/* Warranty Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Unit <span className="text-rose-500">*</span>
              </label>
              <select
                name="warrantyUnit"
                value={formData.warrantyUnit}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Automatic Expiry Date Preview Pill */}
          {expiryPreviewDate && (
            <div className="mt-4 p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                    Calculated Warranty Expiry:
                  </p>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                    {formatDate(expiryPreviewDate)}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                Auto Computed
              </span>
            </div>
          )}
        </div>

        {/* Section 4: Product Image */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-800 flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>4. Product Image</span>
          </h2>

          <div className="mt-4 space-y-4">
            {onlineImageSearchLoading && (
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                <span>Searching for product image...</span>
              </div>
            )}

            {!onlineImageSearchLoading && onlineImageSearchError && (
              <p className="text-xs text-rose-500">{onlineImageSearchError}</p>
            )}

            {!onlineImageSearchLoading && !onlineImageSearchError && imageSearchQuery.length >= 3 && onlineImages.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No suggested images found. You can upload a photo manually.
              </p>
            )}

            {onlineImages.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Suggested product images
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {onlineImages.map((img) => (
                    <button
                      type="button"
                      key={img.id}
                      onClick={() => handleSelectOnlineImage(img.imageUrl || img.thumbnailUrl)}
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-dark-700 hover:border-blue-500 transition-all group"
                      title={img.title}
                    >
                      <img
                        src={img.thumbnailUrl || img.imageUrl}
                        alt={img.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {imagePreview || existingProductImage ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-700 shadow-xs shrink-0">
                  <img
                    src={imagePreview || getFileUrl(existingProductImage)}
                    alt="Product Preview"
                    className="w-full h-full object-cover"
                  />
                  {selectedOnlineImage && !productImageFile && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                      Online image
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove image</span>
                  </button>
                  <label className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload manually</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-dark-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-dark-900 cursor-pointer transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Upload product photo
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP (Max 5MB)
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

{/* Section 5: Invoice / Receipt Document */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-800 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>5. Invoice / Receipt Document</span>
          </h2>

          <div className="mt-4">
            {invoiceFile || existingInvoiceFile ? (
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-900">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {invoiceFile ? invoiceFile.name : 'Attached Invoice Document'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {invoiceFile ? `${(invoiceFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Existing file retained'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeInvoice}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                  title="Remove invoice"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-dark-700 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-dark-900 cursor-pointer transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Upload Invoice / Receipt Document
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports PDF, JPG, PNG (Max 5MB)
                </p>
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

        {/* Section 6: Additional Notes */}
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-dark-800 flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>6. Additional Notes & Terms</span>
          </h2>

          <div className="mt-4">
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-dark-800 flex items-center justify-end space-x-4">
          <Link
            to={`/warranties/${id}`}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Updating Warranty...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditWarranty;
