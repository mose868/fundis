const express = require('express');
const router = express.Router();
const Fundi = require('../models/Fundi');
const User = require('../models/User');
const { protect, fundi } = require('../middleware/auth');

// @desc    Get all fundis with filters
// @route   GET /api/fundis
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      location,
      minRating,
      maxPrice,
      available,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = { isActive: true, verificationStatus: 'verified' };

    if (category) {
      filter['services.category'] = category;
    }

    if (minRating) {
      filter['rating.average'] = { $gte: parseFloat(minRating) };
    }

    if (available === 'true') {
      filter['availability.isAvailable'] = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const fundis = await Fundi.find(filter)
      .populate('user', 'name email phone location avatar')
      .select('-reviews -documents')
      .sort({ 'rating.average': -1, completedJobs: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by location if specified
    let filteredFundis = fundis;
    if (location) {
      filteredFundis = fundis.filter(fundi => 
        fundi.user.location && 
        (fundi.user.location.city?.toLowerCase().includes(location.toLowerCase()) ||
         fundi.user.location.county?.toLowerCase().includes(location.toLowerCase()) ||
         fundi.user.location.area?.toLowerCase().includes(location.toLowerCase()))
      );
    }

    // Filter by max price if specified
    if (maxPrice) {
      filteredFundis = filteredFundis.filter(fundi =>
        fundi.services.some(service => service.basePrice <= parseFloat(maxPrice))
      );
    }

    const total = await Fundi.countDocuments(filter);

    res.json({
      fundis: filteredFundis,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total: filteredFundis.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get fundi by ID
// @route   GET /api/fundis/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const fundi = await Fundi.findById(req.params.id)
      .populate('user', 'name email phone location avatar joinedAt')
      .populate('reviews.client', 'name avatar');

    if (!fundi) {
      return res.status(404).json({ message: 'Fundi not found' });
    }

    res.json(fundi);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get current fundi profile
// @route   GET /api/fundis/profile/me
// @access  Private (Fundi)
router.get('/profile/me', protect, fundi, async (req, res) => {
  try {
    const fundi = await Fundi.findOne({ user: req.user._id })
      .populate('user', 'name email phone location avatar');

    if (!fundi) {
      return res.status(404).json({ message: 'Fundi profile not found' });
    }

    res.json(fundi);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update fundi profile
// @route   PUT /api/fundis/profile
// @access  Private (Fundi)
router.put('/profile', protect, fundi, async (req, res) => {
  try {
    const {
      businessName,
      services,
      experience,
      skills,
      portfolio,
      availability
    } = req.body;

    const fundi = await Fundi.findOne({ user: req.user._id });

    if (!fundi) {
      return res.status(404).json({ message: 'Fundi profile not found' });
    }

    // Update fields
    if (businessName !== undefined) fundi.businessName = businessName;
    if (services !== undefined) fundi.services = services;
    if (experience !== undefined) fundi.experience = experience;
    if (skills !== undefined) fundi.skills = skills;
    if (portfolio !== undefined) fundi.portfolio = portfolio;
    if (availability !== undefined) fundi.availability = availability;

    const updatedFundi = await fundi.save();

    res.json(updatedFundi);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add service to fundi profile
// @route   POST /api/fundis/services
// @access  Private (Fundi)
router.post('/services', protect, fundi, async (req, res) => {
  try {
    const { category, description, basePrice, priceUnit } = req.body;

    const fundi = await Fundi.findOne({ user: req.user._id });

    if (!fundi) {
      return res.status(404).json({ message: 'Fundi profile not found' });
    }

    const newService = {
      category,
      description,
      basePrice,
      priceUnit: priceUnit || 'per_hour'
    };

    fundi.services.push(newService);
    await fundi.save();

    res.status(201).json({ message: 'Service added successfully', service: newService });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update availability
// @route   PUT /api/fundis/availability
// @access  Private (Fundi)
router.put('/availability', protect, fundi, async (req, res) => {
  try {
    const { days, hours, isAvailable } = req.body;

    const fundi = await Fundi.findOne({ user: req.user._id });

    if (!fundi) {
      return res.status(404).json({ message: 'Fundi profile not found' });
    }

    if (days !== undefined) fundi.availability.days = days;
    if (hours !== undefined) fundi.availability.hours = hours;
    if (isAvailable !== undefined) fundi.availability.isAvailable = isAvailable;

    await fundi.save();

    res.json({ message: 'Availability updated successfully', availability: fundi.availability });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get fundi earnings
// @route   GET /api/fundis/earnings
// @access  Private (Fundi)
router.get('/earnings/summary', protect, fundi, async (req, res) => {
  try {
    const fundi = await Fundi.findOne({ user: req.user._id });

    if (!fundi) {
      return res.status(404).json({ message: 'Fundi profile not found' });
    }

    // Get subscription status
    const subscriptionStatus = {
      isActive: fundi.subscription.isActive,
      nextPayment: fundi.subscription.nextPayment,
      amount: fundi.subscription.amount
    };

    res.json({
      earnings: fundi.earnings,
      completedJobs: fundi.completedJobs,
      rating: fundi.rating,
      subscription: subscriptionStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search fundis by category and location
// @route   GET /api/fundis/search
// @access  Public
router.get('/search/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { location, rating } = req.query;

    const filter = {
      isActive: true,
      verificationStatus: 'verified',
      'services.category': category
    };

    if (rating) {
      filter['rating.average'] = { $gte: parseFloat(rating) };
    }

    const fundis = await Fundi.find(filter)
      .populate('user', 'name phone location avatar')
      .select('services rating completedJobs availability')
      .sort({ 'rating.average': -1 });

    // Filter by location if specified
    let results = fundis;
    if (location) {
      results = fundis.filter(fundi => 
        fundi.user.location && 
        (fundi.user.location.city?.toLowerCase().includes(location.toLowerCase()) ||
         fundi.user.location.county?.toLowerCase().includes(location.toLowerCase()))
      );
    }

    res.json({ fundis: results, count: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 