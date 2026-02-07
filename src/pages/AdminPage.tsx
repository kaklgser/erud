import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload, DollarSign, Tag, Building, User, Code, Brain, MessageCircle, Star, Clock, Target } from 'lucide-react';
import { Question, Material, PaymentSettings } from '../types';
import { supabaseStorage } from '../utils/supabaseStorage';
import { AdminApifyConfigManager } from '../components/admin/AdminApifyConfigManager';
import { AdminJobSyncDashboard } from '../components/admin/AdminJobSyncDashboard';
import { AdminJobUpdatesManager } from '../components/admin/AdminJobUpdatesManager';
import { ApifyDataViewer } from '../components/admin/ApifyDataViewer';
import { ScheduledSyncManager } from '../components/admin/ScheduledSyncManager';
import { SyncHistoryGraph } from '../components/admin/SyncHistoryGraph';
import { AdminFetchJobsTestPanel } from '../components/admin/AdminFetchJobsTestPanel';
import { JobSyncPanel } from '../components/admin/JobSyncPanel';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'questions' | 'materials' | 'payments' | 'fetch-jobs' | 'job-sync' | 'apify-config' | 'sync-logs' | 'apify-json' | 'job-updates' | 'scheduled-syncs' | 'sync-history'>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    basePrice: 49,
    currency: 'INR',
    activeCoupons: []
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Question form state
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    company: '',
    role: '',
    category: 'coding' as const,
    difficulty: 'medium' as const,
    questionText: '',
    solutionText: '',
    codeLanguage: 'javascript' as 'javascript' | 'python' | 'java' | 'cpp',
    codeExample: '',
    explanation: '',
    tags: '',
    imageUrl: '',
    price: 49
  });

  // Material form state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    category: 'interview-tips' as const,
    company: '',
    role: '',
    content: '',
    imageUrl: ''
  });

  // Coupon form state
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount: 0,
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [questionsData, materialsData, paymentData] = await Promise.all([
        supabaseStorage.getQuestions(),
        supabaseStorage.getMaterials(),
        supabaseStorage.getPaymentSettings()
      ]);
      
      setQuestions(questionsData);
      setMaterials(materialsData);
      setPaymentSettings(paymentData);
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Set default data on error to prevent infinite loading
      setQuestions([]);
      setMaterials([]);
      setPaymentSettings({
        basePrice: 49,
        currency: 'INR',
        activeCoupons: []
      });
    } finally {
      // Ensure loading is always stopped
      setInitialLoading(false);
    }
  };

  // Question management
  const resetQuestionForm = () => {
    setQuestionForm({
      company: '',
      role: '',
      category: 'coding',
      difficulty: 'medium',
      questionText: '',
      solutionText: '',
      codeLanguage: 'javascript',
      codeExample: '',
      explanation: '',
      tags: '',
      imageUrl: '',
      price: 49
    });
    setEditingQuestion(null);
  };

  const handleAddQuestion = async () => {
    setLoading(true);
    try {
      console.log('Adding question with form data:', questionForm);
      
      const newQuestion = await supabaseStorage.saveQuestion({
        ...questionForm,
        tags: questionForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });

      if (newQuestion) {
        console.log('Question added successfully:', newQuestion);
        setQuestions([newQuestion, ...questions]);
        resetQuestionForm();
        setShowQuestionForm(false);
        
        // Show success message
        alert('✅ Question added successfully!');
      } else {
        throw new Error('Failed to save question - no data returned');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('❌ Failed to add question. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setQuestionForm({
      company: question.company,
      role: question.role,
      category: question.category,
      difficulty: question.difficulty,
      questionText: question.questionText,
      solutionText: question.solutionText,
      codeLanguage: 'javascript', // Default for existing questions
      codeExample: question.codeExample || '',
      explanation: question.explanation,
      tags: question.tags.join(', '),
      imageUrl: question.imageUrl || '',
      price: question.price || (question.category === 'coding' ? 49 : 0)
    });
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    setLoading(true);
    try {
      console.log('Updating question:', editingQuestion.id, 'with data:', questionForm);
      
      const updatedQuestion = await supabaseStorage.updateQuestion(editingQuestion.id, {
        ...questionForm,
        tags: questionForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });

      if (updatedQuestion) {
        console.log('Question updated successfully:', updatedQuestion);
        setQuestions(questions.map(q => 
          q.id === editingQuestion.id ? updatedQuestion : q
        ));
        resetQuestionForm();
        setShowQuestionForm(false);
        
        // Show success message
        alert('✅ Question updated successfully!');
      } else {
        throw new Error('Failed to update question - no data returned');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('❌ Failed to update question. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setLoading(true);
      try {
        console.log('Deleting question:', id);
        
        const success = await supabaseStorage.deleteQuestion(id);
        if (success) {
          console.log('Question deleted successfully');
          setQuestions(questions.filter(q => q.id !== id));
          alert('✅ Question deleted successfully!');
        } else {
          throw new Error('Failed to delete question');
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('❌ Failed to delete question. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Material management
  const resetMaterialForm = () => {
    setMaterialForm({
      title: '',
      description: '',
      category: 'interview-tips',
      company: '',
      role: '',
      content: '',
      imageUrl: ''
    });
    setEditingMaterial(null);
  };

  const handleAddMaterial = async () => {
    setLoading(true);
    try {
      console.log('Adding material with form data:', materialForm);
      
      const newMaterial = await supabaseStorage.saveMaterial(materialForm);
      if (newMaterial) {
        console.log('Material added successfully:', newMaterial);
        setMaterials([newMaterial, ...materials]);
        resetMaterialForm();
        setShowMaterialForm(false);
        alert('✅ Material added successfully!');
      } else {
        throw new Error('Failed to save material - no data returned');
      }
    } catch (error) {
      console.error('Error adding material:', error);
      alert('❌ Failed to add material. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditMaterial = (material: Material) => {
    setMaterialForm({
      title: material.title,
      description: material.description,
      category: material.category,
      company: material.company || '',
      role: material.role || '',
      content: material.content,
      imageUrl: material.imageUrl
    });
    setEditingMaterial(material);
    setShowMaterialForm(true);
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterial) return;

    setLoading(true);
    try {
      console.log('Updating material:', editingMaterial.id, 'with data:', materialForm);
      
      const updatedMaterial = await supabaseStorage.updateMaterial(editingMaterial.id, materialForm);
      if (updatedMaterial) {
        console.log('Material updated successfully:', updatedMaterial);
        setMaterials(materials.map(m => 
          m.id === editingMaterial.id ? updatedMaterial : m
        ));
        resetMaterialForm();
        setShowMaterialForm(false);
        alert('✅ Material updated successfully!');
      } else {
        throw new Error('Failed to update material - no data returned');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      alert('❌ Failed to update material. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      setLoading(true);
      try {
        console.log('Deleting material:', id);
        
        const success = await supabaseStorage.deleteMaterial(id);
        if (success) {
          console.log('Material deleted successfully');
          setMaterials(materials.filter(m => m.id !== id));
          alert('✅ Material deleted successfully!');
        } else {
          throw new Error('Failed to delete material');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('❌ Failed to delete material. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  // Payment settings management
  const handleAddCoupon = async () => {
    if (!couponForm.code.trim() || couponForm.discount <= 0) {
      alert('❌ Please enter a valid coupon code and discount percentage.');
      return;
    }
    
    // Check if coupon code already exists
    const existingCoupon = paymentSettings.activeCoupons.find(
      c => c.code.toLowerCase() === couponForm.code.toLowerCase()
    );
    
    if (existingCoupon) {
      alert('❌ A coupon with this code already exists. Please use a different code.');
      return;
    }
    
    const newCoupon = { ...couponForm };
    const updatedSettings = {
      ...paymentSettings,
      activeCoupons: [...paymentSettings.activeCoupons, newCoupon]
    };
    
    setLoading(true);
    try {
      console.log('Adding coupon:', newCoupon);
      
      const success = await supabaseStorage.savePaymentSettings(updatedSettings);
      if (success) {
        console.log('Coupon added successfully');
        setPaymentSettings(updatedSettings);
        setCouponForm({ code: '', discount: 0, description: '' });
        setShowCouponForm(false);
        alert('✅ Coupon added successfully!');
      } else {
        throw new Error('Failed to save payment settings');
      }
    } catch (error) {
      console.error('Error adding coupon:', error);
      alert('❌ Failed to add coupon. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (index: number) => {
    const updatedSettings = {
      ...paymentSettings,
      activeCoupons: paymentSettings.activeCoupons.filter((_, i) => i !== index)
    };
    
    setLoading(true);
    try {
      console.log('Deleting coupon at index:', index);
      
      const success = await supabaseStorage.savePaymentSettings(updatedSettings);
      if (success) {
        console.log('Coupon deleted successfully');
        setPaymentSettings(updatedSettings);
        alert('✅ Coupon deleted successfully!');
      } else {
        throw new Error('Failed to save payment settings');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('❌ Failed to delete coupon. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBasePrice = async (newPrice: number) => {
    const updatedSettings = {
      ...paymentSettings,
      basePrice: newPrice
    };
    
    setLoading(true);
    try {
      console.log('Updating base price to:', newPrice);
      
      const success = await supabaseStorage.savePaymentSettings(updatedSettings);
      if (success) {
        console.log('Base price updated successfully');
        setPaymentSettings(updatedSettings);
        alert('✅ Base price updated successfully!');
      } else {
        throw new Error('Failed to save payment settings');
      }
    } catch (error) {
      console.error('Error updating base price:', error);
      alert('❌ Failed to update base price. Please check your connection and try again.\n\nError: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
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
      case 'technical':
        return <Star className="h-4 w-4" />;
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
      case 'technical':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage questions, materials, and payment settings</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('questions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Questions ({questions.length})
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'materials'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Materials ({materials.length})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment Settings
              </button>
              <button
                onClick={() => setActiveTab('fetch-jobs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'fetch-jobs'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Fetch Jobs
              </button>
              <button
                onClick={() => setActiveTab('job-sync')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'job-sync'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Job Sync
              </button>
              <button
                onClick={() => setActiveTab('apify-config')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'apify-config'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Apify Config
              </button>
              <button
                onClick={() => setActiveTab('sync-logs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'sync-logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sync Logs
              </button>
              <button
                onClick={() => setActiveTab('apify-json')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'apify-json'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Apify JSON
              </button>
              <button
                onClick={() => setActiveTab('job-updates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'job-updates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Job Updates
              </button>
              <button
                onClick={() => setActiveTab('scheduled-syncs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'scheduled-syncs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Scheduled Syncs
              </button>
              <button
                onClick={() => setActiveTab('sync-history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'sync-history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sync History
              </button>
            </nav>
          </div>
        </div>

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Manage Questions</h2>
              <button
                onClick={() => setShowQuestionForm(true)}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {questions.map((question) => (
                <div key={question.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="flex items-center space-x-1 text-gray-600">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">{question.company}</span>
                        </span>
                        <span className="flex items-center space-x-1 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{question.role}</span>
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(question.category)}`}>
                          {getCategoryIcon(question.category)}
                          <span className="ml-1">{question.category}</span>
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ₹{question.price || 0}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.questionText}</h3>
                      <p className="text-gray-600 text-sm mb-2">{question.solutionText}</p>
                      {question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {question.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        disabled={loading}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Manage Materials</h2>
              <button
                onClick={() => setShowMaterialForm(true)}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Add Material</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <div key={material.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={material.imageUrl}
                    alt={material.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{material.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{material.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(material.uploadedAt).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditMaterial(material)}
                          disabled={loading}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          disabled={loading}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Settings Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Base Price Settings</h3>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Default Base Price:</label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">₹</span>
                  <input
                    type="number"
                    value={paymentSettings.basePrice}
                    onChange={(e) => handleUpdateBasePrice(Number(e.target.value))}
                    disabled={loading}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This is the default price for new coding questions. Individual questions can have custom prices.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Active Coupon Codes</h3>
                <button
                  onClick={() => setShowCouponForm(true)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Coupon</span>
                </button>
              </div>

              <div className="space-y-3">
                {paymentSettings.activeCoupons.map((coupon, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="font-mono font-medium">{coupon.code}</span>
                      <span className="text-green-600 font-medium">{coupon.discount}% OFF</span>
                      {coupon.description && (
                        <span className="text-gray-500 text-sm">- {coupon.description}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCoupon(index)}
                      disabled={loading}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fetch Jobs Test Tab */}
        {activeTab === 'fetch-jobs' && <AdminFetchJobsTestPanel />}

        {/* Job Sync Tab */}
        {activeTab === 'job-sync' && <JobSyncPanel />}

        {/* Apify Config Tab */}
        {activeTab === 'apify-config' && <AdminApifyConfigManager />}

        {/* Sync Logs Tab */}
        {activeTab === 'sync-logs' && <AdminJobSyncDashboard />}

        {/* Apify JSON Viewer Tab */}
        {activeTab === 'apify-json' && <ApifyDataViewer />}

        {/* Job Updates Tab */}
        {activeTab === 'job-updates' && <AdminJobUpdatesManager />}

        {/* Scheduled Syncs Tab */}
        {activeTab === 'scheduled-syncs' && (
          <ScheduledSyncManagerWrapper />
        )}

        {/* Sync History Tab */}
        {activeTab === 'sync-history' && <SyncHistoryGraph />}

        {/* Question Form Modal */}
        {showQuestionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowQuestionForm(false);
                      resetQuestionForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={questionForm.company}
                        onChange={(e) => setQuestionForm({...questionForm, company: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., TCS, Wipro, Infosys"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        value={questionForm.role}
                        onChange={(e) => setQuestionForm({...questionForm, role: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Software Engineer, Analyst"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={questionForm.category}
                        onChange={(e) => setQuestionForm({...questionForm, category: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="coding">Coding</option>
                        <option value="aptitude">Aptitude</option>
                        <option value="interview">Interview</option>
                        <option value="technical">Technical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                      <select
                        value={questionForm.difficulty}
                        onChange={(e) => setQuestionForm({...questionForm, difficulty: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                      <input
                        type="number"
                        value={questionForm.price}
                        onChange={(e) => setQuestionForm({...questionForm, price: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0 for free, 49 for premium"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                    <textarea
                      value={questionForm.questionText}
                      onChange={(e) => setQuestionForm({...questionForm, questionText: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter the question text..."
                      required
                    />
                  </div>

                  {/* Language Selection - Only show for coding category */}
                  {questionForm.category === 'coding' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Programming Language</label>
                      <select
                        value={questionForm.codeLanguage}
                        onChange={(e) => setQuestionForm({...questionForm, codeLanguage: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Solution Text</label>
                    <textarea
                      value={questionForm.solutionText}
                      onChange={(e) => setQuestionForm({...questionForm, solutionText: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter the solution approach..."
                      required
                    />
                  </div>

                  {/* Code Example - Only show for coding category */}
                  {questionForm.category === 'coding' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code Example ({questionForm.codeLanguage === 'cpp' ? 'C++' : questionForm.codeLanguage.charAt(0).toUpperCase() + questionForm.codeLanguage.slice(1)})
                      </label>
                    <textarea
                      value={questionForm.codeExample}
                      onChange={(e) => setQuestionForm({...questionForm, codeExample: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      rows={6}
                        placeholder={`Enter ${questionForm.codeLanguage === 'cpp' ? 'C++' : questionForm.codeLanguage} code example...`}
                    />
                      <p className="text-xs text-gray-500 mt-1">
                        Write your code solution in {questionForm.codeLanguage === 'cpp' ? 'C++' : questionForm.codeLanguage}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Explanation</label>
                    <textarea
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Enter detailed explanation..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={questionForm.tags}
                      onChange={(e) => setQuestionForm({...questionForm, tags: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., array, sorting, algorithm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (Optional)</label>
                    <input
                      type="url"
                      value={questionForm.imageUrl}
                      onChange={(e) => setQuestionForm({...questionForm, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowQuestionForm(false);
                      resetQuestionForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                    disabled={loading || !questionForm.company.trim() || !questionForm.role.trim() || !questionForm.questionText.trim() || !questionForm.solutionText.trim() || !questionForm.explanation.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                    <Save className="h-4 w-4" />
                    <span>
                      {loading 
                        ? (editingQuestion ? 'Updating...' : 'Adding...') 
                        : (editingQuestion ? 'Update Question' : 'Add Question')
                      }
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Material Form Modal */}
        {showMaterialForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingMaterial ? 'Edit Material' : 'Add New Material'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowMaterialForm(false);
                      resetMaterialForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={materialForm.title}
                      onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter material title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={materialForm.description}
                      onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter material description"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={materialForm.category}
                      onChange={(e) => setMaterialForm({...materialForm, category: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="interview-tips">Interview Tips</option>
                      <option value="coding-guide">Coding Guide</option>
                      <option value="aptitude-tricks">Aptitude Tricks</option>
                      <option value="company-specific">Company Specific</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
                      <input
                        type="text"
                        value={materialForm.company}
                        onChange={(e) => setMaterialForm({...materialForm, company: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., TCS, Wipro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role (Optional)</label>
                      <input
                        type="text"
                        value={materialForm.role}
                        onChange={(e) => setMaterialForm({...materialForm, role: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Software Engineer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                    <textarea
                      value={materialForm.content}
                      onChange={(e) => setMaterialForm({...materialForm, content: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      placeholder="Enter the material content..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={materialForm.imageUrl}
                      onChange={(e) => setMaterialForm({...materialForm, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowMaterialForm(false);
                      resetMaterialForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingMaterial ? handleUpdateMaterial : handleAddMaterial}
                    disabled={loading || !materialForm.title.trim() || !materialForm.description.trim() || !materialForm.content.trim() || !materialForm.imageUrl.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                    <Save className="h-4 w-4" />
                    <span>
                      {loading 
                        ? (editingMaterial ? 'Updating...' : 'Adding...') 
                        : (editingMaterial ? 'Update Material' : 'Add Material')
                      }
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coupon Form Modal */}
        {showCouponForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Coupon</h3>
                <button
                  onClick={() => {
                    setShowCouponForm(false);
                    setCouponForm({ code: '', discount: 0, description: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="e.g., SAVE20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percentage</label>
                  <input
                    type="number"
                    value={couponForm.discount}
                    onChange={(e) => setCouponForm({...couponForm, discount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 20"
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({...couponForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 20% discount"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCouponForm(false);
                    setCouponForm({ code: '', discount: 0, description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCoupon}
                  disabled={loading || !couponForm.code.trim() || couponForm.discount <= 0 || couponForm.discount > 100}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Adding...' : 'Add Coupon'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ScheduledSyncManagerWrapper: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const { apifyService } = await import('../services/apifyService');
      const data = await apifyService.getConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <ScheduledSyncManager configs={configs} />;
};

export default AdminPage;