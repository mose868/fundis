import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UserIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = {
    client: [
      { name: 'Dashboard', href: '/client/dashboard', icon: HomeIcon },
      { name: 'Find Fundis', href: '/client/search', icon: MagnifyingGlassIcon },
      { name: 'My Bookings', href: '/client/bookings', icon: CalendarDaysIcon },
      { name: 'Profile', href: '/client/profile', icon: UserIcon },
    ],
    fundi: [
      { name: 'Dashboard', href: '/fundi/dashboard', icon: HomeIcon },
      { name: 'Bookings', href: '/fundi/bookings', icon: CalendarDaysIcon },
      { name: 'Profile', href: '/fundi/profile', icon: UserIcon },
      { name: 'Earnings', href: '/fundi/earnings', icon: CurrencyDollarIcon },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
      { name: 'Fundis', href: '/admin/fundis', icon: UsersIcon },
      { name: 'Bookings', href: '/admin/bookings', icon: CalendarDaysIcon },
      { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
    ],
  };

  const currentNavigation = navigation[user?.role || 'client'];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-primary-600">FundiLink</h2>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>
          <nav className="flex-1 p-4">
            {currentNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-2 mb-2 rounded-md transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-primary-600">FundiLink</h2>
        </div>
        <nav className="flex-1 p-4">
          {currentNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-2 mb-2 rounded-md transition-colors ${
                location.pathname === item.href
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
          <button onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">FundiLink</h1>
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-primary-600" />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 