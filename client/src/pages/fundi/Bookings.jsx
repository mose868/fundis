import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const FundiBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/fundis/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching fundi bookings:', error);
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No bookings found</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {booking.service.category.charAt(0).toUpperCase() + booking.service.category.slice(1)}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Client: {booking.client.name}
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
  );
};

export default FundiBookings;
