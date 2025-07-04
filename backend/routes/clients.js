const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Fundi = require('../models/Fundi');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// @desc    Get client dashboard
// @route   GET /api/clients/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const recentBookings = await Booking.find({ client: req.user._id })
      .populate({
        path: 'fundi',
        populate: { path: 'user', select: 'name phone' }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const bookingStatsAgg = await Booking.aggregate([
      { $match: { client: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert aggregation result to stats object
    const bookingStats = {
      total: 0,
      pending: 0,
      completed: 0,
      totalSpent: 0
    };

    bookingStatsAgg.forEach(stat => {
      bookingStats.total += stat.count;
      if (stat._id === 'pending') bookingStats.pending = stat.count;
      if (stat._id === 'completed') bookingStats.completed = stat.count;
    });

    // Calculate totalSpent
    const totalSpentAgg = await Booking.aggregate([
      { $match: { client: req.user._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    bookingStats.totalSpent = totalSpentAgg[0]?.totalSpent || 0;

    res.json({ recentBookings, stats: bookingStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search fundis
// @route   GET /api/clients/search-fundis
// @access  Private
router.get('/search-fundis', protect, async (req, res) => {
  try {
    const { category, location } = req.query;

    const filter = { isActive: true, verificationStatus: 'verified' };
    
    if (category) {
      filter['services.category'] = category;
    }

    const fundis = await Fundi.find(filter)
      .populate('user', 'name location avatar')
      .sort({ 'rating.average': -1 });

    res.json({ fundis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get fundi details for booking
// @route   GET /api/clients/fundis/:id
// @access  Private
router.get('/fundis/:id', protect, async (req, res) => {
  try {
    const fundi = await Fundi.findById(req.params.id)
      .populate('user', 'name email phone location avatar joinedAt')
      .populate('reviews.client', 'name avatar');

    if (!fundi) {
      return res.status(404).json({ message: 'Fundi not found' });
    }

    // Check if client has booked this fundi before
    const previousBookings = await Booking.countDocuments({
      client: req.user._id,
      fundi: fundi._id,
      status: 'completed'
    });

    // Get availability for next 7 days (simplified)
    const availability = {
      isAvailable: fundi.availability.isAvailable,
      workingDays: fundi.availability.days,
      workingHours: fundi.availability.hours,
      nextAvailableSlots: [] // This would be calculated based on existing bookings
    };

    res.json({
      ...fundi.toObject(),
      previousBookings,
      availability,
      isReturningClient: previousBookings > 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get client's booking history
// @route   GET /api/clients/bookings
// @access  Private
router.get('/bookings', protect, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const filter = { client: req.user._id };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (category && category !== 'all') {
      filter['service.category'] = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name phone avatar location'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get recommended fundis for client
// @route   GET /api/clients/recommendations
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    // Get client's booking history to understand preferences
    const bookingHistory = await Booking.find({ 
      client: req.user._id,
      status: 'completed'
    }).select('service.category fundi');

    // Get most booked categories
    const categoryFrequency = {};
    bookingHistory.forEach(booking => {
      const category = booking.service.category;
      categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Get client location for proximity recommendations
    const clientLocation = req.user.location;

    // Build recommendation query
    const filter = {
      isActive: true,
      verificationStatus: 'verified',
      'rating.average': { $gte: 4.0 }
    };

    if (topCategories.length > 0) {
      filter['services.category'] = { $in: topCategories };
    }

    let recommendations = await Fundi.find(filter)
      .populate('user', 'name location avatar')
      .select('services rating completedJobs')
      .sort({ 'rating.average': -1, completedJobs: -1 })
      .limit(6);

    // Filter by location proximity if client location is available
    if (clientLocation && clientLocation.city) {
      const nearbyFundis = recommendations.filter(fundi =>
        fundi.user.location && 
        fundi.user.location.city?.toLowerCase() === clientLocation.city.toLowerCase()
      );
      
      if (nearbyFundis.length > 0) {
        recommendations = nearbyFundis;
      }
    }

    // Remove previously booked fundis to show variety
    const bookedFundiIds = bookingHistory.map(b => b.fundi.toString());
    const newFundis = recommendations.filter(f => 
      !bookedFundiIds.includes(f._id.toString())
    );

    const finalRecommendations = newFundis.length > 0 ? newFundis : recommendations;

    res.json({
      recommendations: finalRecommendations.slice(0, 4),
      basedOn: {
        topCategories,
        hasLocation: !!clientLocation?.city,
        totalBookings: bookingHistory.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Rate and review a completed booking
// @route   POST /api/clients/bookings/:id/review
// @access  Private
router.post('/bookings/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if already reviewed
    const fundi = await Fundi.findById(booking.fundi);
    const existingReview = fundi.reviews.find(
      review => review.booking.toString() === booking._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'Booking already reviewed' });
    }

    // Add review to fundi
    await fundi.addReview({
      client: req.user._id,
      booking: booking._id,
      rating: parseInt(rating),
      comment
    });

    res.json({ message: 'Review added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get client profile summary
// @route   GET /api/clients/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // Get booking summary
    const bookingSummary = await Booking.aggregate([
      { $match: { client: req.user._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$pricing.totalAmount' },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = bookingSummary[0] || {
      totalBookings: 0,
      totalSpent: 0,
      completedBookings: 0
    };

    // Get most used service categories
    const serviceCategories = await Booking.aggregate([
      { $match: { client: req.user._id, status: 'completed' } },
      {
        $group: {
          _id: '$service.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    res.json({
      user,
      summary,
      favoriteServices: serviceCategories.map(cat => cat._id),
      memberSince: user.joinedAt,
      lastActive: user.lastActive
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 