import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuizSession {
  id: string;
  tournament_id: string;
  questions: Question[];
  current_question: number;
  score: number;
  time_remaining: number;
  status: 'active' | 'completed' | 'abandoned';
}

const QuizPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5); // 5 seconds per question
  const [totalTimeLeft, setTotalTimeLeft] = useState(300); // 5 minutes total
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  // Anti-cheat measures
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchWarning(true);
        // Log suspicious activity
        console.warn('Tab switch detected - potential cheating');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common shortcuts
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 's')) {
        e.preventDefault();
      }
      if (e.key === 'F12') {
        e.preventDefault();
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  // Timer effects
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });

      setTotalTimeLeft(prev => {
        if (prev <= 1) {
          // End quiz when total time runs out
          endQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const handleTimeUp = useCallback(() => {
    // Auto-submit current answer (null if none selected)
    submitAnswer(selectedAnswer);
  }, [selectedAnswer]);

  const endQuiz = useCallback(() => {
    if (session) {
      // Submit final results
      navigate(`/quiz-results/${session.id}`);
    }
  }, [session, navigate]);

  const submitAnswer = async (answer: number | null) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setShowResult(true);
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Show result for 2 seconds
    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer(null);
      setIsSubmitting(false);
      
      if (currentQuestion < 29) { // 30 questions total
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(5); // Reset timer for next question
      } else {
        endQuiz();
      }
    }, 2000);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isSubmitting || showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer !== null && !isSubmitting) {
      submitAnswer(selectedAnswer);
    }
  };

  // Mock data for demonstration
  const mockQuestions: Question[] = Array.from({ length: 30 }, (_, i) => ({
    id: `q${i + 1}`,
    question_text: `Sample Question ${i + 1}: Which of the following is correct?`,
    options: [
      'Option A - This is the first choice',
      'Option B - This is the second choice',
      'Option C - This is the third choice',
      'Option D - This is the fourth choice'
    ],
    correct_answer: Math.floor(Math.random() * 4),
    explanation: `This is the explanation for question ${i + 1}.`
  }));

  const currentQ = mockQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / 30) * 100;

  if (!currentQ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 text-white relative overflow-hidden">
      {/* Security Warning */}
      <AnimatePresence>
        {tabSwitchWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50 flex items-center space-x-2"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Warning: Tab switching detected. This may affect your score.</span>
            <button
              onClick={() => setTabSwitchWarning(false)}
              className="ml-auto text-white hover:text-red-200"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-6 w-6 text-green-400" />
            <span className="text-sm font-medium">Secure Quiz Mode</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="font-mono text-lg">
                {Math.floor(totalTimeLeft / 60)}:{(totalTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="text-sm">
              Question {currentQuestion + 1} of 30
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-black/20 px-4 pb-4">
        <div className="container mx-auto">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-green-400 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Question Timer */}
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full text-2xl font-bold mb-4"
            animate={{ scale: timeLeft <= 2 ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: timeLeft <= 2 ? Infinity : 0, duration: 0.5 }}
          >
            {timeLeft}
          </motion.div>
          <p className="text-sm text-gray-300">seconds remaining</p>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {currentQ.question_text}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isSubmitting || showResult}
                    className={`p-4 rounded-lg text-left transition-all duration-200 ${
                      selectedAnswer === index
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    } ${
                      showResult && index === currentQ.correct_answer
                        ? 'bg-green-500 text-white'
                        : ''
                    } ${
                      showResult && selectedAnswer === index && index !== currentQ.correct_answer
                        ? 'bg-red-500 text-white'
                        : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center font-bold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showResult && index === currentQ.correct_answer && (
                        <CheckCircle className="h-5 w-5 text-green-300" />
                      )}
                      {showResult && selectedAnswer === index && index !== currentQ.correct_answer && (
                        <XCircle className="h-5 w-5 text-red-300" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Submit Button */}
              {!showResult && (
                <div className="text-center mt-8">
                  <motion.button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null || isSubmitting}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </motion.button>
                </div>
              )}

              {/* Result Explanation */}
              {showResult && currentQ.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-black/20 rounded-lg"
                >
                  <p className="text-gray-300">{currentQ.explanation}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizPage;