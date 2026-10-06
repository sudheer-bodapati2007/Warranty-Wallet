import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MyWarranties from './pages/MyWarranties';
import AddWarranty from './pages/AddWarranty';
import WarrantyDetails from './pages/WarrantyDetails';
import EditWarranty from './pages/EditWarranty';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main View Area */}
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/warranties" element={<MyWarranties />} />
            <Route path="/add" element={<AddWarranty />} />
            <Route path="/warranties/:id" element={<WarrantyDetails />} />
            <Route path="/warranties/:id/edit" element={<EditWarranty />} />
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Warranty Wallet. All rights reserved.</p>
            <p className="font-medium text-slate-600">
              🛡 Built for easy product & receipt tracking
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
