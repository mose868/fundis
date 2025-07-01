const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Fundi = require('../models/Fundi');
const User = require('../models/User');
const { protect, fundi } = require('../middleware/auth');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      fundiId,
      service,
      scheduling,
      location,
      pricing,
      communication,
      notes,
      isUrgent
    } = req.body;

    // Verify fundi exists and is available
    const selectedFundi = await Fundi.findById(fundiId);
    if (!selectedFundi) {
      return res.status(404).json({ message: 'Fundi not found' });
    }

    if (!selectedFundi.availability.isAvailable) {
      return res.status(400).json({ message: 'Fundi is not available' });
    }

    // Create booking
    const booking = new Booking({
      client: req.user._id,
      fundi: fundiId,
      service,
      scheduling,
      location,
      pricing,
      communication,
      notes: { clientNotes: notes },
      isUrgent: isUrgent || false
    });

    // Calculate commission and earnings
    await booking.calculateEarnings();

    // Add initial timeline entry
    booking.timeline.push({
      status: 'pending',
      note: 'Booking created',
      updatedBy: req.user._id
    });

    const savedBooking = await booking.save();

    // Populate booking details
    const populatedBooking = await Booking.findById(savedBooking._id)
      .populate('client', 'name phone location')
      .populate('fundi', 'user services rating')
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name phone location'
        }
      });

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter based on user role
    let filter = {};
    if (req.user.role === 'client') {
      filter.client = req.user._id;
    } else if (req.user.role === 'fundi') {
      const fundiProfile = await Fundi.findOne({ user: req.user._id });
      if (fundiProfile) {
        filter.fundi = fundiProfile._id;
      }
    }

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('client', 'name phone location avatar')
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name phone location avatar'
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

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('client', 'name phone location avatar')
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name phone location avatar'
        }
      })
      .populate('timeline.updatedBy', 'name role');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    const fundiProfile = req.user.role === 'fundi' ? 
      await Fundi.findOne({ user: req.user._id }) : null;

    const hasAccess = 
      req.user.role === 'admin' ||
      booking.client.toString() === req.user._id.toString() ||
      (fundiProfile && booking.fundi.toString() === fundiProfile._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, note } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check permissions based on status and user role
    const fundiProfile = req.user.role === 'fundi' ? 
      await Fundi.findOne({ user: req.user._id }) : null;

    let canUpdate = false;

    if (req.user.role === 'admin') {
      canUpdate = true;
    } else if (req.user.role === 'fundi' && fundiProfile && 
               booking.fundi.toString() === fundiProfile._id.toString()) {
      canUpdate = ['accepted', 'in_progress', 'completed'].includes(status);
    } else if (booking.client.toString() === req.user._id.toString()) {
      canUpdate = ['cancelled'].includes(status);
    }

    if (!canUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this status' });
    }

    // Update booking status
    await booking.updateStatus(status, note, req.user._id);

    // Handle specific status updates
    if (status === 'accepted' && fundiProfile) {
      // Fundi accepted the booking
      booking.communication.fundiPhone = req.user.phone;
    } else if (status === 'completed') {
      // Mark booking as completed
      booking.completion.fundiConfirmation = true;
      if (req.user.role !== 'fundi') {
        booking.completion.clientConfirmation = true;
      }
      
      // Update fundi's completed jobs count
      if (fundiProfile) {
        fundiProfile.completedJobs += 1;
        fundiProfile.earnings.pending += booking.pricing.fundiEarnings;
        await fundiProfile.save();
      }
    }

    await booking.save();

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

// @desc    Add completion details
// @route   PUT /api/bookings/:id/complete
// @access  Private (Fundi)
router.put('/:id/complete', protect, fundi, async (req, res) => {
  try {
    const { photos, feedback, actualEndTime } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify fundi owns this booking
    const fundiProfile = await Fundi.findOne({ user: req.user._id });
    if (!fundiProfile || booking.fundi.toString() !== fundiProfile._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as completed
    await booking.markCompleted({ photos, feedback });
    
    if (actualEndTime) {
      booking.scheduling.actualEndTime = new Date(actualEndTime);
    }

    await booking.save();

    res.json({ message: 'Booking marked as completed', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add review for completed booking
// @route   POST /api/bookings/:id/review
// @access  Private (Client)
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify client owns this booking
    if (booking.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Add review to fundi
    const fundi = await Fundi.findById(booking.fundi);
    if (fundi) {
      await fundi.addReview({
        client: req.user._id,
        booking: booking._id,
        rating,
        comment
      });
    }

    res.json({ message: 'Review added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats/summary
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === 'client') {
      filter.client = req.user._id;
    } else if (req.user.role === 'fundi') {
      const fundiProfile = await Fundi.findOne({ user: req.user._id });
      if (fundiProfile) {
        filter.fundi = fundiProfile._id;
      }
    }

    const stats = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    const summary = {
      total: 0,
      pending: 0,
      accepted: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      totalEarnings: 0
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
      summary.total += stat.count;
      if (stat._id === 'completed') {
        summary.totalEarnings = stat.totalAmount;
      }
    });

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 