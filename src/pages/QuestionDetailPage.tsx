import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Building, User, Tag, Lock, CheckCircle, Code, Brain, MessageCircle, Star, Copy, Check } from 'lucide-react';
import { Question, AccessLog } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import LoadingSpinner from '../components/LoadingSpinner';

const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLog, setAccessLog] = useState<AccessLog | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadQuestion();
  }, [id]);

  useEffect(() => {
    if (user) {
      checkUserAccess();
    }
  }, [user, question]);

  useEffect(() => {
    if (hasAccess && accessLog) {
      const timer = setInterval(() => {
        updateTimeRemaining();
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasAccess, accessLog]);

  const loadQuestion = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const questions = await supabaseStorage.getQuestions();
      const foundQuestion = questions.find(q => q.id === id);
      setQuestion(foundQuestion || null);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserAccess = async () => {
    if (!user || !id) return;

    try {
      const accessLogs = await supabaseStorage.getAccessLogs(user.id);
      const userAccessLog = accessLogs.find(
        log => log.questionId === id && log.paymentStatus
      );

      if (userAccessLog) {
        const now = new Date();
        const expiryTime = new Date(userAccessLog.accessExpiryTime);
        
        if (now <= expiryTime) {
          setHasAccess(true);
          setAccessLog(userAccessLog);
        } else {
          setHasAccess(false);
        }
      }
    } catch (error) {
      console.error('Error checking user access:', error);
    }
  };

  const updateTimeRemaining = () => {
    if (!accessLog) return;

    const now = new Date();
    const expiryTime = new Date(accessLog.accessExpiryTime);
    const timeDiff = expiryTime.getTime() - now.getTime();

    if (timeDiff <= 0) {
      setHasAccess(false);
      setTimeRemaining('Expired');
      return;
    }

    const minutes = Math.floor(timeDiff / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    setTimeRemaining(`${minutes}m ${seconds}s`);
  };

  const handlePaymentSuccess = async (paymentId: string, amount: number) => {
    if (!user || !id) return;

    console.log('Payment successful:', { paymentId, amount });

    const now = new Date();
    const expiryTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    try {
      const newAccessLog = await supabaseStorage.saveAccessLog({
        userId: user.id,
        questionId: id,
        accessStartTime: now,
        accessExpiryTime: expiryTime,
        paymentStatus: true,
        paymentId: paymentId,
        amountPaid: amount
      });

      if (newAccessLog) {
        setHasAccess(true);
        setAccessLog(newAccessLog);
        setShowPaymentModal(false);
        
        // Show success message
        alert('Payment successful! You now have 1-hour access to this question solution.');
      }
    } catch (error) {
      console.error('Error saving access log:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coding':
        return <Code className="h-5 w-5" />;
      case 'aptitude':
        return <Brain className="h-5 w-5" />;
      case 'interview':
        return <MessageCircle className="h-5 w-5" />;
      case 'technical':
        return <Star className="h-5 w-5" />;
      default:
        return <Tag className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'coding':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'aptitude':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'interview':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'technical':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = async () => {
    if (question?.codeExample) {
      try {
        await navigator.clipboard.writeText(question.codeExample);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner message="Loading question..." size="lg" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Question not found</h2>
          <button
            onClick={() => navigate('/questions')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <button
          onClick={() => navigate('/questions')}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-4 sm:mb-6 transition-colors p-2 -ml-2 rounded-lg hover:bg-white/50"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Questions</span>
        </button>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {question.imageUrl && (
            <div className="h-48 sm:h-64 overflow-hidden">
              <img
                src={question.imageUrl}
                alt="Question illustration"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2 text-gray-600 text-sm">
                  <Building className="h-5 w-5" />
                  <span className="font-medium">{question.company}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 text-sm">
                  <User className="h-5 w-5" />
                  <span>{question.role}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getCategoryColor(question.category)}`}>
                  {getCategoryIcon(question.category)}
                  <span className="ml-1 sm:ml-2">{question.category.charAt(0).toUpperCase() + question.category.slice(1)}</span>
                </span>
                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </span>
              </div>
            </div>

            {/* Question */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              {question.questionText}
            </h1>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                {question.tags.map((tag, index) => (
                  <span key={index} className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 text-xs sm:text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Access Status */}
            {hasAccess || question.category !== 'coding' ? (
              question.category === 'coding' ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <span className="text-green-800 font-semibold text-sm sm:text-base">Access Granted</span>
                      <div className="flex items-center space-x-2 text-green-600 text-xs sm:text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{timeRemaining} remaining</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <span className="text-green-800 font-semibold text-sm sm:text-base">Free Access</span>
                      <p className="text-green-700 text-xs sm:text-sm mt-1">
                        This {question.category} question is available for free practice
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0" />
                    <div>
                      <span className="text-yellow-800 font-semibold text-base sm:text-lg">
                        Premium Solution - Unlock Full Access
                      </span>
                      <p className="text-yellow-700 text-xs sm:text-sm mt-1">
                        Get detailed solution, code examples, and explanations
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-sm sm:text-base transform hover:scale-105"
                  >
                    Unlock for ₹{question.price || 49}
                  </button>
                </div>
              </div>
            )}

            {/* Solution */}
            <div className="border-t border-gray-200 pt-6 sm:pt-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Solution & Explanation
              </h2>
              
              {hasAccess || question.category !== 'coding' ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Solution Text */}
                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3">Solution Approach</h3>
                    <p className="text-blue-800 leading-relaxed text-sm sm:text-base">{question.solutionText}</p>
                  </div>

                  {/* Code Example (if available) */}
                  {question.codeExample && (
                    <div className="bg-gray-900 rounded-lg sm:rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 bg-gray-800">
                        <h3 className="text-white font-semibold flex items-center space-x-2 text-sm sm:text-base">
                          <span>Code Implementation</span>
                          <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs hidden sm:inline">
                            {question.category === 'coding' ? 'JavaScript' : 'Code'}
                          </span>
                        </h3>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center space-x-1 sm:space-x-2 text-gray-300 hover:text-white transition-colors text-xs sm:text-sm"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-green-400 p-3 sm:p-6 overflow-x-auto text-xs sm:text-sm leading-relaxed">
                        <code>{question.codeExample}</code>
                      </pre>
                    </div>
                  )}

                  {/* Detailed Explanation */}
                  <div className="bg-purple-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-purple-200">
                    <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-2 sm:mb-3">Detailed Explanation</h3>
                    <p className="text-purple-800 leading-relaxed text-sm sm:text-base">{question.explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg sm:rounded-xl p-6 sm:p-12 text-center">
                  <Lock className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4 sm:mb-6" />
                  <h3 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    Premium Coding Question - Unlock Full Access
                  </h3>
                  <p className="text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                    Unlock this coding question to access the complete solution with detailed explanations, 
                    code examples, and step-by-step approach.
                  </p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-base sm:text-lg transform hover:scale-105"
                  >
                    Unlock Solution for ₹{question.price || 49}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {question.category === 'coding' && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          questionId={id!}
          questionPrice={question.price}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default QuestionDetailPage;