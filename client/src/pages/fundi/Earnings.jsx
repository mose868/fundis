import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const FundiEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await axios.get('/api/fundis/earnings/summary');
      setEarnings(response.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!earnings) {
    return <div>No earnings data available.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Earnings Summary</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Total Earnings</p>
          <p className="text-2xl font-bold text-gray-900">
            KES {earnings.earnings?.total?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pending Earnings</p>
          <p className="text-2xl font-bold text-yellow-600">
            KES {earnings.earnings?.pending?.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Withdrawn Earnings</p>
          <p className="text-2xl font-bold text-green-600">
            KES {earnings.earnings?.withdrawn?.toLocaleString() ?? 0}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
      <div className="card p-4">
        <p>Status: {earnings.subscription?.isActive ? 'Active' : 'Inactive'}</p>
        <p>Plan: {earnings.subscription?.plan ?? 'N/A'}</p>
        <p>Amount: KES {earnings.subscription?.amount ?? 0}</p>
        <p>Next Payment: {earnings.subscription?.nextPayment ? new Date(earnings.subscription.nextPayment).toLocaleDateString() : 'N/A'}</p>
      </div>
    </div>
  );
};

export default FundiEarnings;
