const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/Booking');
const Fundi = require('../models/Fundi');
const { protect, fundi } = require('../middleware/auth');

// M-Pesa configuration
const MPESA_BASE_URL = process.env.MPESA_ENVIRONMENT === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

// Generate M-Pesa access token
const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error generating M-Pesa access token:', error);
    throw new Error('Failed to generate access token');
  }
};

// @desc    Initiate STK push for booking payment
// @route   POST /api/payments/stk-push
// @access  Private
router.post('/stk-push', protect, async (req, res) => {
  try {
    const { bookingId, phoneNumber } = req.body;

    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user owns this booking
    if (booking.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already paid
    if (booking.payment.status === 'paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    const accessToken = await generateAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${process.env.MPESA_SHORT_CODE}${process.env.MPESA_PASS_KEY}${timestamp}`
    ).toString('base64');

    const stkPushPayload = {
      BusinessShortCode: process.env.MPESA_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(booking.pricing.totalAmount),
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORT_CODE,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.CLIENT_URL}/api/payments/callback`,
      AccountReference: `FundiLink-${bookingId}`,
      TransactionDesc: `Payment for ${booking.service.category} service`
    };

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update booking with transaction details
    booking.payment.transactionId = response.data.CheckoutRequestID;
    await booking.save();

    res.json({
      message: 'STK push initiated successfully',
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID
    });
  } catch (error) {
    console.error('STK Push error:', error);
    res.status(500).json({ 
      message: 'Payment initiation failed', 
      error: error.response?.data || error.message 
    });
  }
});

// @desc    M-Pesa callback endpoint
// @route   POST /api/payments/callback
// @access  Public
router.post('/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    
    if (Body && Body.stkCallback) {
      const { ResultCode, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;
      
      // Find booking by transaction ID
      const booking = await Booking.findOne({ 
        'payment.transactionId': CheckoutRequestID 
      });

      if (booking) {
        if (ResultCode === 0) {
          // Payment successful
          const metadata = CallbackMetadata.Item;
          const receiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
          
          booking.payment.status = 'paid';
          booking.payment.paidAt = new Date();
          booking.payment.mpesaReceiptNumber = receiptNumber;
          
          // Update booking status
          await booking.updateStatus('accepted', 'Payment received', null);
          
          // Update fundi earnings
          const fundi = await Fundi.findById(booking.fundi);
          if (fundi) {
            fundi.earnings.pending += booking.pricing.fundiEarnings;
            await fundi.save();
          }
        } else {
          // Payment failed
          booking.payment.status = 'failed';
        }
        
        await booking.save();
      }
    }

    res.json({ message: 'Callback received' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

// @desc    Check payment status
// @route   GET /api/payments/status/:bookingId
// @access  Private
router.get('/status/:bookingId', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user has access to this booking
    const fundiProfile = req.user.role === 'fundi' ? 
      await Fundi.findOne({ user: req.user._id }) : null;

    const hasAccess = 
      req.user.role === 'admin' ||
      booking.client.toString() === req.user._id.toString() ||
      (fundiProfile && booking.fundi.toString() === fundiProfile._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      paymentStatus: booking.payment.status,
      transactionId: booking.payment.transactionId,
      paidAt: booking.payment.paidAt,
      amount: booking.pricing.totalAmount,
      receiptNumber: booking.payment.mpesaReceiptNumber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Process fundi subscription payment
// @route   POST /api/payments/subscription
// @access  Private (Fundi)
router.post('/subscription', protect, fundi, async (req, res) => {
  try {
    const { phoneNumber, plan = 'basic' } = req.body;

    const fundiProfile = await Fundi.findOne({ user: req.user._id });
    if (!fundiProfile) {
      return res.status(404).json({ message: 'Fundi profile not found' });
    }

    // Determine subscription amount based on plan
    const subscriptionAmounts = {
      basic: 100,
      premium: 200
    };

    const amount = subscriptionAmounts[plan] || 100;
    const accessToken = await generateAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${process.env.MPESA_SHORT_CODE}${process.env.MPESA_PASS_KEY}${timestamp}`
    ).toString('base64');

    const stkPushPayload = {
      BusinessShortCode: process.env.MPESA_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORT_CODE,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.CLIENT_URL}/api/payments/subscription-callback`,
      AccountReference: `Sub-${fundiProfile._id}`,
      TransactionDesc: `FundiLink ${plan} subscription`
    };

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      message: 'Subscription payment initiated',
      checkoutRequestId: response.data.CheckoutRequestID
    });
  } catch (error) {
    console.error('Subscription payment error:', error);
    res.status(500).json({ message: 'Subscription payment failed' });
  }
});

// @desc    Subscription payment callback
// @route   POST /api/payments/subscription-callback
// @access  Public
router.post('/subscription-callback', async (req, res) => {
  try {
    const { Body } = req.body;
    
    if (Body && Body.stkCallback) {
      const { ResultCode, CallbackMetadata } = Body.stkCallback;
      
      if (ResultCode === 0) {
        const metadata = CallbackMetadata.Item;
        const accountRef = metadata.find(item => item.Name === 'AccountReference')?.Value;
        const fundiId = accountRef.split('-')[1];
        
        const fundi = await Fundi.findById(fundiId);
        if (fundi) {
          await fundi.updateSubscription({
            amount: metadata.find(item => item.Name === 'Amount')?.Value
          });
        }
      }
    }

    res.json({ message: 'Subscription callback received' });
  } catch (error) {
    console.error('Subscription callback error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
router.get('/history', protect, async (req, res) => {
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

    const payments = await Booking.find(filter)
      .select('service pricing payment createdAt')
      .populate('client', 'name')
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 