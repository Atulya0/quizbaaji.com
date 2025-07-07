import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PlayButtonProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ 
  size = 'medium',
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const sizeClasses = {
    small: 'text-lg px-4 py-2',
    medium: 'text-xl px-6 py-3',
    large: 'text-2xl px-8 py-4'
  };

  const buttonClass = `${sizeClasses[size]} ${className} btn btn-accent rounded-full font-semibold`;

  const handleClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={buttonClass}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <PlayCircle className="mr-2 h-5 w-5" />
      {user ? 'Play Now' : 'Start Playing'}
    </motion.button>
  );
};

export default PlayButton;