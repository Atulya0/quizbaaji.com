import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';

interface PlayButtonProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ 
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'text-lg px-4 py-2',
    medium: 'text-xl px-6 py-3',
    large: 'text-2xl px-8 py-4'
  };

  const buttonClass = `${sizeClasses[size]} ${className} btn btn-accent rounded-full font-semibold`;

  return (
    <motion.a
      href="https://play.quizbaaji.com/#"
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <PlayCircle className="mr-2 h-5 w-5" />
      Play Now
    </motion.a>
  );
};

export default PlayButton;