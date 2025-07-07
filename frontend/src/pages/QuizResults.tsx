import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Clock, 
  Target, 
  TrendingUp, 
  Star,
  CheckCircle,
  XCircle,
  Award,
  DollarSign,
  Home,
  RotateCcw,
  Share2,
  Download
} from 'lucide-react';
import { quizAPI, tournamentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface QuizResults {
  session_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  rank?: number;
  prize_amount: number;
  tournament_name: string;
  time_taken: number;
  total_time_taken_questions: number;
  status: string;
  question_stats: QuestionStat[];
  security_violations: SecurityViolation[];
}

interface QuestionStat {
  question_index: number;
  question_text: string;
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
  time_taken: number;
  explanation: string;
}

interface SecurityViolation {
  type: string;
  timestamp: string;
}

interface LeaderboardEntry {
  rank: number;
  score: number;
  user_name: string;
  user_avatar?: string;
  prize_amount: number;
}

const QuizResults: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [results, setResults] = useState<QuizResults | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchResults();
    }
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const response = await quizAPI.getQuizResults(sessionId!);
      setResults(response.data);
      
      // If user won a prize, show celebration and update wallet balance
      if (response.data.prize_amount > 0) {
        setShowCelebration(true);
        // Update user's wallet balance in context
        if (user) {
          updateUser({ 
            wallet_balance: (user.wallet_balance || 0) + response.data.prize_amount 
          });
        }
      }
      
      // Fetch tournament leaderboard if we have tournament info
      // For now, we'll create a mock leaderboard
      // In a real app, you'd extract tournament_id and fetch actual leaderboard
      
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      alert('Failed to load quiz results');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Outstanding! 🎉';
    if (percentage >= 80) return 'Excellent! 👏';
    if (percentage >= 70) return 'Great Job! 👍';
    if (percentage >= 60) return 'Good Work! 😊';
    if (percentage >= 50) return 'Not Bad! 🙂';
    return 'Keep Practicing! 💪';
  };

  const getRankDisplay = (rank?: number) => {
    if (!rank) return null;
    
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-500" />;
    return <Award className="h-6 w-6 text-blue-500" />;
  };

  const shareResults = () => {
    const text = `I just scored ${results?.score}/${results?.total_questions} (${results?.percentage.toFixed(1)}%) in ${results?.tournament_name} on QuizBaaji! 🎯`;
    
    if (navigator.share) {
      navigator.share({
        title: 'QuizBaaji Results',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 flex items-center justify-center text-white text-center">
        <div>
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
          <p className="text-gray-300 mb-4">We couldn't load your quiz results.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 text-white">
      {/* Celebration Animation */}
      {showCelebration && results.prize_amount > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-8 rounded-2xl text-center shadow-2xl"
          >
            <Trophy className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Congratulations! 🎉</h2>
            <p className="text-xl mb-4">You won ₹{results.prize_amount}!</p>
            <p className="text-lg mb-6">Your prize has been added to your wallet.</p>
            <button
              onClick={() => setShowCelebration(false)}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              Awesome!
            </button>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm p-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center space-x-4 mb-4"
          >
            {getRankDisplay(results.rank)}
            <h1 className="text-4xl font-bold">Quiz Results</h1>
            {getRankDisplay(results.rank)}
          </motion.div>
          <p className="text-xl text-gray-300">{results.tournament_name}</p>
          <p className={`text-2xl font-bold mt-2 ${getPerformanceColor(results.percentage)}`}>
            {getPerformanceMessage(results.percentage)}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-400" />
            <p className="text-3xl font-bold">{results.score}</p>
            <p className="text-sm text-gray-300">Correct Answers</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p className="text-3xl font-bold">{results.percentage.toFixed(1)}%</p>
            <p className="text-sm text-gray-300">Accuracy</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-3xl font-bold">{Math.round(results.time_taken / 60)}m</p>
            <p className="text-sm text-gray-300">Total Time</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            {results.rank ? (
              <>
                <Star className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                <p className="text-3xl font-bold">#{results.rank}</p>
                <p className="text-sm text-gray-300">Rank</p>
              </>
            ) : (
              <>
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p className="text-3xl font-bold">₹{results.prize_amount}</p>
                <p className="text-sm text-gray-300">Prize Won</p>
              </>
            )}
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/10 backdrop-blur-sm rounded-lg p-1">
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'questions', label: 'Question Review' },
            { id: 'leaderboard', label: 'Leaderboard' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-900' 
                  : 'text-white hover:text-gray-300 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
          >
            <h3 className="text-2xl font-bold mb-6">Performance Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score Breakdown */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Score Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Correct Answers:</span>
                    <span className="font-bold text-green-400">{results.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incorrect Answers:</span>
                    <span className="font-bold text-red-400">{results.total_questions - results.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Questions:</span>
                    <span className="font-bold">{results.total_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className={`font-bold ${getPerformanceColor(results.percentage)}`}>
                      {results.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Analysis */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Time Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Time:</span>
                    <span className="font-bold">{Math.round(results.time_taken / 60)}m {results.time_taken % 60}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg per Question:</span>
                    <span className="font-bold">{(results.total_time_taken_questions / results.total_questions).toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Remaining:</span>
                    <span className="font-bold">{Math.max(0, 300 - results.time_taken)}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prize Information */}
            {results.prize_amount > 0 && (
              <div className="mt-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  <div>
                    <p className="font-bold text-lg">Congratulations!</p>
                    <p className="text-green-400">You won ₹{results.prize_amount} - Added to your wallet!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Violations */}
            {results.security_violations.length > 0 && (
              <div className="mt-6 bg-red-500/20 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-2 text-red-400">Security Violations Detected</h4>
                <div className="space-y-2">
                  {results.security_violations.map((violation, index) => (
                    <div key={index} className="text-sm text-red-300">
                      • {violation.type.replace('_', ' ').toUpperCase()} at {new Date(violation.timestamp).toLocaleTimeString()}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-red-300 mt-2">
                  Note: Security violations may affect future participation eligibility.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'questions' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {results.question_stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">Question {stat.question_index + 1}</h4>
                  <div className="flex items-center space-x-2">
                    {stat.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className="text-sm text-gray-300">{stat.time_taken.toFixed(1)}s</span>
                  </div>
                </div>
                
                <p className="text-white mb-4">{stat.question_text}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {Array.from({ length: 4 }, (_, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-lg text-sm ${
                        optionIndex === stat.correct_answer 
                          ? 'bg-green-500/30 border border-green-500'
                          : optionIndex === stat.user_answer && !stat.is_correct
                          ? 'bg-red-500/30 border border-red-500'
                          : 'bg-white/20'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                      <span className="ml-2">Option {optionIndex + 1}</span>
                      {optionIndex === stat.correct_answer && (
                        <CheckCircle className="h-4 w-4 text-green-400 inline ml-2" />
                      )}
                      {optionIndex === stat.user_answer && !stat.is_correct && (
                        <XCircle className="h-4 w-4 text-red-400 inline ml-2" />
                      )}
                    </div>
                  ))}
                </div>
                
                {stat.explanation && (
                  <div className="bg-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-blue-100">
                      <strong>Explanation:</strong> {stat.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
          >
            <h3 className="text-2xl font-bold mb-6">Tournament Leaderboard</h3>
            <div className="space-y-3">
              {/* Mock leaderboard - replace with actual data */}
              {[
                { rank: 1, name: "You", score: results.score, prize: results.prize_amount },
                { rank: 2, name: "Player 2", score: results.score - 1, prize: 200 },
                { rank: 3, name: "Player 3", score: results.score - 2, prize: 100 }
              ].map((entry, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${
                  entry.name === "You" ? 'bg-blue-500/30 border border-blue-500' : 'bg-white/20'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {entry.rank === 1 && <Trophy className="h-5 w-5 text-yellow-400" />}
                      {entry.rank === 2 && <Medal className="h-5 w-5 text-gray-400" />}
                      {entry.rank === 3 && <Medal className="h-5 w-5 text-orange-400" />}
                      <span className="font-bold text-lg">#{entry.rank}</span>
                    </div>
                    <span className="font-medium">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{entry.score}/{results.total_questions}</p>
                    {entry.prize > 0 && (
                      <p className="text-sm text-green-400">₹{entry.prize}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Play Again</span>
          </button>
          
          <button
            onClick={shareResults}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Share2 className="h-5 w-5" />
            <span>Share Results</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;