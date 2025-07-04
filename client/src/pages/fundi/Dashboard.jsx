import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  CalendarDaysIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const FundiDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: {},
    recentBookings: [],
    earnings: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/fundis/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching fundi dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
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
        <p className="text-gray-600">Here's what's happening with your bookings and earnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900">{data?.stats?.total ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-blue-600">{data?.stats?.pending ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{data?.stats?.completed ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-2xl font-bold text-gray-900">
            KES {data?.earnings?.total ? data.earnings.total.toLocaleString() : 0}
          </p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          {/* Could add a link to all bookings */}
        </div>

        {(!data?.recentBookings || data.recentBookings.length === 0) ? (
          <p className="text-gray-500 text-center py-8">No bookings yet</p>
        ) : (
          <div className="space-y-4">
            {data.recentBookings.map((booking) => (
              <div key={booking._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {booking.service.category.charAt(0).toUpperCase() + booking.service.category.slice(1)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      with {booking.client.name}
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
    </div>
  );
};

export default FundiDashboard;
