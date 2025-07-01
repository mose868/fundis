import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  WrenchScrewdriverIcon,
  BoltIcon,
  HomeIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  SparklesIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { user } = useAuth();

  const services = [
    { name: 'Plumbing', icon: WrenchScrewdriverIcon, color: 'bg-blue-100 text-blue-600' },
    { name: 'Electrical', icon: BoltIcon, color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Cleaning', icon: SparklesIcon, color: 'bg-green-100 text-green-600' },
    { name: 'Tutoring', icon: AcademicCapIcon, color: 'bg-purple-100 text-purple-600' },
    { name: 'Carpentry', icon: HomeIcon, color: 'bg-orange-100 text-orange-600' },
    { name: 'Painting', icon: PaintBrushIcon, color: 'bg-pink-100 text-pink-600' },
  ];

  const features = [
    'Verified and trusted service providers',
    'Secure M-Pesa payments',
    'Real-time WhatsApp notifications',
    'Rating and review system',
    'Easy booking process',
    'Competitive pricing'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-primary-600">FundiLink</h1>
            <nav>
              {user ? (
                <Link to={`/${user.role}/dashboard`} className="btn-primary">
                  Go to Dashboard
                </Link>
              ) : (
                <div className="space-x-4">
                  <Link to="/login" className="btn-outline">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Find Trusted Local Service Providers
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with verified fundis for all your home and personal service needs. 
            Book easily, pay securely with M-Pesa, and get quality service guaranteed.
          </p>
          <div className="space-x-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Find a Fundi
            </Link>
            <Link to="/register?role=fundi" className="btn-outline text-lg px-8 py-3">
              Become a Fundi
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {services.map((service) => (
              <div key={service.name} className="text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${service.color} mb-4`}>
                  <service.icon className="h-10 w-10" />
                </div>
                <h3 className="font-medium text-gray-900">{service.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose FundiLink?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of happy customers and verified service providers.
          </p>
          <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2025 FundiLink. All rights reserved.</p>
          <p className="mt-2">
            <a href="tel:+254700000000" className="hover:text-white">+254 700 000 000</a> | 
            <a href="mailto:support@fundilink.com" className="hover:text-white ml-2">support@fundilink.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home; 