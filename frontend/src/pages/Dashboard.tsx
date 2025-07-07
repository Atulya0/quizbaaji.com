import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI, paymentAPI, websocketService } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Trophy, 
  Clock, 
  Users, 
  Wallet, 
  Star, 
  Play, 
  Calendar,
  Award,
  TrendingUp,
  Shield,
  CreditCard,
  Plus,
  RefreshCw,
  History,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Tournament {
  _id: string;
  name: string;
  description: string;
  category: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  participant_count: number;
  start_time: string;
  end_time: string;
  status: string;
  participants: string[];
}

interface WalletTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    onlineUsers: 0,
    activeTournaments: 0,
    ongoingQuizzes: 0
  });

  useEffect(() => {
    fetchTournaments();
    fetchWalletTransactions();
    
    // Initialize WebSocket connection for real-time updates
    if (user?.id) {
      websocketService.connect(user.id);
      
      // Listen for wallet updates
      websocketService.on('wallet_update', (data: any) => {
        updateUser({ wallet_balance: data.new_balance });
        fetchWalletTransactions(); // Refresh transactions
      });

      // Listen for tournament updates
      websocketService.on('tournament_update', (data: any) => {
        fetchTournaments(); // Refresh tournaments
      });

      // Clean up on unmount
      return () => {
        websocketService.disconnect();
      };
    }
  }, [user?.id]);

  const fetchTournaments = async () => {
    try {
      const response = await tournamentAPI.getAllTournaments();
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletTransactions = async () => {
    try {
      const response = await paymentAPI.getWalletTransactions();
      setWalletTransactions(response.data.slice(0, 10)); // Last 10 transactions
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
    }
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    if (!user) return;

    // Check if user has enough balance
    if (user.wallet_balance < tournament.entry_fee) {
      alert(`Insufficient balance! You need ₹${tournament.entry_fee} but have ₹${user.wallet_balance}. Please add funds to your wallet.`);
      setShowAddFunds(true);
      return;
    }

    setPaymentLoading(tournament._id);

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Create payment intent
      const response = await paymentAPI.createPaymentIntent(tournament._id, tournament.entry_fee);
      const { client_secret, payment_intent_id } = response.data;

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: {
            // Use a test card for demo
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2025,
            cvc: '123',
          },
          billing_details: {
            name: user.name,
            email: user.email,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Confirm payment on backend
      await paymentAPI.confirmPayment(payment_intent_id);
      
      alert('Tournament joined successfully! You can now start the quiz when it begins.');
      fetchTournaments();
      
      // Join tournament room for real-time updates
      websocketService.joinTournamentRoom(tournament._id);
      
    } catch (error: any) {
      console.error('Error joining tournament:', error);
      alert(`Failed to join tournament: ${error.message}`);
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount < 10 || amount > 50000) {
      alert('Please enter a valid amount between ₹10 and ₹50,000');
      return;
    }

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      setPaymentLoading('add_funds');

      // Create payment intent for wallet top-up
      const response = await paymentAPI.addFunds(amount);
      const { client_secret, payment_intent_id } = response.data;

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: {
            // Use a test card for demo
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2025,
            cvc: '123',
          },
          billing_details: {
            name: user?.name,
            email: user?.email,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Confirm wallet top-up on backend
      const confirmResponse = await paymentAPI.confirmWalletTopup(payment_intent_id);
      
      updateUser({ wallet_balance: confirmResponse.data.new_balance });
      setShowAddFunds(false);
      setFundAmount('');
      alert(`₹${amount} added to your wallet successfully!`);
      
    } catch (error: any) {
      console.error('Error adding funds:', error);
      alert(`Failed to add funds: ${error.message}`);
    } finally {
      setPaymentLoading(null);
    }
  };

  const categories = ['all', 'general', 'science', 'history', 'sports', 'entertainment'];

  const filteredTournaments = tournaments.filter(tournament => 
    selectedCategory === 'all' || tournament.category === selectedCategory
  );

  const stats = [
    { 
      label: 'Wallet Balance', 
      value: `₹${user?.wallet_balance?.toFixed(2) || '0.00'}`, 
      icon: <Wallet className="h-6 w-6 text-green-500" />,
      color: 'bg-green-50 border-green-200',
      action: () => setShowAddFunds(true)
    },
    { 
      label: 'Available Tournaments', 
      value: tournaments.filter(t => t.status === 'upcoming').length.toString(), 
      icon: <Trophy className="h-6 w-6 text-yellow-500" />,
      color: 'bg-yellow-50 border-yellow-200'
    },
    { 
      label: 'Online Players', 
      value: realTimeStats.onlineUsers.toString(), 
      icon: <Users className="h-6 w-6 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
    },
    { 
      label: 'Live Quizzes', 
      value: realTimeStats.ongoingQuizzes.toString(), 
      icon: <Play className="h-6 w-6 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">Ready to test your knowledge?</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className={`h-5 w-5 ${user?.kyc_verified ? 'text-green-500' : 'text-yellow-500'}`} />
                <span className="text-sm font-medium">
                  {user?.kyc_verified ? 'KYC Verified' : 'KYC Pending'}
                </span>
              </div>
              <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {user?.role === 'admin' ? 'Admin' : 'Player'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-xl border-2 cursor-pointer hover:shadow-lg transition-shadow ${stat.color}`}
              onClick={stat.action}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.button
            onClick={() => setShowAddFunds(true)}
            className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-8 w-8 mb-2" />
            <h3 className="font-bold text-lg">Add Funds</h3>
            <p className="text-green-100 text-sm">Top up your wallet</p>
          </motion.button>

          <motion.button
            onClick={() => setShowTransactions(true)}
            className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <History className="h-8 w-8 mb-2" />
            <h3 className="font-bold text-lg">Transaction History</h3>
            <p className="text-blue-100 text-sm">View your transactions</p>
          </motion.button>

          <motion.button
            onClick={fetchTournaments}
            className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="h-8 w-8 mb-2" />
            <h3 className="font-bold text-lg">Refresh</h3>
            <p className="text-purple-100 text-sm">Update tournaments</p>
          </motion.button>
        </div>

        {/* Tournaments Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Live Tournaments</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments available</h3>
              <p className="text-gray-500">Check back later for new tournaments!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <motion.div
                  key={tournament._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                      {tournament.category}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{tournament.participant_count}/{tournament.max_participants}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{tournament.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{tournament.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Entry Fee</span>
                      <span className="font-bold text-green-600">₹{tournament.entry_fee}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Prize Pool</span>
                      <span className="font-bold text-yellow-600">₹{tournament.prize_pool}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(tournament.start_time).toLocaleString()}</span>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => handleJoinTournament(tournament)}
                    disabled={paymentLoading === tournament._id}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: paymentLoading === tournament._id ? 1 : 1.05 }}
                    whileTap={{ scale: paymentLoading === tournament._id ? 1 : 0.95 }}
                  >
                    {paymentLoading === tournament._id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span>{paymentLoading === tournament._id ? 'Processing...' : 'Join Tournament'}</span>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold mb-4">Add Funds to Wallet</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Enter amount (min ₹10, max ₹50,000)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="10"
                  max="50000"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-blue-500 mr-2" />
                  <p className="text-sm text-blue-700">
                    Funds will be added instantly after successful payment
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddFunds(false);
                  setFundAmount('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={paymentLoading === 'add_funds'}
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                disabled={paymentLoading === 'add_funds' || !fundAmount}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {paymentLoading === 'add_funds' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                <span>{paymentLoading === 'add_funds' ? 'Processing...' : 'Add Funds'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Transaction History</h3>
              <button
                onClick={() => setShowTransactions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {walletTransactions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              ) : (
                walletTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {transaction.type === 'credit' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;