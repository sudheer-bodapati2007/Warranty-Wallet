import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Store,
  DollarSign,
  Hash,
  FileText,
  ExternalLink,
  Package,
  AlertCircle,
  FileCheck,
  Tag,
  Download
} from 'lucide-react';
import { fetchWarrantyById, deleteWarranty, getFileUrl, fetchInvoiceUrl } from '../services/api';
import { formatDate, formatCurrency } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';

const WarrantyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [warranty, setWarranty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadWarranty = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWarrantyById(id);
      if (res.success) {
        setWarranty(res.data);
      } else {
        setError('Warranty details not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load warranty product details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarranty();
  }, [id]);

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteWarranty(id);
      if (res.success) {
        navigate('/warranties', { state: { message: 'Warranty deleted successfully' } });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete warranty. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const [openingInvoice, setOpeningInvoice] = useState(false);

  const handleViewInvoice = async () => {
    if (!warranty?.invoiceFile) return;
    try {
      setOpeningInvoice(true);
      const res = await fetchInvoiceUrl(id);
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        window.open(getFileUrl(warranty.invoiceFile), '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Invoice URL fetch error:', err);
      window.open(getFileUrl(warranty.invoiceFile), '_blank', 'noopener,noreferrer');
    } finally {
      setOpeningInvoice(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading product warranty details..." />;
  }

  if (error || !warranty) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fadeIn">
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200 mb-1">Product Not Found</h3>
          <p className="text-sm text-rose-700 dark:text-rose-300 mb-4">{error}</p>
          <Link
            to="/warranties"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Warranties</span>
          </Link>
        </div>
      </div>
    );
  }

  const {
    _id,
    productName,
    brand,
    category,
    purchaseDate,
    warrantyDuration,
    warrantyUnit,
    warrantyExpiryDate,
    store,
    price,
    serialNumber,
    notes,
    productImage,
    invoiceFile,
    status,
    formattedDaysLeft
  } = warranty;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/warranties"
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Warranties</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Link
            to={`/warranties/${_id}/edit`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-dark-800 border border-slate-300 dark:border-dark-700 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-750 transition-colors shadow-xs"
          >
            <Edit3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Edit</span>
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Details Card Container */}
      <div className="bg-white dark:bg-dark-850 rounded-2xl border border-slate-200/90 dark:border-dark-750/80 shadow-xs overflow-hidden transition-colors">
        {/* Banner Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200 dark:border-dark-750">
          {/* Image */}
          <div className="md:col-span-1 bg-slate-100 dark:bg-dark-800 min-h-[260px] relative flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-dark-750">
            {productImage ? (
              <img
                src={getFileUrl(productImage)}
                alt={productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 dark:text-slate-600 bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-dark-800 dark:to-dark-900 ${
                productImage ? 'hidden' : 'flex'
              }`}
            >
              <Package className="w-16 h-16 stroke-[1.5] mb-2" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">No Image Uploaded</span>
            </div>
          </div>

          {/* Core Summary Info */}
          <div className="md:col-span-2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1 border border-slate-200/60 dark:border-dark-700">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {category}
                </span>
                <StatusBadge status={status} />
              </div>

              {brand && (
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  {brand}
                </p>
              )}

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {productName}
              </h1>
            </div>

            {/* Status Highlight Banner */}
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-dark-900 border-slate-200/80 dark:border-dark-750 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Warranty Expiry</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDate(warrantyExpiryDate)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                  {formattedDaysLeft}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Grid Stats */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Purchase & Warranty Details */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-dark-800 pb-2">
              Purchase Information
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Purchase Date</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(purchaseDate)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Warranty Duration</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {warrantyDuration} {warrantyUnit}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Store className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Store / Vendor</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{store || '—'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Price Paid</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(price)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Hash className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Serial Number</p>
                  <p className="font-mono text-slate-800 dark:text-slate-200 font-medium">{serialNumber || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Documents & Notes */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-dark-800 pb-2">
              Documents & Notes
            </h2>

            {/* Document attachments */}
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Attached Invoice / Receipt</p>
              {invoiceFile ? (
                <button
                  type="button"
                  onClick={handleViewInvoice}
                  disabled={openingInvoice}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-900 hover:bg-blue-50/60 dark:hover:bg-dark-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all group text-left focus:outline-none"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 block truncate">
                        {openingInvoice ? 'Generating Secure Link...' : 'View Attached Invoice Document'}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Authorized private document access
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" />
                </button>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-dark-750 text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>No invoice document uploaded</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2 pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Notes & Instructions</p>
              {notes ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-dark-900 p-4 rounded-xl border border-slate-200 dark:border-dark-750 leading-relaxed whitespace-pre-line">
                  {notes}
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No notes provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Warranty Product?"
        message={`Are you sure you want to delete "${productName}"? This will permanently remove its records and attached invoice files.`}
      />
    </div>
  );
};

export default WarrantyDetails;
