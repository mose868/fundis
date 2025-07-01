const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Fundi = require('../models/Fundi');
const Booking = require('../models/Booking');
const { protect, admin } = require('../middleware/auth');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFundis = await User.countDocuments({ role: 'fundi' });
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });

    const revenueData = await Booking.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.totalAmount' },
          platformCommission: { $sum: '$pricing.platformCommission' }
        }
      }
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, platformCommission: 0 };

    res.json({
      users: { total: totalUsers, fundis: totalFundis },
      bookings: { total: totalBookings, completed: completedBookings },
      revenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all fundis for admin management
// @route   GET /api/admin/fundis
// @access  Private (Admin)
router.get('/fundis', protect, admin, async (req, res) => {
  try {
    const fundis = await Fundi.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(fundis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Verify/reject fundi
// @route   PUT /api/admin/fundis/:id/verify
// @access  Private (Admin)
router.put('/fundis/:id/verify', protect, admin, async (req, res) => {
  try {
    const { status } = req.body; // 'verified' | 'rejected'

    const fundi = await Fundi.findById(req.params.id);
    if (!fundi) {
      return res.status(404).json({ message: 'Fundi not found' });
    }

    fundi.verificationStatus = status;
    await fundi.save();

    res.json({ message: `Fundi ${status} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all bookings for admin
// @route   GET /api/admin/bookings
// @access  Private (Admin)
router.get('/bookings', protect, admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('client', 'name phone location')
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name phone'
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

// @desc    Update booking status (admin override)
// @route   PUT /api/admin/bookings/:id/status
// @access  Private (Admin)
router.put('/bookings/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, note } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.updateStatus(status, note || 'Updated by admin', req.user._id);

    const updatedBooking = await Booking.findById(booking._id)
      .populate('client', 'name phone')
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name phone'
        }
      });

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get platform settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
router.get('/settings', protect, admin, async (req, res) => {
  try {
    const settings = {
      platformCommission: parseFloat(process.env.PLATFORM_COMMISSION || 0.05),
      weeklySubscriptionFee: parseFloat(process.env.WEEKLY_SUBSCRIPTION_FEE || 100),
      mpesaEnvironment: process.env.MPESA_ENVIRONMENT || 'sandbox',
      features: {
        whatsappBot: true,
        mpesaPayments: true,
        autoVerification: false,
        subscriptionReminders: true
      }
    };

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
router.put('/settings', protect, admin, async (req, res) => {
  try {
    const { platformCommission, weeklySubscriptionFee, features } = req.body;

    // In a real app, you'd save these to a database
    // For now, we'll just return success
    
    res.json({ 
      message: 'Settings updated successfully',
      settings: {
        platformCommission,
        weeklySubscriptionFee,
        features
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user details for admin
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let userDetails = { ...user.toObject() };

    // If user is a fundi, get fundi profile
    if (user.role === 'fundi') {
      const fundiProfile = await Fundi.findOne({ user: user._id })
        .populate('reviews.client', 'name');
      userDetails.fundiProfile = fundiProfile;
    }

    // Get user's bookings
    const bookings = await Booking.find({
      $or: [
        { client: user._id },
        ...(user.role === 'fundi' && userDetails.fundiProfile ? 
          [{ fundi: userDetails.fundiProfile._id }] : [])
      ]
    }).sort({ createdAt: -1 }).limit(10);

    userDetails.recentBookings = bookings;

    res.json(userDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Suspend/activate user
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
router.put('/users/:id/status', protect, admin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    // If user is a fundi, update fundi profile too
    if (user.role === 'fundi') {
      await Fundi.updateOne({ user: user._id }, { isActive });
    }

    res.json({ 
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 