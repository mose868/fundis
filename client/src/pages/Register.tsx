import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'client' | 'fundi';
  location: {
    county: string;
    city: string;
    area: string;
  };
}

const Register: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultRole = searchParams.get('role') as 'client' | 'fundi' || 'client';
  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
      navigate(`/${data.role}/dashboard`);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="flex justify-center">
            <h1 className="text-3xl font-bold text-primary-600">FundiLink</h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Role Selection */}
          <div>
            <label className="label">I want to:</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  {...register('role', { required: 'Please select a role' })}
                  type="radio"
                  value="client"
                  defaultChecked={defaultRole === 'client'}
                  className="sr-only peer"
                />
                <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50">
                  <p className="font-medium">Find Services</p>
                  <p className="text-sm text-gray-500">Book fundis for your needs</p>
                </div>
              </label>
              <label className="relative">
                <input
                  {...register('role')}
                  type="radio"
                  value="fundi"
                  defaultChecked={defaultRole === 'fundi'}
                  className="sr-only peer"
                />
                <div className="p-4 border-2 rounded-lg cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50">
                  <p className="font-medium">Offer Services</p>
                  <p className="text-sm text-gray-500">Join as a service provider</p>
                </div>
              </label>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="input"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="input"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^(\+254|0)[1-9]\d{8}$/,
                    message: 'Enter a valid Kenyan phone number'
                  }
                })}
                type="tel"
                className="input"
                placeholder="+254712345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Location</h3>
            
            <div>
              <label className="label">County</label>
              <select
                {...register('location.county', { required: 'County is required' })}
                className="input"
              >
                <option value="">Select County</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Kisumu">Kisumu</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Eldoret">Eldoret</option>
              </select>
              {errors.location?.county && (
                <p className="mt-1 text-sm text-red-600">{errors.location.county.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City/Town</label>
                <input
                  {...register('location.city', { required: 'City is required' })}
                  type="text"
                  className="input"
                  placeholder="Westlands"
                />
                {errors.location?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
                )}
              </div>

              <div>
                <label className="label">Area</label>
                <input
                  {...register('location.area')}
                  type="text"
                  className="input"
                  placeholder="Sarit Centre"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <div className="relative">
              <label className="label">Password</label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              I agree to the{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </a>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 