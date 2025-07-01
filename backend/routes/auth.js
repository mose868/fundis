const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Fundi = require('../models/Fundi');
const { protect, generateToken } = require('../middleware/auth');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or phone number'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'client',
      location
    });

    // If user is a fundi, create fundi profile
    if (user.role === 'fundi') {
      await Fundi.create({
        user: user._id,
        services: [],
        availability: {
          days: [],
          hours: { start: '08:00', end: '17:00' }
        }
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Update last active
      await user.updateLastActive();

      const token = generateToken(user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, location, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;
      user.location = location || user.location;
      user.avatar = avatar || user.avatar;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        location: updatedUser.location,
        avatar: updatedUser.avatar
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (user && (await user.comparePassword(currentPassword))) {
      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(400).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 