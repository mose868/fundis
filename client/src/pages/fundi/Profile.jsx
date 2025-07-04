import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const serviceCategories = [
  'plumbing',
  'electrical',
  'cleaning',
  'tutoring',
  'mechanic',
  'carpenter',
  'painting',
  'gardening',
  'other'
];

const FundiProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    category: '',
    description: '',
    basePrice: '',
    priceUnit: 'per_hour'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/fundis/profile/me');
        setProfile(response.data);
        setServices(response.data.services || []);
      } catch (err) {
        setError('Failed to load profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({ ...prev, [name]: value }));
  };

  const addService = async () => {
    if (!newService.category || !newService.basePrice) {
      setError('Category and base price are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await axios.post('/api/fundis/services', {
        category: newService.category,
        description: newService.description,
        basePrice: parseFloat(newService.basePrice),
        priceUnit: newService.priceUnit
      });
      setServices(prev => [...prev, response.data.service]);
      setNewService({
        category: '',
        description: '',
        basePrice: '',
        priceUnit: 'per_hour'
      });
      setSuccess('Service added successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add service.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const removeService = (index) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.put('/api/fundis/profile', { services });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <h2 className="text-xl font-semibold mb-2">Services Offered</h2>
      {services.length === 0 ? (
        <p>No services added yet.</p>
      ) : (
        <ul className="mb-4">
          {services.map((service, index) => (
            <li key={index} className="mb-2 flex justify-between items-center border p-2 rounded">
              <div>
                <strong>{service.category}</strong>: {service.description || 'No description'} - KES {service.basePrice} {service.priceUnit === 'per_hour' ? '/ hour' : service.priceUnit === 'per_job' ? '/ job' : '/ day'}
              </div>
              <button
                onClick={() => removeService(index)}
                className="text-red-600 hover:text-red-800"
                disabled={saving}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-4 border p-4 rounded">
        <h3 className="font-semibold mb-2">Add New Service</h3>
        <div className="mb-2">
          <label className="block mb-1">Category</label>
          <select
            name="category"
            value={newService.category}
            onChange={handleNewServiceChange}
            className="input w-full"
          >
            <option value="">Select category</option>
            {serviceCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block mb-1">Description</label>
          <input
            type="text"
            name="description"
            value={newService.description}
            onChange={handleNewServiceChange}
            className="input w-full"
            placeholder="Optional description"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Base Price (KES)</label>
          <input
            type="number"
            name="basePrice"
            value={newService.basePrice}
            onChange={handleNewServiceChange}
            className="input w-full"
            min="0"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Price Unit</label>
          <select
            name="priceUnit"
            value={newService.priceUnit}
            onChange={handleNewServiceChange}
            className="input w-full"
          >
            <option value="per_hour">Per Hour</option>
            <option value="per_job">Per Job</option>
            <option value="per_day">Per Day</option>
          </select>
        </div>
        <button
          onClick={addService}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Adding...' : 'Add Service'}
        </button>
      </div>

      <button
        onClick={saveProfile}
        disabled={saving}
        className="btn-primary"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}
      {success && <p className="text-green-600 mt-4">{success}</p>}
    </div>
  );
};

export default FundiProfile;
