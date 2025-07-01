import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/client/Dashboard';
import SearchFundis from './pages/client/SearchFundis';
import FundiDetails from './pages/client/FundiDetails';
import BookService from './pages/client/BookService';
import ClientBookings from './pages/client/Bookings';
import FundiDashboard from './pages/fundi/Dashboard';
import FundiProfile from './pages/fundi/Profile';
import FundiBookings from './pages/fundi/Bookings';
import FundiEarnings from './pages/fundi/Earnings';
import AdminDashboard from './pages/admin/Dashboard';
import AdminFundis from './pages/admin/Fundis';
import AdminBookings from './pages/admin/Bookings';
import AdminSettings from './pages/admin/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Client Routes */}
          <Route path="/client" element={<PrivateRoute role="client"><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/client/dashboard" />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="search" element={<SearchFundis />} />
            <Route path="fundi/:id" element={<FundiDetails />} />
            <Route path="book/:fundiId" element={<BookService />} />
            <Route path="bookings" element={<ClientBookings />} />
          </Route>

          {/* Fundi Routes */}
          <Route path="/fundi" element={<PrivateRoute role="fundi"><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/fundi/dashboard" />} />
            <Route path="dashboard" element={<FundiDashboard />} />
            <Route path="profile" element={<FundiProfile />} />
            <Route path="bookings" element={<FundiBookings />} />
            <Route path="earnings" element={<FundiEarnings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute role="admin"><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="fundis" element={<AdminFundis />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App; 