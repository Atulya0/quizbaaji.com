import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, Shield, Trophy, Users } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoResponse.json();
        
        await login(tokenResponse.access_token, userInfo);
        navigate('/dashboard');
      } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      alert('Google login failed. Please try again.');
    },
  });

  const features = [
    {
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
      title: 'Win Real Money',
      description: 'Compete in tournaments and earn cash prizes based on your performance.'
    },
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: 'Multiple Tournaments',
      description: 'Join various quiz categories and compete with players worldwide.'
    },
    {
      icon: <Shield className="h-8 w-8 text-green-500" />,
      title: 'Secure & Fair',
      description: 'Advanced anti-cheat system ensures fair play for all participants.'
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      title: 'Test Your Knowledge',
      description: '30 challenging questions in 5 minutes - prove your expertise!'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white"
        >
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <img src="/assets/logo.png" alt="QuizBaaji" className="h-12 w-12 brightness-200" />
              <h1 className="text-3xl font-bold ml-2">QuizBaaji</h1>
            </div>
            <p className="text-xl text-gray-300">
              Join the ultimate quiz tournament platform where knowledge meets rewards!
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start space-x-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
              >
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to start your quiz journey</p>
          </div>

          <div className="space-y-6">
            <motion.button
              onClick={() => googleLogin()}
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </motion.button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                By signing in, you agree to our{' '}
                <a href="/TermsConditions" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>New user? Sign up automatically on first login</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;