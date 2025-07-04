import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const FundiDetails = () => {
  const { id } = useParams();
  const [fundi, setFundi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking form state
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [schedulingDate, setSchedulingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  useEffect(() => {
    const fetchFundi = async () => {
      try {
        const response = await axios.get(`/api/clients/fundis/${id}`);
        setFundi(response.data);
      } catch (err) {
        setError('Failed to load fundi details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFundi();
  }, [id]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(null);

    if (!serviceCategory || !schedulingDate) {
      setBookingError('Please select service category and scheduling date.');
      setBookingLoading(false);
      return;
    }

    try {
      const bookingData = {
        fundiId: id,
        service: {
          category: serviceCategory,
          description: serviceDescription,
          basePrice: parseFloat(servicePrice) || 0,
          priceUnit: 'per_hour'
        },
        scheduling: {
          preferredDate: schedulingDate
        },
        location: fundi.user.location,
        pricing: {
          totalAmount: parseFloat(servicePrice) || 0,
          fundiEarnings: parseFloat(servicePrice) || 0,
          platformCommission: 0
        },
        communication: {},
        notes,
        isUrgent: false
      };

      await axios.post('/api/bookings', bookingData);
      setBookingSuccess('Booking created successfully!');
      // Reset form
      setServiceCategory('');
      setServiceDescription('');
      setServicePrice('');
      setSchedulingDate('');
      setNotes('');
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to create booking.');
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div>Loading fundi details...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!fundi) {
    return <div>No fundi details found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{fundi.user.name}</h1>
      <p className="mb-2">Email: {fundi.user.email}</p>
      <p className="mb-2">Phone: {fundi.user.phone}</p>
      <p className="mb-2">Location: {fundi.user.location?.county}, {fundi.user.location?.city}</p>
      <p className="mb-4">Rating: {fundi.rating?.average?.toFixed(1) ?? 'N/A'} ({fundi.rating?.count ?? 0} reviews)</p>

      <h2 className="text-2xl font-semibold mb-2">Services Offered</h2>
      {fundi.services.length === 0 ? (
        <p>No services listed.</p>
      ) : (
        <ul className="mb-4 list-disc list-inside">
          {fundi.services.map((service, index) => (
            <li key={index}>
              <strong>{service.category}</strong>: {service.description || 'No description'} - KES {service.basePrice} {service.priceUnit === 'per_hour' ? '/ hour' : service.priceUnit === 'per_job' ? '/ job' : '/ day'}
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-2xl font-semibold mb-2">Book this Fundi</h2>
      <form onSubmit={handleBookingSubmit} className="mb-6 space-y-4 max-w-md">
        <div>
          <label className="block font-semibold mb-1">Service Category</label>
          <select
            value={serviceCategory}
            onChange={(e) => setServiceCategory(e.target.value)}
            className="input w-full"
            required
          >
            <option value="">Select a service</option>
            {fundi.services.map((service, idx) => (
              <option key={idx} value={service.category}>
                {service.category} - KES {service.basePrice}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Service Description (optional)</label>
          <input
            type="text"
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            className="input w-full"
            placeholder="Additional details"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Price (KES)</label>
          <input
            type="number"
            value={servicePrice}
            onChange={(e) => setServicePrice(e.target.value)}
            className="input w-full"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Preferred Date</label>
          <input
            type="date"
            value={schedulingDate}
            onChange={(e) => setSchedulingDate(e.target.value)}
            className="input w-full"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full"
            rows="3"
            placeholder="Any additional information"
          />
        </div>

        {bookingError && <p className="text-red-600">{bookingError}</p>}
        {bookingSuccess && <p className="text-green-600">{bookingSuccess}</p>}

        <button
          type="submit"
          disabled={bookingLoading}
          className="btn-primary"
        >
          {bookingLoading ? 'Booking...' : 'Book Now'}
        </button>
      </form>
    </div>
  );
};

export default FundiDetails;
