import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, AlertCircle, CheckCircle2, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devToken, setDevToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your account email.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await forgotPassword(email.trim());
      if (res.success) {
        setSuccessMessage(res.message);
        if (res.devResetToken) {
          setDevToken(res.devResetToken);
        }
      } else {
        setError(res.message || 'Failed to process request.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/30">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter your email and we'll generate instructions to reset your password.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center space-x-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-3">
            <div className="flex items-center space-x-3 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold">{successMessage}</p>
            </div>
            {devToken && (
              <div className="p-3 bg-white dark:bg-dark-800 rounded-xl border border-emerald-200 dark:border-dark-700 text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Development Mode Reset Link:
                </p>
                <Link
                  to={`/reset-password/${devToken}`}
                  className="text-blue-600 dark:text-blue-400 font-mono hover:underline break-all"
                >
                  Click here to set your new password
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Form Container */}
        {!successMessage ? (
          <div className="bg-white dark:bg-dark-850 p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-dark-750/80 shadow-xs transition-colors">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing request...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-dark-800 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to sign in</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to sign in</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
