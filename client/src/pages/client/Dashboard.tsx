import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  StarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  stats: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    totalSpent: number;
  };
  recentBookings: any[];
  favoriteFundis: any[];
}

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/clients/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'accepted':
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Here's what's happening with your bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900">{data?.stats.total || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-blue-600">{data?.stats.pending || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{data?.stats.completed || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">
            KES {data?.stats.totalSpent?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/client/search" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <MagnifyingGlassIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">Find a Fundi</h3>
              <p className="text-sm text-gray-500">Browse available service providers</p>
            </div>
          </div>
        </Link>

        <Link to="/client/bookings" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-secondary-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <div className="ml-4">
              <h3 className="font-semibold text-gray-900">My Bookings</h3>
              <p className="text-sm text-gray-500">View and manage your bookings</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          <Link to="/client/bookings" className="text-sm text-primary-600 hover:text-primary-700">
            View all →
          </Link>
        </div>

        {data?.recentBookings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No bookings yet</p>
        ) : (
          <div className="space-y-4">
            {data?.recentBookings.map((booking) => (
              <div key={booking._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {booking.service.category.charAt(0).toUpperCase() + booking.service.category.slice(1)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      with {booking.fundi.user.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(booking.scheduling.preferredDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(booking.status)}
                    <span className="ml-2 text-sm text-gray-600 capitalize">
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Fundis */}
      {data?.favoriteFundis.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Top Fundis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.favoriteFundis.map((fundi) => (
              <div key={fundi._id} className="border rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {fundi.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{fundi.user.name}</h4>
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-500 ml-1">
                        {fundi.rating.average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {fundi.bookingCount} bookings • KES {fundi.totalSpent.toLocaleString()} spent
                </p>
                <Link
                  to={`/client/fundi/${fundi._id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                >
                  Book again →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard; 