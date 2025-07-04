import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminFundis = () => {
  const [fundis, setFundis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchFundis();
  }, []);

  const fetchFundis = async () => {
    try {
      const response = await axios.get('/api/admin/fundis');
      setFundis(response.data);
    } catch (error) {
      console.error('Error fetching fundis:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVerification = async (id, status) => {
    setUpdatingId(id);
    try {
      await axios.put(`/api/admin/fundis/${id}/verify`, { status });
      setFundis(prev =>
        prev.map(fundi =>
          fundi._id === id ? { ...fundi, verificationStatus: status } : fundi
        )
      );
    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Failed to update verification status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div>Loading fundis...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Fundis</h1>
      {fundis.length === 0 ? (
        <p>No fundis found.</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-left">Email</th>
              <th className="border px-4 py-2 text-left">Phone</th>
              <th className="border px-4 py-2 text-left">Verification Status</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fundis.map(fundi => (
              <tr key={fundi._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{fundi.user.name}</td>
                <td className="border px-4 py-2">{fundi.user.email}</td>
                <td className="border px-4 py-2">{fundi.user.phone}</td>
                <td className="border px-4 py-2 capitalize">{fundi.verificationStatus}</td>
                <td className="border px-4 py-2">
                  {fundi.verificationStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => updateVerification(fundi._id, 'verified')}
                        disabled={updatingId === fundi._id}
                        className="mr-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateVerification(fundi._id, 'rejected')}
                        disabled={updatingId === fundi._id}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {fundi.verificationStatus !== 'pending' && (
                    <span className="text-gray-600">No actions available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminFundis;
