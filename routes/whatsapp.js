const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const Booking = require('../models/Booking');
const Fundi = require('../models/Fundi');
const User = require('../models/User');

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Service categories for WhatsApp bot
const SERVICE_CATEGORIES = {
  '1': 'plumbing',
  '2': 'electrical',
  '3': 'cleaning',
  '4': 'tutoring',
  '5': 'mechanic',
  '6': 'carpenter',
  '7': 'painting',
  '8': 'gardening',
  '9': 'other'
};

// @desc    Handle incoming WhatsApp messages
// @route   POST /api/whatsapp/webhook
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body, ProfileName } = req.body;
    const phoneNumber = From.replace('whatsapp:', '');
    const message = Body.trim().toLowerCase();

    let response = '';

    if (message === 'hi' || message === 'hello' || message === 'start') {
      response = `🌟 *Welcome to FundiLink!* 🌟\n\nHello ${ProfileName || 'there'}!\n\n*Available Services:*\n1️⃣ Plumbing\n2️⃣ Electrical\n3️⃣ Cleaning\n4️⃣ Tutoring\n5️⃣ Mechanic\n6️⃣ Carpenter\n7️⃣ Painting\n8️⃣ Gardening\n9️⃣ Other\n\n📱 Type a number (1-9) to find fundis`;
    } 
    else if (SERVICE_CATEGORIES[message]) {
      const category = SERVICE_CATEGORIES[message];
      const fundis = await Fundi.find({
        'services.category': category,
        isActive: true,
        verificationStatus: 'verified'
      })
      .populate('user', 'name phone location')
      .limit(5);

      if (fundis.length === 0) {
        response = `😔 No ${category} fundis available right now.`;
      } else {
        response = `🛠️ *${category.toUpperCase()} FUNDIS*\n\n`;
        fundis.forEach((fundi, index) => {
          response += `${index + 1}. *${fundi.user.name}*\n`;
          response += `   📍 ${fundi.user.location?.city || 'Unknown'}\n`;
          response += `   ⭐ ${fundi.rating.average.toFixed(1)}\n`;
          response += `   📱 ${fundi.user.phone}\n\n`;
        });
      }
    }
    else {
      response = "🤔 I didn't understand that. Type 'hi' to see available services.";
    }

    // Send response
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: From,
      body: response
    });

    res.status(200).json({ message: 'Response sent' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// @desc    Send booking notification to fundi
// @route   POST /api/whatsapp/notify-fundi
// @access  Private
router.post('/notify-fundi', async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('client', 'name phone')
      .populate({
        path: 'fundi',
        populate: { path: 'user', select: 'name phone' }
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const message = `🔔 *New Booking Request!*\n\n👤 *Client:* ${booking.client.name}\n🛠️ *Service:* ${booking.service.category}\n📍 *Location:* ${booking.location.address}\n💰 *Amount:* KES ${booking.pricing.totalAmount}`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${booking.fundi.user.phone}`,
      body: message
    });

    res.json({ message: 'Notification sent to fundi' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// @desc    Send booking updates to client
// @route   POST /api/whatsapp/notify-client
// @access  Private
router.post('/notify-client', async (req, res) => {
  try {
    const { bookingId, status, message: customMessage } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('client', 'name phone')
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name phone'
        }
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const clientPhone = booking.client.phone;
    const fundiName = booking.fundi.user.name;
    const service = booking.service.category;

    let statusMessage = '';
    switch (status) {
      case 'accepted':
        statusMessage = `✅ *Booking Accepted!*\n\n🛠️ *Service:* ${service}\n👨‍🔧 *Fundi:* ${fundiName}\n📞 *Contact:* ${booking.fundi.user.phone}\n\nYour fundi will contact you shortly to confirm details.`;
        break;
      case 'in_progress':
        statusMessage = `🚀 *Service Started!*\n\n${fundiName} has started working on your ${service} service.\n\n📞 Contact: ${booking.fundi.user.phone}`;
        break;
      case 'completed':
        statusMessage = `🎉 *Service Completed!*\n\n${fundiName} has completed your ${service} service.\n\n💰 Please confirm completion and rate the service in the app.\n📱 ${process.env.CLIENT_URL}/bookings/${bookingId}`;
        break;
      case 'cancelled':
        statusMessage = `❌ *Booking Cancelled*\n\nYour ${service} booking has been cancelled.\n\n💭 Reason: ${customMessage || 'No reason provided'}\n\n🔄 You can book again anytime!`;
        break;
      default:
        statusMessage = customMessage || `📋 Your ${service} booking status: ${status}`;
    }

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${clientPhone}`,
      body: statusMessage
    });

    res.json({ message: 'Notification sent to client' });
  } catch (error) {
    console.error('Error sending client notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Helper functions
async function findFundisByCategory(category, clientPhone) {
  try {
    const fundis = await Fundi.find({
      'services.category': category,
      isActive: true,
      verificationStatus: 'verified',
      'availability.isAvailable': true
    })
    .populate('user', 'name phone location')
    .select('services rating completedJobs')
    .sort({ 'rating.average': -1 })
    .limit(5);

    return fundis;
  } catch (error) {
    console.error('Error finding fundis:', error);
    return [];
  }
}

async function searchFundis(searchTerm) {
  try {
    const fundis = await Fundi.find({
      $or: [
        { 'services.category': { $regex: searchTerm, $options: 'i' } },
        { 'services.description': { $regex: searchTerm, $options: 'i' } },
        { skills: { $regex: searchTerm, $options: 'i' } }
      ],
      isActive: true,
      verificationStatus: 'verified'
    })
    .populate('user', 'name phone location')
    .select('services rating completedJobs')
    .limit(5);

    return fundis;
  } catch (error) {
    console.error('Error searching fundis:', error);
    return [];
  }
}

async function getUserBookings(userId) {
  try {
    const bookings = await Booking.find({ client: userId })
      .populate({
        path: 'fundi',
        populate: {
          path: 'user',
          select: 'name phone'
        }
      })
      .select('service status pricing createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    return bookings;
  } catch (error) {
    console.error('Error getting user bookings:', error);
    return [];
  }
}

function formatFundisResponse(category, fundis) {
  if (fundis.length === 0) {
    return `😔 No ${category} fundis available right now.\n\nTry:\n• Searching in nearby areas\n• Checking again later\n• Typing 'help' for assistance`;
  }

  let response = `🛠️ *${category.toUpperCase()} FUNDIS* 🛠️\n\n`;
  
  fundis.forEach((fundi, index) => {
    const service = fundi.services.find(s => s.category === category);
    const rating = fundi.rating.average > 0 ? `⭐ ${fundi.rating.average.toFixed(1)}` : '⭐ New';
    const location = fundi.user.location ? 
      `${fundi.user.location.area || fundi.user.location.city || 'Unknown'}` : 'Unknown';
    
    response += `${index + 1}. *${fundi.user.name}*\n`;
    response += `   📍 ${location}\n`;
    response += `   ${rating} (${fundi.completedJobs} jobs)\n`;
    response += `   💰 KES ${service?.basePrice || 'N/A'}/${service?.priceUnit || 'hour'}\n`;
    response += `   📱 Book: type "book ${fundi._id}"\n\n`;
  });

  response += `💡 *Tip:* Type "book [fundi-id]" to request a service`;
  return response;
}

function formatSearchResponse(searchTerm, fundis) {
  if (fundis.length === 0) {
    return `🔍 No results for "${searchTerm}"\n\nTry:\n• Different keywords\n• General service categories (1-9)\n• Type 'hi' to see all services`;
  }

  let response = `🔍 *Search Results for "${searchTerm}"*\n\n`;
  
  fundis.forEach((fundi, index) => {
    const rating = fundi.rating.average > 0 ? `⭐ ${fundi.rating.average.toFixed(1)}` : '⭐ New';
    const services = fundi.services.map(s => s.category).join(', ');
    
    response += `${index + 1}. *${fundi.user.name}*\n`;
    response += `   🛠️ ${services}\n`;
    response += `   ${rating} (${fundi.completedJobs} jobs)\n`;
    response += `   📱 Book: type "book ${fundi._id}"\n\n`;
  });

  return response;
}

function formatBookingsResponse(bookings) {
  if (bookings.length === 0) {
    return `📋 *No bookings found*\n\nStart by choosing a service:\nType 'hi' to see available services`;
  }

  let response = `📋 *Your Recent Bookings*\n\n`;
  
  bookings.forEach((booking, index) => {
    const statusEmoji = getStatusEmoji(booking.status);
    const date = new Date(booking.createdAt).toLocaleDateString();
    
    response += `${index + 1}. ${statusEmoji} *${booking.service.category}*\n`;
    response += `   👨‍🔧 ${booking.fundi.user.name}\n`;
    response += `   💰 KES ${booking.pricing.totalAmount}\n`;
    response += `   📅 ${date}\n\n`;
  });

  response += `📱 View full details: ${process.env.CLIENT_URL}/bookings`;
  return response;
}

function getStatusEmoji(status) {
  const emojis = {
    pending: '⏳',
    accepted: '✅',
    in_progress: '🚀',
    completed: '🎉',
    cancelled: '❌',
    disputed: '⚠️'
  };
  return emojis[status] || '📋';
}

async function handleBookingRequest(phoneNumber, fundiId, clientName) {
  try {
    // Find or create user
    let user = await User.findOne({ phone: phoneNumber });
    if (!user) {
      // Create temporary user for WhatsApp booking
      user = await User.create({
        name: clientName || 'WhatsApp User',
        email: `${phoneNumber}@whatsapp.temp`,
        phone: phoneNumber,
        password: 'temporary123',
        role: 'client'
      });
    }

    const fundi = await Fundi.findById(fundiId).populate('user', 'name');
    if (!fundi) {
      return "❌ Fundi not found. Please check the ID and try again.";
    }

    return `📋 *Booking Request*\n\n👨‍🔧 *Fundi:* ${fundi.user.name}\n\n🔄 To complete your booking, please:\n\n1️⃣ Visit: ${process.env.CLIENT_URL}/book/${fundiId}\n2️⃣ Provide service details\n3️⃣ Choose date & time\n4️⃣ Add your location\n5️⃣ Make payment\n\n💬 Or call us: +254700000000\n\n⚡ Quick book: Reply with your location and preferred date/time`;
  } catch (error) {
    console.error('Error handling booking request:', error);
    return "❌ Sorry, there was an error processing your booking request. Please try again or contact support.";
  }
}

module.exports = router; 