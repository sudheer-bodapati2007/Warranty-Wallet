import React, { useState, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Camera,
  Upload
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getFileUrl } from '../services/api';

const Navbar = ({ user, unreadCount = 0, onLogout, onOpenNotifications }) => {
  const { updateAvatar, removeAvatar } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const fileInputRef = useRef(null);
  const location = useLocation();

  const openProfileModal = () => {
    setUserDropdownOpen(false);
    setProfileOpen(true);
    setProfileError('');
    setSelectedFile(null);
    setPreviewUrl(user?.avatar ? getFileUrl(user.avatar) : '');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Image must be 2MB or smaller.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setProfileError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setProfileError('Please select an image first.');
      return;
    }
    try {
      setUploading(true);
      setProfileError('');
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      await updateAvatar(formData);
      setProfileOpen(false);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to upload profile photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      await removeAvatar();
      setPreviewUrl('');
      setSelectedFile(null);
      setProfileOpen(false);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to remove profile photo.');
    } finally {
      setUploading(false);
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Warranties', path: '/warranties', icon: FolderKanban },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-dark-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group focus:outline-none">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:bg-blue-700 transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Warranty Wallet
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Product Tracker
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path ||
                (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-dark-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop Right Controls (Theme, Notifications, CTA, User Menu) */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notification Bell */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors focus:outline-none"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-dark-900 animate-pulse" />
              )}
            </button>

            {/* Add Warranty CTA */}
            <Link
              to="/add"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Warranty</span>
            </Link>

            {/* User Account / Auth Status */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 dark:border-dark-750 bg-slate-50 dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors focus:outline-none"
                >
                  {user.avatar ? (
                    <img
                      src={getFileUrl(user.avatar)}
                      alt={user.name || 'User'}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-dark-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center uppercase">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                    {user.name || 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-dark-850 border border-slate-200 dark:border-dark-750 shadow-lg py-2 z-50 animate-fadeIn"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-dark-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openProfileModal}
                      className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Change Profile Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Mobile Menu & Theme Button */}
          <div className="flex md:hidden items-center space-x-1.5">
            {user && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors focus:outline-none"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-dark-900 animate-pulse" />
                )}
              </button>
            )}
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 px-4 pt-2 pb-4 space-y-2 shadow-lg animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path ||
              (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{link.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-dark-800 space-y-2">
            <Link
              to="/add"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Add New Warranty</span>
            </Link>

            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({user.email})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>

    {profileOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-white dark:bg-dark-850 rounded-2xl border border-slate-200 dark:border-dark-750 shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-dark-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile Photo</h3>
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {profileError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
                {profileError}
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border border-slate-200 dark:border-dark-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-2xl flex items-center justify-center uppercase">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-dark-800 hover:bg-slate-200 dark:hover:bg-dark-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Select</span>
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>

            {user?.avatar && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="w-full text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50"
              >
                Remove current photo
              </button>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default Navbar;
