import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  PlusCircle, 
  ArrowRight, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { fetchWarrantyStats } from '../services/api';
import WarrantyCard from '../components/WarrantyCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWarrantyStats();
      if (res.success) {
        setStats(res.data);
      } else {
        setError('Failed to load dashboard data.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to server. Please check backend status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 18) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  if (loading) {
    return <LoadingSpinner label="Loading dashboard summary..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-rose-900 mb-1">Connection Error</h3>
          <p className="text-sm text-rose-700 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base max-w-2xl">
            Keep track of your products and never miss a warranty expiry.
          </p>
        </div>
        <div className="shrink-0">
          <Link
            to="/add"
            className="inline-flex items-center space-x-2 px-5 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all focus:outline-none"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Warranty</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.total || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">All items</span>
          </div>
        </div>

        {/* Active Warranties */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Active Warranties
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.active || 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium font-mono">&gt; 30 days left</span>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/20 to-white shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Expiring Soon
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-700">
              {stats?.expiringSoon || 0}
            </span>
            <span className="text-xs text-amber-700 font-medium font-mono">&le; 30 days left</span>
          </div>
        </div>

        {/* Expired */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Expired
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.expired || 0}
            </span>
            <span className="text-xs text-rose-600 font-medium">Warranty ended</span>
          </div>
        </div>
      </div>

      {/* Expiring Soon Priority Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-xl font-bold text-slate-900">Expiring Soon</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Action Needed
            </span>
          </div>
          {stats?.expiringSoonItems?.length > 0 && (
            <Link
              to="/warranties?status=EXPIRING_SOON"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {stats?.expiringSoonItems?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.expiringSoonItems.map((item) => (
              <WarrantyCard key={item._id} warranty={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              You're all caught up 🎉
            </h3>
            <p className="text-sm text-slate-500 max-w-md">
              No products are expiring within the next 30 days. All your active warranties are in safe status!
            </p>
          </div>
        )}
      </section>

      {/* Recent Products Section */}
      {stats?.recentItems?.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recently Added</h2>
            <Link
              to="/warranties"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
            >
              <span>View All Warranties</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.recentItems.map((item) => (
              <WarrantyCard key={item._id} warranty={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
