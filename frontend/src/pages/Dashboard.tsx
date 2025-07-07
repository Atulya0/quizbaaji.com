import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { tournamentAPI } from '../services/api';
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
  Shield
} from 'lucide-react';

interface Tournament {
  _id: string;
  name: string;
  description: string;
  category: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  status: string;
  participants: string[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchTournaments();
  }, []);

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

  const handleJoinTournament = async (tournamentId: string) => {
    try {
      const response = await tournamentAPI.joinTournament(tournamentId);
      // Handle payment flow here
      alert('Tournament joined successfully!');
      fetchTournaments();
    } catch (error) {
      console.error('Error joining tournament:', error);
      alert('Failed to join tournament. Please try again.');
    }
  };

  const categories = ['all', 'general', 'science', 'history', 'sports', 'entertainment'];

  const filteredTournaments = tournaments.filter(tournament => 
    selectedCategory === 'all' || tournament.category === selectedCategory
  );

  const stats = [
    { 
      label: 'Wallet Balance', 
      value: `₹${user?.wallet_balance || 0}`, 
      icon: <Wallet className="h-6 w-6 text-green-500" />,
      color: 'bg-green-50 border-green-200'
    },
    { 
      label: 'Tournaments Joined', 
      value: '0', 
      icon: <Trophy className="h-6 w-6 text-yellow-500" />,
      color: 'bg-yellow-50 border-yellow-200'
    },
    { 
      label: 'Total Wins', 
      value: '0', 
      icon: <Award className="h-6 w-6 text-purple-500" />,
      color: 'bg-purple-50 border-purple-200'
    },
    { 
      label: 'Win Rate', 
      value: '0%', 
      icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
      color: 'bg-blue-50 border-blue-200'
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
              className={`p-6 rounded-xl border-2 ${stat.color}`}
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
                      <span>{tournament.participants.length}/{tournament.max_participants}</span>
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
                    onClick={() => handleJoinTournament(tournament._id)}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="h-4 w-4" />
                    <span>Join Tournament</span>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Funds</h3>
                <p className="text-gray-600 text-sm">Top up your wallet to join tournaments</p>
              </div>
            </div>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
              Add Money
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Complete KYC</h3>
                <p className="text-gray-600 text-sm">Verify your identity to withdraw winnings</p>
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {user?.kyc_verified ? 'KYC Verified' : 'Complete KYC'}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;