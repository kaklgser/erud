import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Search,
  Video,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import { webinarService } from '../../services/webinarService';
import { useAuth } from '../../contexts/AuthContext';
import { DarkPageWrapper } from '../ui';
import type { Webinar, WebinarFilters } from '../../types/webinar';

type WebinarsPageProps = {
  onShowAuth?: () => void;
};

export const WebinarsPage: React.FC<WebinarsPageProps> = ({ onShowAuth }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my-webinars'>('all');

  useEffect(() => {
    loadWebinars();
    if (user) {
      loadMyRegistrations();
    }
  }, [user]);

  const loadWebinars = async () => {
    try {
      setLoading(true);
      const filters: WebinarFilters = {};
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus as any;
      }
      if (showFeaturedOnly) {
        filters.is_featured = true;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }
      const data = await webinarService.getAllWebinars(filters);
      setWebinars(data);
    } catch (error) {
      console.error('Error loading webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistrations = async () => {
    if (!user) return;
    try {
      const registrations = await webinarService.getUserRegistrations(user.id);
      setMyRegistrations(registrations);
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadWebinars();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, selectedStatus, showFeaturedOnly]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      case 'live':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'completed':
        return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const calculateDaysUntil = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const WebinarCard: React.FC<{ webinar: Webinar; registrationId?: string }> = ({ webinar, registrationId }) => {
    const discountPercentage = Math.round(
      ((webinar.original_price - webinar.discounted_price) / webinar.original_price) * 100
    );
    const daysUntil = calculateDaysUntil(webinar.scheduled_at);
    const isRegistered = myRegistrations.some(reg => reg.webinar_id === webinar.id) || Boolean(registrationId);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-surface overflow-hidden hover:shadow-emerald-glow hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1"
      >
        <div className="relative h-48 bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-700 flex items-center justify-center">
          {webinar.thumbnail_url ? (
            <img src={webinar.thumbnail_url} alt={webinar.title} className="w-full h-full object-cover" />
          ) : (
            <Video className="w-16 h-16 text-white opacity-50" />
          )}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(webinar.status)}`}>
              {webinar.status.toUpperCase()}
            </span>
          </div>
          {webinar.is_featured && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-slate-900 flex items-center">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </span>
            </div>
          )}
          {isRegistered && (
            <div className="absolute bottom-4 left-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                Registered
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-100 mb-2 line-clamp-2">{webinar.title}</h3>
          <p className="text-slate-400 mb-4 line-clamp-2 text-sm">{webinar.short_description || webinar.description}</p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-slate-400">
              <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
              {new Date(webinar.scheduled_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
              })}
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <Clock className="w-4 h-4 mr-2 text-cyan-400" />
              {new Date(webinar.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              {' · '}{webinar.duration_minutes} mins
            </div>
            <div className="flex items-center text-sm text-slate-400">
              <Users className="w-4 h-4 mr-2 text-cyan-400" />
              {webinar.max_attendees
                ? `${webinar.max_attendees - webinar.current_attendees} spots left`
                : `${webinar.current_attendees} registered`}
            </div>
          </div>

          {webinar.status === 'upcoming' && (
            <div className="mb-4 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-300 font-medium">
                {daysUntil <= 0 ? 'Starts today!' : daysUntil === 1 ? 'Starts tomorrow!' : `Starts in ${daysUntil} days`}
              </p>
            </div>
          )}

          <div className={`flex items-center justify-between mb-4 ${registrationId ? 'hidden' : ''}`}>
            <div>
              <span className="text-slate-500 line-through text-sm">₹{(webinar.original_price / 100).toFixed(0)}</span>
              <span className="text-2xl font-bold text-slate-100 ml-2">₹{(webinar.discounted_price / 100).toFixed(0)}</span>
              {discountPercentage > 0 && (
                <span className="ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs font-semibold">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>

          {registrationId && (
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded text-sm font-semibold">Enrolled</span>
            </div>
          )}

          <button
            onClick={() => navigate(registrationId ? `/webinar-details/${registrationId}` : `/webinar/${webinar.slug}`)}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-emerald-glow"
          >
            {isRegistered ? 'View Details' : 'Register Now'}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    );
  };

  const MyWebinarsTab = () => {
    if (!user) {
      return (
        <div className="text-center py-20">
          <p className="text-slate-400 mb-4">Please log in to view your registered webinars.</p>
          <button
            onClick={() => onShowAuth?.()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-colors font-semibold"
          >
            Log In
          </button>
        </div>
      );
    }

    if (myRegistrations.length === 0) {
      return (
        <div className="text-center py-20">
          <Video className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">You haven't registered for any webinars yet.</p>
          <button
            onClick={() => setActiveTab('all')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-colors font-semibold"
          >
            Browse Webinars
          </button>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myRegistrations.map((registration) => (
          <div key={registration.id} className="relative">
            {registration.webinar && <WebinarCard webinar={registration.webinar} registrationId={registration.id} />}
            {registration.payment_status === 'completed' && registration.meet_link_sent && (
              <div className="mt-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                <p className="text-sm text-emerald-300 mb-1 font-medium">✓ Registration Confirmed</p>
                <p className="text-xs text-emerald-400/70">Meeting link has been sent to your email</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <DarkPageWrapper>
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Upcoming Webinars</h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Join expert-led sessions to master your skills and ace your career goals
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs & Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-emerald-500/50'
                }`}
              >
                All Webinars
              </button>
              {user && (
                <button
                  onClick={() => setActiveTab('my-webinars')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'my-webinars'
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  My Webinars
                  {myRegistrations.length > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 text-xs rounded-full">{myRegistrations.length}</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {activeTab === 'all' && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search webinars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                className={`px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  showFeaturedOnly
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-amber-500/50'
                }`}
              >
                <Star className={`w-5 h-5 ${showFeaturedOnly ? 'fill-current' : ''}`} />
                Featured
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === 'all' ? (
          loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : webinars.length === 0 ? (
            <div className="text-center py-20">
              <Video className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No webinars found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webinars.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} />
              ))}
            </div>
          )
        ) : (
          <MyWebinarsTab />
        )}
      </div>
    </DarkPageWrapper>
  );
};
