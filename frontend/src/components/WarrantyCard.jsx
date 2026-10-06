import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Package, 
  Tv, 
  Plug, 
  Armchair, 
  Car, 
  Watch, 
  Tag 
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatters';
import { getFileUrl } from '../services/api';

const categoryIcons = {
  Electronics: Tv,
  Appliances: Plug,
  Furniture: Armchair,
  Vehicles: Car,
  Accessories: Watch,
  Other: Tag,
};

const WarrantyCard = ({ warranty }) => {
  const {
    _id,
    productName,
    brand,
    category,
    warrantyExpiryDate,
    status,
    formattedDaysLeft,
    daysRemaining,
    productImage,
  } = warranty;

  const CategoryIcon = categoryIcons[category] || Package;

  // Countdown badge style based on status
  const getCountdownBadge = () => {
    if (status === 'EXPIRED') {
      return 'text-rose-600 bg-rose-50 font-medium';
    } else if (status === 'EXPIRING_SOON') {
      return 'text-amber-700 bg-amber-50 font-semibold border border-amber-200';
    }
    return 'text-slate-600 bg-slate-100 font-medium';
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col overflow-hidden">
      {/* Product Image Header */}
      <div className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
        {productImage ? (
          <img
            src={getFileUrl(productImage)}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200/60 text-slate-400 ${
            productImage ? 'hidden' : 'flex'
          }`}
        >
          <CategoryIcon className="w-12 h-12 stroke-[1.5]" />
        </div>

        {/* Category Tag overlay */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/90 backdrop-blur-md text-slate-700 shadow-xs border border-slate-200/60">
            <CategoryIcon className="w-3.5 h-3.5 text-slate-500" />
            {category}
          </span>
        </div>

        {/* Status Badge overlay */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand */}
          {brand && (
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              {brand}
            </p>
          )}

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
            {productName}
          </h3>

          {/* Expiry Details */}
          <div className="mt-4 space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center text-slate-500 gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Expiry Date:
              </span>
              <span className="font-semibold text-slate-800">
                {formatDate(warrantyExpiryDate)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center text-slate-500 gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Countdown:
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs ${getCountdownBadge()}`}>
                {formattedDaysLeft}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer Action */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          <Link
            to={`/warranties/${_id}`}
            className="w-full inline-flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors group/btn"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WarrantyCard;
