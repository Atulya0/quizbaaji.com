import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, statsAPI, websocketService } from '../services/api';
import {
  Users,
  FileQuestion,
  Trophy,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  BarChart3,
  Calendar,
  Bell,
  Activity
} from 'lucide-react';

interface DashboardStats {
  total_users: number;
  active_tournaments: number;
  total_questions: number;
  ongoing_quizzes: number;
  online_users: number;
  total_revenue: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  wallet_balance: number;
  kyc_verified: boolean;
  created_at: string;
  tournaments_joined?: number;
  total_spent?: number;
}

interface Question {
  _id: string;
  category: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
  created_at: string;
}

interface Tournament {
  _id: string;
  name: string;
  category: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  total_participants: number;
  total_revenue: number;
  status: string;
  start_time: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeNotifications, setRealtimeNotifications] = useState<any[]>([]);

  // Modals state
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  useEffect(() => {
    // Verify admin access
    if (user?.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }

    fetchAllData();

    // Setup WebSocket for real-time updates
    if (user?.id) {
      websocketService.connect(user.id);
      
      // Listen for admin-specific events
      websocketService.on('kyc_submission', handleKYCSubmission);
      websocketService.on('security_violation', handleSecurityViolation);
      websocketService.on('new_user_registration', handleNewUser);
      websocketService.on('tournament_join', handleTournamentJoin);

      // Periodic stats refresh
      const statsInterval = setInterval(fetchStats, 30000); // Every 30 seconds

      return () => {
        clearInterval(statsInterval);
        websocketService.disconnect();
      };
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchQuestions(),
        fetchTournaments()
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [dashboardStats, realtimeStats] = await Promise.all([
        adminAPI.getDashboardStats(),
        statsAPI.getRealtimeStats()
      ]);
      setStats({ ...dashboardStats.data, ...realtimeStats.data });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUserReports();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await adminAPI.getQuestions();
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchTournaments = async () => {
    try {
      const response = await adminAPI.getTournamentReports();
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  };

  // Real-time event handlers
  const handleKYCSubmission = (data: any) => {
    addNotification('KYC', `New KYC submission from ${data.user_name}`, 'info');
    fetchUsers(); // Refresh users list
  };

  const handleSecurityViolation = (data: any) => {
    addNotification('Security', `Security violation: ${data.violation_type} by ${data.user_email}`, 'warning');
  };

  const handleNewUser = (data: any) => {
    addNotification('User', `New user registered: ${data.user_name}`, 'success');
    fetchUsers();
    fetchStats();
  };

  const handleTournamentJoin = (data: any) => {
    addNotification('Tournament', `User joined tournament: ${data.tournament_name}`, 'info');
    fetchTournaments();
    fetchStats();
  };

  const addNotification = (type: string, message: string, severity: 'info' | 'warning' | 'success' | 'error') => {
    const notification = {
      id: Date.now(),
      type,
      message,
      severity,
      timestamp: new Date().toISOString()
    };
    setRealtimeNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setRealtimeNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const handleKYCApproval = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      await adminAPI.updateUserKYC(userId, status);
      fetchUsers();
      addNotification('KYC', `KYC ${status} for user`, 'success');
    } catch (error) {
      console.error('Error updating KYC:', error);
      addNotification('KYC', 'Failed to update KYC status', 'error');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await adminAPI.deleteQuestion(questionId);
        fetchQuestions();
        addNotification('Question', 'Question deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting question:', error);
        addNotification('Question', 'Failed to delete question', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabContent = {
    overview: (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[
            { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'blue' },
            { label: 'Active Tournaments', value: stats?.active_tournaments || 0, icon: Trophy, color: 'yellow' },
            { label: 'Total Questions', value: stats?.total_questions || 0, icon: FileQuestion, color: 'green' },
            { label: 'Online Users', value: stats?.online_users || 0, icon: Activity, color: 'red' },
            { label: 'Ongoing Quizzes', value: stats?.ongoing_quizzes || 0, icon: Clock, color: 'purple' },
            { label: 'Total Revenue', value: `₹${stats?.total_revenue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'emerald' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-xl p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium text-${stat.color}-600`}>{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 text-${stat.color}-500`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Recent Users</h3>
            <div className="space-y-3">
              {users.slice(0, 5).map(user => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.kyc_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {user.kyc_verified ? 'Verified' : 'Pending'}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Live Notifications</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {realtimeNotifications.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent notifications</p>
              ) : (
                realtimeNotifications.map(notification => (
                  <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                    notification.severity === 'info' ? 'bg-blue-50 border-blue-400' :
                    notification.severity === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    notification.severity === 'success' ? 'bg-green-50 border-green-400' :
                    'bg-red-50 border-red-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{notification.type}</p>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    ),

    users: (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold">User Management</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Wallet Balance</th>
                  <th className="text-left py-3 px-4">KYC Status</th>
                  <th className="text-left py-3 px-4">Tournaments</th>
                  <th className="text-left py-3 px-4">Total Spent</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">₹{user.wallet_balance.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.kyc_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.kyc_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user.tournaments_joined || 0}</td>
                    <td className="py-3 px-4">₹{user.total_spent?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {!user.kyc_verified && (
                          <>
                            <button
                              onClick={() => handleKYCApproval(user._id, 'verified')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleKYCApproval(user._id, 'rejected')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),

    questions: (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold">Question Management</h3>
          <button
            onClick={() => setShowCreateQuestion(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map(question => (
              <div key={question._id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {question.category}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {question.difficulty}
                  </span>
                </div>
                <p className="font-medium text-sm mb-2 line-clamp-2">{question.question_text}</p>
                <div className="space-y-1">
                  {question.options.map((option, index) => (
                    <div key={index} className={`text-xs p-2 rounded ${
                      index === question.correct_answer ? 'bg-green-100 text-green-700' : 'bg-gray-50'
                    }`}>
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2 mt-3">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    tournaments: (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold">Tournament Management</h3>
          <button
            onClick={() => setShowCreateTournament(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Tournament</span>
          </button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Tournament</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Entry Fee</th>
                  <th className="text-left py-3 px-4">Participants</th>
                  <th className="text-left py-3 px-4">Revenue</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map(tournament => (
                  <tr key={tournament._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{tournament.name}</p>
                        <p className="text-sm text-gray-500">{new Date(tournament.start_time).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{tournament.category}</td>
                    <td className="py-3 px-4">₹{tournament.entry_fee}</td>
                    <td className="py-3 px-4">{tournament.total_participants || 0}/{tournament.max_participants}</td>
                    <td className="py-3 px-4">₹{tournament.total_revenue?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tournament.status === 'active' ? 'bg-green-100 text-green-700' :
                        tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tournament.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-700">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your QuizBaaji platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">{stats?.online_users || 0} online</span>
              </div>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">{realtimeNotifications.length} notifications</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'questions', label: 'Questions', icon: FileQuestion },
            { id: 'tournaments', label: 'Tournaments', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tabContent[activeTab as keyof typeof tabContent]}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wallet Balance</label>
                  <p className="text-gray-900">₹{selectedUser.wallet_balance.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">KYC Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedUser.kyc_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedUser.kyc_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <p className="text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tournaments Joined</label>
                  <p className="text-gray-900">{selectedUser.tournaments_joined || 0}</p>
                </div>
              </div>
              {!selectedUser.kyc_verified && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleKYCApproval(selectedUser._id, 'verified');
                      setShowUserDetails(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve KYC</span>
                  </button>
                  <button
                    onClick={() => {
                      handleKYCApproval(selectedUser._id, 'rejected');
                      setShowUserDetails(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject KYC</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;