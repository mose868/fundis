const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fundi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fundi',
    required: true
  },
  service: {
    category: {
      type: String,
      required: true,
      enum: ['plumbing', 'electrical', 'cleaning', 'tutoring', 'mechanic', 'carpenter', 'painting', 'gardening', 'other']
    },
    description: {
      type: String,
      required: true
    },
    estimatedDuration: {
      type: Number, // in hours
      required: true
    }
  },
  scheduling: {
    preferredDate: {
      type: Date,
      required: true
    },
    preferredTime: {
      type: String,
      required: true
    },
    actualStartTime: Date,
    actualEndTime: Date,
    isFlexible: {
      type: Boolean,
      default: false
    }
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    additionalInfo: String
  },
  pricing: {
    baseAmount: {
      type: Number,
      required: true
    },
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    platformCommission: {
      type: Number,
      default: 0
    },
    fundiEarnings: {
      type: Number,
      default: 0
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['mpesa', 'cash'],
      default: 'mpesa'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date,
    mpesaReceiptNumber: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  communication: {
    clientPhone: String,
    fundiPhone: String,
    preferredMethod: {
      type: String,
      enum: ['whatsapp', 'call', 'sms'],
      default: 'whatsapp'
    }
  },
  notes: {
    clientNotes: String,
    fundiNotes: String,
    adminNotes: String
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  completion: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    clientConfirmation: {
      type: Boolean,
      default: false
    },
    fundiConfirmation: {
      type: Boolean,
      default: false
    },
    photos: [String],
    feedback: String
  },
  whatsappId: String, // For tracking WhatsApp conversations
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Update booking status and add to timeline
BookingSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    note: note,
    updatedBy: updatedBy
  });
  return this.save();
};

// Calculate commission and fundi earnings
BookingSchema.methods.calculateEarnings = function() {
  const commissionRate = process.env.PLATFORM_COMMISSION || 0.05;
  this.pricing.platformCommission = this.pricing.totalAmount * commissionRate;
  this.pricing.fundiEarnings = this.pricing.totalAmount - this.pricing.platformCommission;
  return this.save();
};

// Mark as completed
BookingSchema.methods.markCompleted = function(completionData) {
  this.completion.isCompleted = true;
  this.completion.completedAt = new Date();
  this.completion.photos = completionData.photos || [];
  this.completion.feedback = completionData.feedback || '';
  this.status = 'completed';
  
  this.timeline.push({
    status: 'completed',
    note: 'Job marked as completed',
    timestamp: new Date()
  });
  
  return this.save();
};

module.exports = mongoose.model('Booking', BookingSchema); 