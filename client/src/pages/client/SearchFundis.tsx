import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface Fundi {
  _id: string;
  user: {
    name: string;
    location: {
      city: string;
      area: string;
    };
    avatar: string;
  };
  services: Array<{
    category: string;
    basePrice: number;
    priceUnit: string;
  }>;
  rating: {
    average: number;
    count: number;
  };
  completedJobs: number;
  availability: {
    isAvailable: boolean;
  };
}

const SearchFundis: React.FC = () => {
  const [fundis, setFundis] = useState<Fundi[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    minRating: '',
    maxPrice: '',
    sortBy: 'rating'
  });
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'tutoring', label: 'Tutoring' },
    { value: 'mechanic', label: 'Mechanic' },
    { value: 'carpenter', label: 'Carpenter' },
    { value: 'painting', label: 'Painting' },
    { value: 'gardening', label: 'Gardening' }
  ];

  useEffect(() => {
    searchFundis();
  }, [filters]);

  const searchFundis = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`/api/clients/search-fundis?${params}`);
      setFundis(response.data.fundis);
    } catch (error) {
      console.error('Error searching fundis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Find a Fundi</h1>
        <p className="text-gray-600">Browse verified service providers in your area</p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by location..."
                className="input pl-10"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
          </div>
          <select
            className="input md:w-48"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Minimum Rating</label>
              <select
                className="input"
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
            <div>
              <label className="label">Max Price (per hour)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 1000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Sort By</label>
              <select
                className="input"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Price</option>
                <option value="experience">Most Experience</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : fundis.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No fundis found matching your criteria</p>
          <button
            onClick={() => setFilters({
              category: '',
              location: '',
              minRating: '',
              maxPrice: '',
              sortBy: 'rating'
            })}
            className="btn-outline mt-4"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundis.map((fundi) => (
            <div key={fundi._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-lg">
                      {fundi.user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{fundi.user.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {fundi.user.location?.city || 'Unknown'}, {fundi.user.location?.area || ''}
                    </div>
                  </div>
                </div>
                {fundi.availability.isAvailable && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Available
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="ml-1 font-medium">{fundi.rating.average.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    ({fundi.rating.count} reviews)
                  </span>
                  <span className="text-sm text-gray-500 ml-4">
                    {fundi.completedJobs} jobs
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Services</h4>
                <div className="space-y-1">
                  {fundi.services.slice(0, 3).map((service, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">
                        {service.category.replace('_', ' ')}
                      </span>
                      <span className="text-gray-900 font-medium">
                        KES {service.basePrice}/{service.priceUnit.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  {fundi.services.length > 3 && (
                    <p className="text-sm text-gray-500">
                      +{fundi.services.length - 3} more services
                    </p>
                  )}
                </div>
              </div>

              <Link
                to={`/client/fundi/${fundi._id}`}
                className="btn-primary w-full text-center"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchFundis; 