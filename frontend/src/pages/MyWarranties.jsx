import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  PackageSearch,
  X,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter
} from 'lucide-react';
import { fetchWarranties } from '../services/api';
import WarrantyCard from '../components/WarrantyCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const CATEGORIES = ['All', 'Electronics', 'Appliances', 'Furniture', 'Vehicles', 'Accessories', 'Other'];
const STATUSES = [
  { label: 'All Statuses', value: 'All' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Expiring Soon', value: 'EXPIRING_SOON' },
  { label: 'Expired', value: 'EXPIRED' }
];

const SORT_OPTIONS = [
  { label: 'Newest Added', value: 'newest' },
  { label: 'Oldest Added', value: 'oldest' },
  { label: 'Warranty Ending Soon', value: 'ending_soon' },
  { label: 'Product Name (A-Z)', value: 'name' }
];

const MyWarranties = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States initialized from URL params if present
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'All');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'newest');

  const loadWarranties = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedSort) params.sort = selectedSort;

      const res = await fetchWarranties(params);
      if (res.success) {
        setWarranties(res.data);
      } else {
        setError('Failed to fetch warranties list.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load products. Please ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Sync state with URL params change & fetch data
  useEffect(() => {
    const handler = setTimeout(() => {
      loadWarranties();
    }, 250); // Small debounce for search input

    return () => clearTimeout(handler);
  }, [searchTerm, selectedCategory, selectedStatus, selectedSort]);

  // Handle reset filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedSort('newest');
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedSort !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Warranties
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Browse, search, and manage all your tracked product warranties.
          </p>
        </div>
        <div>
          <Link
            to="/add"
            className="inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-600/20 transition-all focus:outline-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Warranty</span>
          </Link>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Sorting */}
      <div className="bg-white dark:bg-dark-850 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-dark-750/80 shadow-xs space-y-4 transition-colors">
        {/* Top Row: Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name, brand, or store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-dark-900 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Row: Category, Status & Sort Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-dark-800">
          {/* Category Dropdown */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  Status: {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort by: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing filtered results
            </span>
            <button
              onClick={clearFilters}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <LoadingSpinner label="Fetching your product warranties..." />
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-center">
          <p className="text-rose-700 dark:text-rose-300 font-semibold">{error}</p>
        </div>
      ) : warranties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {warranties.map((item) => (
            <WarrantyCard key={item._id} warranty={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title={hasActiveFilters ? "No products found" : "No warranties yet"}
          description={
            hasActiveFilters
              ? "No warranty products match your selected search terms or filters. Try adjusting your query."
              : "Add your first product to start tracking your warranties, purchase receipts, and expiry dates."
          }
          actionText={hasActiveFilters ? "Clear Filters" : "Add Warranty"}
          actionLink={hasActiveFilters ? null : "/add"}
          onActionClick={hasActiveFilters ? clearFilters : undefined}
        />
      )}
    </div>
  );
};

export default MyWarranties;
