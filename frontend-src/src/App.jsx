import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Pricing from './pages/Pricing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LocationView from './pages/LocationView.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/regjistrohu" element={<Register />} />
            <Route path="/kycu" element={<Login />} />
            <Route path="/planet" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/lokacioni/:id" element={<ProtectedRoute><LocationView /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
