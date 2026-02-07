import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Code, Brain, MessageCircle, ArrowLeft, Target, Clock, Star, Building, Filter, Lock, CreditCard, X, Menu, Home, ChevronLeft, Grid3X3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Question } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const CompanyPracticePage: React.FC = () => {
  const { company } = useParams<{ company: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'all' | 'coding' | 'aptitude' | 'interview'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [userAccessLogs, setUserAccessLogs] = useState<any[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  // Consolidate companyName declaration
  const companyName = company || searchParams.get('company');

  useEffect(() => {
    loadQuestions();
  }, [companyName]);

  useEffect(() => {
    if (user) {
      loadUserAccessLogs();
    }
  }, [user]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const allQuestions = await supabaseStorage.getQuestions();
      
      let companyQuestions = allQuestions;
      
      // Filter questions by company if company parameter exists
      if (companyName) {
        companyQuestions = allQuestions.filter(q => 
          q.company.toLowerCase() === companyName.toLowerCase()
        );
      }
      
      setQuestions(companyQuestions);
      setFilteredQuestions(companyQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAccessLogs = async () => {
    if (!user) return;
    
    try {
      const accessLogs = await supabaseStorage.getAccessLogs(user.id);
      const userLogs = accessLogs.filter(log => log.paymentStatus);
      setUserAccessLogs(userLogs);
    } catch (error) {
      console.error('Error loading access logs:', error);
    }
  };

  useEffect(() => {
    let filtered = questions;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(q => q.category === activeCategory);
    }

    // Filter by search term (only for coding category)
    if (searchTerm && activeCategory === 'coding') {
      filtered = filtered.filter(q =>
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        q.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.codeExample && q.codeExample.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredQuestions(filtered);
  }, [questions, activeCategory, searchTerm]);

  const categories = [
    {
      id: 'all',
      name: 'All Materials',
      icon: Target,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      description: companyName ? `All ${companyName} practice materials` : 'All practice materials'
    },
    {
      id: 'coding',
      name: 'Coding',
      icon: Code,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Programming & algorithm questions'
    },
    {
      id: 'aptitude',
      name: 'Aptitude',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Quantitative & logical reasoning'
    },
    {
      id: 'interview',
      name: 'Interview',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Technical & HR interview prep'
    }
  ];

  const getCategoryStats = (categoryId: string) => {
    if (categoryId === 'all') return questions.length;
    return questions.filter(q => q.category === categoryId).length;
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'coding':
        return <Code className="h-4 w-4" />;
      case 'aptitude':
        return <Brain className="h-4 w-4" />;
      case 'interview':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasUserPaidForQuestion = (questionId: string) => {
    if (!user) return false;
    const accessLog = userAccessLogs.find(log => 
      log.questionId === questionId && log.paymentStatus
    );
    if (!accessLog) return false;
    
    // Check if access is still valid (within 1 hour)
    const now = new Date();
    const expiryTime = new Date(accessLog.accessExpiryTime);
    return now <= expiryTime;
  };

  const getQuestionAccessStatus = (question: Question) => {
    if (question.category !== 'coding') {
      return { isPaid: false, requiresPayment: false, status: 'free' };
    }
    
    const hasPaid = hasUserPaidForQuestion(question.id);
    return {
      isPaid: hasPaid,
      requiresPayment: true,
      status: hasPaid ? 'paid' : 'locked'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner 
          message={`Loading ${companyName || 'practice'} questions...`} 
          size="lg" 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-lg">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          {/* Company Title */}
          <div className="flex items-center space-x-2 flex-1 justify-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">
              {companyName || 'Practice Hub'}
            </h1>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition-all duration-200 lg:hidden"
          >
            {showMobileMenu ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Grid3X3 className="h-5 w-5 text-gray-600" />
            )}
          </button>
          
          {/* Desktop Home Button */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
            onClick={() => navigate('/')}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Hub</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-3 py-2 space-y-1">
              <button
                onClick={() => {
                  navigate('/');
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Home className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-medium">Company Hub</span>
              </button>
              <button
                onClick={() => {
                  navigate('/dashboard');
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">My Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6">
          <div className="mb-3">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {companyName ? `${companyName} Practice Hub` : 'Practice Hub'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              {companyName 
                ? `Master ${companyName} interview questions with comprehensive practice materials`
                : 'Master interview questions with comprehensive practice materials'
              }
            </p>
          </div>
          <div className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {questions.length} Questions Available
          </div>
        </div>

        {/* Category Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            const questionCount = getCategoryStats(category.id);
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as any)}
                className={`relative p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                  isActive 
                    ? `${category.bgColor} ${category.borderColor} shadow-lg` 
                    : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                }`}
              >
                <div className="relative text-center">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl mb-2 sm:mb-3 ${
                    isActive 
                      ? `bg-gradient-to-br ${category.color} text-white shadow-md` 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  </div>
                  
                  {/* Title */}
                  <h3 className={`text-xs sm:text-sm lg:text-base font-bold mb-1 ${
                    isActive ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {category.name}
                  </h3>
                  
                  {/* Question Count */}
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isActive 
                      ? 'bg-white text-gray-700 shadow-sm' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5"></span>
                    {questionCount} Questions
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search Bar (only show for coding category) */}
        {activeCategory === 'coding' && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Search Coding Questions</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search coding questions by algorithm, data structure...`}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            {searchTerm && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <p className="text-sm text-gray-600">
                  Results for "<span className="font-medium text-blue-600">{searchTerm}</span>"
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1">
                {companyName ? `${companyName} ` : ''}{activeCategory === 'all' ? 'Practice Materials' : 
                 categories.find(c => c.id === activeCategory)?.name + ' Questions'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filteredQuestions.length}</span> questions
                {searchTerm && activeCategory === 'coding' && (
                  <span className="ml-1 sm:ml-2">found</span>
                )}
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center mr-1">
                  <Building className="h-2.5 w-2.5 text-blue-600" />
                </div>
                Company Specific
              </span>
            </div>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {filteredQuestions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200 group">
              {question.imageUrl && (
                <div className="h-24 sm:h-32 lg:h-40 overflow-hidden">
                  <img
                    src={question.imageUrl}
                    alt="Question illustration"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-3 sm:p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                    <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                      <Building className="h-3 w-3" />
                    </div>
                    <span className="font-medium truncate max-w-[100px] sm:max-w-none">{question.company}</span>
                  </div>
                </div>
                
                {/* Category and Difficulty badges */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(question.category)}`}>
                    {getCategoryIcon(question.category)}
                    <span className="ml-1">{question.category.charAt(0).toUpperCase() + question.category.slice(1)}</span>
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                  </span>
                </div>

                {/* Question text */}
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">
                  {question.questionText}
                </h3>

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                    {question.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        #{tag}
                      </span>
                    ))}
                    {question.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        +{question.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {new Date(question.updatedAt).toLocaleDateString()}
                  </span>
                  {(() => {
                    const accessStatus = getQuestionAccessStatus(question);
                    
                    if (!accessStatus.requiresPayment) {
                      // Free questions (aptitude, interview)
                      return (
                        <Link
                          to={`/question/${question.id}`}
                          className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium flex items-center space-x-1"
                        >
                          <span>Free</span>
                        </Link>
                      );
                    } else if (accessStatus.isPaid) {
                      // Already paid coding questions
                      return (
                        <Link
                          to={`/question/${question.id}`}
                          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex items-center space-x-1"
                        >
                          <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Continue</span>
                        </Link>
                      );
                    } else {
                      // Locked coding questions requiring payment
                      return (
                        <Link
                          to={`/question/${question.id}`}
                          className="bg-orange-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-sm font-medium flex items-center space-x-1"
                        >
                          <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>₹{question.price || 49}</span>
                        </Link>
                      );
                    }
                  })()}
                </div>
                
                {/* Payment indicator for coding questions */}
                {(() => {
                  const accessStatus = getQuestionAccessStatus(question);
                  
                  if (accessStatus.requiresPayment) {
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {accessStatus.isPaid ? (
                          <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 py-2 px-3 rounded-lg">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs font-medium">Premium Access</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2 text-orange-600 bg-orange-50 py-2 px-3 rounded-lg">
                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs font-medium">Premium  Access</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-6 sm:p-8 border border-gray-200">
              {activeCategory === 'coding' && searchTerm ? (
                <>
                  <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No coding questions found</h3>
                  <p className="text-gray-500 mb-6">
                    No questions match your search for "<span className="font-medium text-blue-600">{searchTerm}</span>"
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Building className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                    No {companyName ? `${companyName} ` : ''}{activeCategory === 'all' ? '' : activeCategory} questions available
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Check back later for new {companyName ? `${companyName} ` : ''}practice questions in this category
                  </p>
                  <button
                    onClick={() => setActiveCategory('all')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse All Questions
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyPracticePage;