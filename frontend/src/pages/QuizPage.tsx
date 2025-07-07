import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, XCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { quizAPI, websocketService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  index: number;
  question_text: string;
  options: string[];
}

interface QuizSession {
  session_id: string;
  current_question: Question;
  total_questions: number;
  total_time: number;
  question_time: number;
}

interface AnswerResponse {
  is_correct: boolean;
  correct_answer: number;
  explanation: string;
  current_score: number;
  next_question?: Question;
}

const QuizPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState<QuizSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(5); // 5 seconds per question
  const [totalTimeLeft, setTotalTimeLeft] = useState(300); // 5 minutes total
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<AnswerResponse | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Security measures
  const tabSwitchCount = useRef(0);
  const questionStartTime = useRef<number>(0);
  const violationTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Anti-cheat measures
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && quizStarted && !showResult) {
        tabSwitchCount.current += 1;
        reportViolation('tab_switch');
        setShowViolationWarning(true);
        
        const timeout = setTimeout(() => setShowViolationWarning(false), 3000);
        violationTimeouts.current.push(timeout);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (quizStarted) {
        e.preventDefault();
        reportViolation('right_click');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizStarted) {
        // Disable common shortcuts
        if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 's' || e.key === 'r')) {
          e.preventDefault();
          reportViolation('keyboard_shortcut');
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();
          reportViolation('devtools_attempt');
        }
        if (e.key === 'PrintScreen') {
          reportViolation('screenshot_attempt');
        }
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (quizStarted) {
        e.preventDefault();
        reportViolation('copy_attempt');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (quizStarted) {
        e.preventDefault();
        reportViolation('paste_attempt');
      }
    };

    // Prevent text selection
    const handleSelectStart = (e: Event) => {
      if (quizStarted) {
        e.preventDefault();
      }
    };

    // Detect developer tools
    const detectDevTools = () => {
      if (quizStarted) {
        const devtools = {
          open: false,
          orientation: null as string | null
        };
        
        const threshold = 160;
        
        const detectDevToolsLoop = () => {
          if (window.outerHeight - window.innerHeight > threshold || 
              window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
              devtools.open = true;
              reportViolation('devtools_detected');
            }
          } else {
            devtools.open = false;
          }
        };
        
        setInterval(detectDevToolsLoop, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('selectstart', handleSelectStart);
    
    detectDevTools();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('selectstart', handleSelectStart);
      
      violationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [quizStarted, showResult]);

  // Enter fullscreen mode
  useEffect(() => {
    const enterFullscreen = async () => {
      if (quizStarted && !isFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        } catch (error) {
          console.warn('Could not enter fullscreen mode');
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && quizStarted) {
        setIsFullscreen(false);
        reportViolation('fullscreen_exit');
      }
    };

    enterFullscreen();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.warn);
      }
    };
  }, [quizStarted]);

  // Timer effects
  useEffect(() => {
    if (!quizStarted || showResult) return;

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit when question time runs out
          if (!isSubmitting) {
            handleAutoSubmit();
          }
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
  }, [quizStarted, showResult, isSubmitting]);

  // WebSocket integration
  useEffect(() => {
    if (user?.id && session?.session_id) {
      websocketService.on('answer_submitted', handleWebSocketAnswer);
      websocketService.on('quiz_completed', handleQuizCompleted);
      websocketService.on('time_update', handleTimeUpdate);

      return () => {
        websocketService.off('answer_submitted', handleWebSocketAnswer);
        websocketService.off('quiz_completed', handleQuizCompleted);
        websocketService.off('time_update', handleTimeUpdate);
      };
    }
  }, [user?.id, session?.session_id]);

  const handleWebSocketAnswer = (data: any) => {
    setLastAnswer(data);
    setShowResult(true);
    setCurrentScore(data.current_score);
  };

  const handleQuizCompleted = (data: any) => {
    navigate(`/quiz-results/${session?.session_id}`);
  };

  const handleTimeUpdate = (data: any) => {
    setTotalTimeLeft(data.time_remaining);
  };

  const reportViolation = async (type: string) => {
    if (session?.session_id) {
      try {
        await quizAPI.reportViolation(session.session_id, type, new Date().toISOString());
        setViolations(prev => [...prev, type]);
      } catch (error) {
        console.error('Error reporting violation:', error);
      }
    }
  };

  const startQuiz = async () => {
    if (!tournamentId) return;

    try {
      const response = await quizAPI.startQuiz(tournamentId);
      const sessionData = response.data;
      
      setSession({
        session_id: sessionData.session_id,
        current_question: sessionData.current_question,
        total_questions: sessionData.total_questions,
        total_time: sessionData.total_time,
        question_time: sessionData.question_time
      });
      
      setCurrentQuestion(sessionData.current_question);
      setQuizStarted(true);
      setQuestionNumber(1);
      setQuestionTimeLeft(5);
      setTotalTimeLeft(sessionData.total_time);
      questionStartTime.current = Date.now();
      
    } catch (error: any) {
      console.error('Error starting quiz:', error);
      alert(error.response?.data?.detail || 'Failed to start quiz');
      navigate('/dashboard');
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isSubmitting || showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || isSubmitting || !session) return;
    
    setIsSubmitting(true);
    
    const timeTaken = Math.max(1, Math.min(5, (Date.now() - questionStartTime.current) / 1000));
    
    try {
      const response = await quizAPI.submitAnswer(
        session.session_id, 
        questionNumber - 1, 
        selectedAnswer,
        timeTaken
      );
      
      setLastAnswer(response.data);
      setShowResult(true);
      setCurrentScore(response.data.current_score);
      
      // Show result for 2 seconds then move to next question
      setTimeout(() => {
        if (response.data.next_question) {
          setCurrentQuestion(response.data.next_question);
          setQuestionNumber(prev => prev + 1);
          setSelectedAnswer(null);
          setShowResult(false);
          setQuestionTimeLeft(5);
          questionStartTime.current = Date.now();
        } else {
          // Quiz completed
          endQuiz();
        }
        setIsSubmitting(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      setIsSubmitting(false);
      alert('Error submitting answer. Please try again.');
    }
  };

  const handleAutoSubmit = () => {
    if (!isSubmitting) {
      handleSubmit();
    }
  };

  const endQuiz = async () => {
    if (session?.session_id) {
      try {
        await quizAPI.completeQuiz(session.session_id);
        navigate(`/quiz-results/${session.session_id}`);
      } catch (error) {
        console.error('Error ending quiz:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 flex items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <Shield className="h-16 w-16 mx-auto mb-4 text-green-400" />
          <h1 className="text-3xl font-bold mb-4">Quiz Security Mode</h1>
          <div className="space-y-4 mb-8 text-left max-w-md">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Fullscreen mode will be activated</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Tab switching is monitored</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Copy/paste is disabled</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span>Developer tools are blocked</span>
            </div>
          </div>
          <motion.button
            onClick={startQuiz}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Quiz
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 text-white relative overflow-hidden">
      {/* Security Warning */}
      <AnimatePresence>
        {showViolationWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50 flex items-center space-x-2"
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Security violation detected! This action is being monitored.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-6 w-6 text-green-400" />
            <span className="text-sm font-medium">Secure Quiz Mode</span>
            {violations.length > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                {violations.length} violations
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="font-mono text-lg">
                {formatTime(totalTimeLeft)}
              </span>
            </div>
            <div className="text-sm">
              Question {questionNumber} of {session?.total_questions || 30}
            </div>
            <div className="text-sm">
              Score: {currentScore}
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
              animate={{ width: `${(questionNumber / (session?.total_questions || 30)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Question Timer */}
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <motion.div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold mb-4 ${
              questionTimeLeft <= 2 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            animate={{ 
              scale: questionTimeLeft <= 2 ? [1, 1.1, 1] : 1,
              backgroundColor: questionTimeLeft <= 2 ? '#ef4444' : '#3b82f6'
            }}
            transition={{ repeat: questionTimeLeft <= 2 ? Infinity : 0, duration: 0.5 }}
          >
            {questionTimeLeft}
          </motion.div>
          <p className="text-sm text-gray-300">seconds remaining for this question</p>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionNumber}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {currentQuestion.question_text}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isSubmitting || showResult}
                    className={`p-4 rounded-lg text-left transition-all duration-200 ${
                      selectedAnswer === index
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    } ${
                      showResult && lastAnswer && index === lastAnswer.correct_answer
                        ? 'bg-green-500 text-white'
                        : ''
                    } ${
                      showResult && selectedAnswer === index && lastAnswer && index !== lastAnswer.correct_answer
                        ? 'bg-red-500 text-white'
                        : ''
                    } disabled:cursor-not-allowed`}
                    whileHover={{ scale: isSubmitting || showResult ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting || showResult ? 1 : 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center font-bold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showResult && lastAnswer && index === lastAnswer.correct_answer && (
                        <CheckCircle className="h-5 w-5 text-green-300" />
                      )}
                      {showResult && selectedAnswer === index && lastAnswer && index !== lastAnswer.correct_answer && (
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
                    whileHover={{ scale: selectedAnswer === null || isSubmitting ? 1 : 1.05 }}
                    whileTap={{ scale: selectedAnswer === null || isSubmitting ? 1 : 0.95 }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </motion.button>
                </div>
              )}

              {/* Result Explanation */}
              {showResult && lastAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-black/20 rounded-lg"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {lastAnswer.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <span className="font-bold">
                      {lastAnswer.is_correct ? 'Correct!' : 'Incorrect!'}
                    </span>
                  </div>
                  <p className="text-gray-300">{lastAnswer.explanation}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Current Score: {lastAnswer.current_score} / {questionNumber}
                  </p>
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