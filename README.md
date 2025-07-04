# FundiLink 🛠️

A mobile-first platform connecting clients to trusted local freelancers (fundis) like electricians, plumbers, cleaners, and tutors. The platform supports easy booking via WhatsApp and web, in-app M-Pesa payments, rating systems, and fundi visibility tools.

## 🚀 Features

### For Clients
- Book services through WhatsApp Bot or web app
- Search by category, location, or rating
- View fundi profiles (rates, reviews, photos)
- Pay via M-Pesa STK Push / Paybill
- Receive job updates via WhatsApp

### For Fundis
- Sign up via mobile or WhatsApp
- Create profile: services, pricing, availability
- Accept/decline jobs via WhatsApp
- Receive direct M-Pesa payments
- Pay weekly subscription (KES 50–200)
- Dashboard to manage jobs, reviews, and income

### For Admin
- Approve or verify fundis
- Monitor bookings, complaints, and fundi performance
- View analytics (earnings, job count, active users)
- Configure commission %, subscription fees, and promotions

## 💻 Tech Stack

- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose
- **WhatsApp Integration**: Twilio API
- **Payments**: M-Pesa Daraja API
- **Authentication**: JWT

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Twilio Account (for WhatsApp)
- M-Pesa Daraja API credentials

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fundilink.git
cd fundilink
```

2. Install backend dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/fundilink

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_ENVIRONMENT=sandbox
MPESA_PASS_KEY=your_mpesa_pass_key
MPESA_SHORT_CODE=174379

# Application Settings
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## 🚀 Running the Application

### Development Mode

1. Start MongoDB:
```bash
mongod
```

2. Start the backend server:
```bash
npm run dev
```

3. In a new terminal, start the frontend:
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Build

1. Build the frontend:
```bash
cd client
npm run build
```

2. Start the production server:
```bash
NODE_ENV=production npm start
```

## 📱 WhatsApp Bot Commands

- **hi/hello** - Start conversation and see services menu
- **1-9** - Select service category
- **search [service]** - Search for specific services
- **bookings** - View your bookings
- **book [fundi-id]** - Book a specific fundi
- **help** - Get help and support

## 💰 Payment Integration

### M-Pesa Setup

1. Register for Daraja API at https://developer.safaricom.co.ke/
2. Get your Consumer Key and Consumer Secret
3. Set up callback URLs for payment notifications
4. Configure environment variables

### Testing Payments

In sandbox environment, use test credentials:
- Test phone: 254708374149
- Test amount: Any amount
- PIN: Any 4-digit number

## 🔒 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Fundis
- `GET /api/fundis` - Get all fundis
- `GET /api/fundis/:id` - Get fundi details
- `PUT /api/fundis/profile` - Update fundi profile
- `POST /api/fundis/services` - Add service

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id/status` - Update booking status

### Payments
- `POST /api/payments/stk-push` - Initiate M-Pesa payment
- `GET /api/payments/status/:bookingId` - Check payment status

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Users
- **Client**: client@test.com / password123
- **Fundi**: fundi@test.com / password123
- **Admin**: admin@fundilink.com / admin123

## 📈 Deployment

### Deploy to Render/Railway

1. Create a new web service
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Deploy to Vercel (Frontend)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd client
vercel
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contributors
- Vanessa Williams (https://github.com/nessa360)
- Brian Kuria Mwangi (https://github.com/briankush)
- Juanita Achieng (https://github.com/Juana-tech)
- Victor (https://github.com/Vannexs)
- Moses Kimani (https://github.com/mose868)
- Mosa Mabina (https://github.com/MosaMabina)
- Vicky Blessings (https://github.com/Vicky-Blessing)

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

- Email: support@fundilink.com
- Phone: +254 700 000 000
- WhatsApp: +254 700 000 000

## 🎯 Roadmap

- [ ] AI-powered fundi matching
- [ ] Video consultations
- [ ] Multi-language support
- [ ] iOS/Android mobile apps
- [ ] Advanced analytics dashboard
- [ ] Automated quality assurance 