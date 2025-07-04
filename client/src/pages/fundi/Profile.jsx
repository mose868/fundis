import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const FundiProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    businessName: '',
    services: [],
    experience: 0,
    skills: [],
    portfolio: [],
    availability: {
      days: [],
      hours: { start: '08:00', end: '17:00' },
      isAvailable: true
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/fundis/profile/me');
      setProfile(response.data);
      setFormData({
        businessName: response.data.businessName || '',
        services: response.data.services || [],
        experience: response.data.experience || 0,
        skills: response.data.skills || [],
        portfolio: response.data.portfolio || [],
        availability: response.data.availability || {
          days: [],
          hours: { start: '08:00', end: '17:00' },
          isAvailable: true
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/fundis/profile', formData);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Fundi Profile</h1>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Business Name</label>
        <input
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          className="input w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Experience (years)</label>
        <input
          type="number"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          className="input w-full"
          min={0}
        />
      </div>
      {/* Additional fields for services, skills, portfolio, availability can be added here */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
};

export default FundiProfile;
