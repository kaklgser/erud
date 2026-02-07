// src/components/pages/MyApplicationsPage.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Calendar,
  Building2,
  ExternalLink,
  Zap,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedCard, GradientButton, FloatingParticles, ChristmasSnow } from '../ui';
import { ApplicationLog, ApplicationHistory } from '../../types/jobs';
import { jobsService } from '../../services/jobsService';
import { Card } from "../common/Card";

interface MyApplicationsPageProps {
  isAuthenticated: boolean;
  onShowAuth: () => void;
}

export const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({
  isAuthenticated,
  onShowAuth
}) => {
  const navigate = useNavigate();
  const { isChristmasMode, colors } = useTheme();
  const { user } = useAuth();

  const [history, setHistory] = useState<ApplicationHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ status?: string; method?: string }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    loadApplicationHistory();
  }, [isAuthenticated, filters]);

  const loadApplicationHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await jobsService.getApplicationHistory(filters);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    return method === 'auto' ? <Zap className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your application history.</p>
          <button
            onClick={onShowAuth}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-dark-50 dark:to-dark-200 lg:pl-16 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 dark:bg-dark-50 dark:border-dark-300">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16 py-4">
            <button
              onClick={() => navigate('/jobs')}
              className="lg:hidden btn-secondary h-11 px-4 rounded-xl inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:block text-sm font-semibold">Back to Jobs</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Applications</h1>
            <button
              onClick={loadApplicationHistory}
              className="btn-primary h-11 px-4 rounded-xl flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-semibold">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container-responsive py-8">
        {/* Stats */}
        {history && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
            {[
              { label: "Total", value: history.stats.total, color: "text-gray-900 dark:text-gray-100" },
              { label: "Submitted", value: history.stats.submitted, color: "text-green-600 dark:text-green-400" },
              { label: "Pending", value: history.stats.pending, color: "text-yellow-600 dark:text-yellow-400" },
              { label: "Manual", value: history.stats.manual, color: "text-blue-600 dark:text-blue-400" },
              { label: "Auto", value: history.stats.auto, color: "text-purple-600 dark:text-purple-400" },
              { label: "Failed", value: history.stats.failed, color: "text-red-600 dark:text-red-400" }
            ].map((item) => (
              <Card key={item.label} padding="md" className="text-left space-y-1">
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.label}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Updated live as you apply</p>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card padding="md" className="mb-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
            <Filter className="w-5 h-5 text-blue-600 dark:text-neon-cyan-400" />
            <span>Filter applications</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              className="h-11 rounded-xl px-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 dark:bg-dark-200 dark:border-dark-300 dark:text-gray-100"
            >
              <option value="">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filters.method || ''}
              onChange={(e) => setFilters({ ...filters, method: e.target.value || undefined })}
              className="h-11 rounded-xl px-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 dark:bg-dark-200 dark:border-dark-300 dark:text-gray-100"
            >
              <option value="">All Methods</option>
              <option value="manual">Manual</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </Card>

        {/* Applications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg text-gray-600 dark:text-gray-300">Loading applications...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Applications</h3>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
        ) : history && history.applications.length > 0 ? (
          <div className="space-y-4">
            {history.applications.map((application, index) => (
              <Card
                as={motion.div}
                key={application.application_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                padding="lg"
                className="border border-gray-200 overflow-hidden dark:border-dark-300"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                      {application.role_title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {application.company_name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span className="ml-1 capitalize">{application.status}</span>
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center dark:bg-blue-900/20 dark:text-blue-300">
                      {getMethodIcon(application.application_method)}
                      <span className="ml-1 capitalize">{application.application_method}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Applied on {new Date(application.application_date).toLocaleDateString()}</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {application.resume_pdf_url && (
                    <a
                      href={application.resume_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-xl hover:bg-blue-200 transition-colors text-sm font-semibold dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      <Download className="w-4 h-4" />
                      <span>Resume</span>
                    </a>
                  )}

                  {application.screenshot_url && (
                    <a
                      href={application.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-xl hover:bg-green-200 transition-colors text-sm font-semibold dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Screenshot</span>
                    </a>
                  )}

                  {application.redirect_url && (
                    <a
                      href={application.redirect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-xl hover:bg-purple-200 transition-colors text-sm font-semibold dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Job Link</span>
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto text-center space-y-4">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto dark:bg-dark-200">
                <FileText className="w-10 h-10 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No Applications Yet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Start applying to jobs to see your application history here.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/jobs')}
                  className="btn-primary h-12 px-5 rounded-xl text-sm font-semibold"
                >
                  Latest Jobs
                </button>
                <button
                  onClick={loadApplicationHistory}
                  className="btn-secondary h-12 px-5 rounded-xl text-sm font-semibold"
                >
                  Refresh
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
