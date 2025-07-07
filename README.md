# QuizBaaji - Quiz Tournament Platform

QuizBaaji is a comprehensive quiz tournament platform where users can compete in real-time quiz competitions, win prizes, and test their knowledge across various categories.

## 🚀 Features

### Core Features
- **Real-time Quiz Tournaments** - 30 questions in 5 minutes with live timers
- **Multiple Categories** - General Knowledge, Science, History, Sports, Entertainment
- **Payment Integration** - ₹39 entry fee via Stripe
- **Prize Distribution** - Real money rewards for top performers
- **Anti-cheat System** - Advanced security measures
- **KYC Verification** - Secure withdrawals with identity verification

### User Features
- **Google OAuth Authentication** - Quick and secure login
- **Real-time Wallet** - Live balance updates
- **Tournament Dashboard** - View and join active tournaments
- **Performance Analytics** - Track your quiz performance
- **Mobile Responsive** - Works on all devices

### Admin Features
- **Question Management** - Add, edit, and categorize questions
- **Tournament Creation** - Set up new tournaments
- **User Management** - View user statistics and KYC status
- **Analytics Dashboard** - Revenue and participation reports

## 🛠️ Technology Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **MongoDB** - NoSQL database for scalability
- **Supabase** - Real-time features and authentication
- **Stripe** - Payment processing
- **WebSocket** - Real-time communication
- **JWT** - Secure authentication

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Vite** - Fast build tool

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd quizbaaji
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup
```bash
cd frontend
yarn install
cp ../.env.example .env
# Edit .env with your configuration
```

### 4. Database Setup
```bash
# Start MongoDB
mongod

# The application will automatically create collections and sample data
```

### 5. Run the Application
```bash
# Terminal 1 - Backend
cd backend
python server.py

# Terminal 2 - Frontend
cd frontend
yarn dev
```

## ⚙️ Configuration

### Required API Keys

1. **Google OAuth**
   - Go to [Google Console](https://console.developers.google.com/)
   - Create OAuth 2.0 credentials
   - Add to `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

2. **Stripe Payment**
   - Get keys from [Stripe Dashboard](https://dashboard.stripe.com/)
   - Add test keys for development

3. **MongoDB**
   - Local: `mongodb://localhost:27017/quizbaaji`
   - Atlas: Get connection string from MongoDB Atlas

### Environment Variables

Copy `.env.example` to both `backend/.env` and `frontend/.env` and configure:

```env
# Essential configuration
GOOGLE_CLIENT_ID=your_google_client_id
STRIPE_SECRET_KEY=sk_test_your_stripe_key
MONGO_URL=mongodb://localhost:27017/quizbaaji
```

## 🎮 How to Play

1. **Sign Up** - Use Google account to register
2. **Browse Tournaments** - View available quiz tournaments
3. **Pay Entry Fee** - ₹39 via Stripe payment
4. **Take Quiz** - Answer 30 questions in 5 minutes
5. **Win Prizes** - Top 3 players win real money
6. **Withdraw** - Complete KYC to withdraw winnings

## 🏆 Prize Distribution

- **1st Place**: 50% of prize pool
- **2nd Place**: 30% of prize pool  
- **3rd Place**: 20% of prize pool

## 🔒 Security Features

- **Anti-cheat System** - Tab switching detection, copy/paste blocking
- **Random Questions** - Each user gets different question order
- **Secure Payments** - PCI-compliant Stripe integration
- **KYC Verification** - Identity verification for withdrawals
- **JWT Authentication** - Secure user sessions

## 👨‍💼 Admin Panel

Access admin panel at `/admin` with admin credentials:
- **Email**: admin@quizbaaji.com
- **Password**: admin123

### Admin Features
- Create and manage questions
- Set up tournaments
- View user analytics
- Approve KYC verifications
- Monitor system performance

## 🚀 Deployment

### Using Supervisor
```bash
# Install supervisor
sudo apt-get install supervisor

# Copy supervisor config
sudo cp supervisord.conf /etc/supervisor/conf.d/quizbaaji.conf

# Start services
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

### Environment Setup
1. Set production environment variables
2. Use production database URLs
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates
5. Configure domain and CORS

## 📊 API Documentation

Once running, visit:
- **API Docs**: http://localhost:8001/docs
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For support, email admin@quizbaaji.com or create an issue in the repository.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- FastAPI for the high-performance backend
- Stripe for secure payment processing
- MongoDB for scalable database solution