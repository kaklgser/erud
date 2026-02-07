import React, { useState, useEffect } from 'react';
import { Clock, CreditCard, BookOpen, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AccessLog, Question } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isChristmasMode, colors } = useTheme();
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeAccess, setActiveAccess] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [userAccessLogs, allQuestions] = await Promise.all([
        supabaseStorage.getAccessLogs(user.id),
        supabaseStorage.getQuestions()
      ]);

      setAccessLogs(userAccessLogs);
      setQuestions(allQuestions);

      // Filter active access (non-expired)
      const now = new Date();
      const active = userAccessLogs.filter(log => {
        const expiryTime = new Date(log.accessExpiryTime);
        return now <= expiryTime && log.paymentStatus;
      });
      setActiveAccess(active);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionById = (id: string) => {
    return questions.find(q => q.id === id);
  };

  const getTimeRemaining = (expiryTime: Date) => {
    const now = new Date();
    const timeDiff = expiryTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Expired';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const totalSpent = accessLogs.reduce((sum, log) => sum + (log.amountPaid || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading your dashboard..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Track your learning progress and access history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Access</p>
                <p className="text-2xl font-bold text-gray-900">{accessLogs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Access</p>
                <p className="text-2xl font-bold text-gray-900">{activeAccess.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalSpent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accessLogs.filter(log => {
                    const logDate = new Date(log.accessStartTime);
                    const now = new Date();
                    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Access */}
        {activeAccess.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Active Access
            </h2>
            <div className="space-y-4">
              {activeAccess.map((log) => {
                const question = getQuestionById(log.questionId);
                if (!question) return null;
                
                return (
                  <div key={log.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {question.company}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {question.category}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {question.questionText}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Time remaining: {getTimeRemaining(new Date(log.accessExpiryTime))}
                        </p>
                        {log.paymentId && !log.paymentId.startsWith('free_access') && (
                          <Link
                            to={`/question/${question.id}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                          >
                            View Question
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Access History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Access History
          </h2>
          
          {accessLogs.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No access history</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start exploring questions to see your history here
              </p>
              <Link
                to="/practice"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Questions
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {accessLogs.map((log) => {
                const question = getQuestionById(log.questionId);
                if (!question) return null;
                
                const isActive = new Date() <= new Date(log.accessExpiryTime);
                
                return (
                  <div key={log.id} className={`border rounded-lg p-4 ${isActive ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                            {question.company}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {question.category}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isActive ? 'Active' : 'Expired'}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {question.questionText}
                        </h3>
                        <div className="text-sm text-gray-600">
                          <p>Purchased: {new Date(log.accessStartTime).toLocaleDateString()}</p>
                          <p>Amount: ₹{log.amountPaid}</p>
                          {log.paymentId && (
                            <p>Payment ID: {log.paymentId.substring(0, 20)}...</p>
                          )}
                        </div>
                        {log.paymentId && log.paymentId.startsWith('free_access') && (
                          <p className="text-sm text-green-600">
                            Free access with coupon
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/question/${question.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        View Question
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;