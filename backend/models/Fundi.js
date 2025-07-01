const mongoose = require('mongoose');

const FundiSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    trim: true
  },
  services: [{
    category: {
      type: String,
      required: true,
      enum: ['plumbing', 'electrical', 'cleaning', 'tutoring', 'mechanic', 'carpenter', 'painting', 'gardening', 'other']
    },
    description: String,
    basePrice: {
      type: Number,
      required: true
    },
    priceUnit: {
      type: String,
      enum: ['per_hour', 'per_job', 'per_day'],
      default: 'per_hour'
    }
  }],
  experience: {
    type: Number,
    default: 0
  },
  skills: [{
    type: String,
    trim: true
  }],
  portfolio: [{
    title: String,
    description: String,
    images: [String],
    completedAt: Date
  }],
  availability: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    hours: {
      start: String,
      end: String
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  documents: {
    idCard: String,
    certificate: String,
    license: String
  },
  subscription: {
    isActive: {
      type: Boolean,
      default: false
    },
    plan: {
      type: String,
      enum: ['basic', 'premium'],
      default: 'basic'
    },
    amount: {
      type: Number,
      default: 100
    },
    lastPayment: Date,
    nextPayment: Date
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    withdrawn: {
      type: Number,
      default: 0
    }
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate and update average rating
FundiSchema.methods.calculateRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }

  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
};

// Add review
FundiSchema.methods.addReview = function(reviewData) {
  this.reviews.push(reviewData);
  this.calculateRating();
  return this.save();
};

// Update subscription status
FundiSchema.methods.updateSubscription = function(paymentData) {
  this.subscription.isActive = true;
  this.subscription.lastPayment = new Date();
  this.subscription.nextPayment = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  this.subscription.amount = paymentData.amount;
  return this.save();
};

module.exports = mongoose.model('Fundi', FundiSchema); 