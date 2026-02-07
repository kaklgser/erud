import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  ArrowLeft,
  Calendar,
  Users,
  Video,
  Star,
  StarOff,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock,
  IndianRupee,
  Image,
  X,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { Webinar, WebinarStatus, CreateWebinarData } from '../../types/webinar';

interface WebinarFormData {
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  banner_url: string;
  banner_alt_text: string;
  scheduled_at: string;
  duration_minutes: number;
  meet_link: string;
  original_price: number;
  discounted_price: number;
  max_attendees: number;
  status: WebinarStatus;
  is_featured: boolean;
  target_audience: string;
  prerequisites: string;
  learning_outcomes: string;
}

const defaultFormData: WebinarFormData = {
  title: '',
  slug: '',
  description: '',
  short_description: '',
  thumbnail_url: '',
  banner_url: '',
  banner_alt_text: '',
  scheduled_at: '',
  duration_minutes: 60,
  meet_link: '',
  original_price: 0,
  discounted_price: 0,
  max_attendees: 100,
  status: 'upcoming',
  is_featured: false,
  target_audience: '',
  prerequisites: '',
  learning_outcomes: ''
};

export const AdminWebinarsPage: React.FC = () => {
  const navigate = useNavigate();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | WebinarStatus>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [webinarToDelete, setWebinarToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);
  const [formData, setFormData] = useState<WebinarFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchWebinars();
  }, [filterStatus]);

  const fetchWebinars = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('webinars')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWebinars(data || []);
    } catch (error) {
      console.error('Error fetching webinars:', error);
      showNotification('error', 'Failed to fetch webinars');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const openAddModal = () => {
    setEditingWebinar(null);
    setFormData(defaultFormData);
    setShowFormModal(true);
  };

  const openEditModal = (webinar: Webinar) => {
    setEditingWebinar(webinar);
    setFormData({
      title: webinar.title,
      slug: webinar.slug,
      description: webinar.description,
      short_description: webinar.short_description || '',
      thumbnail_url: webinar.thumbnail_url || '',
      banner_url: webinar.banner_url || '',
      banner_alt_text: webinar.banner_alt_text || '',
      scheduled_at: webinar.scheduled_at ? new Date(webinar.scheduled_at).toISOString().slice(0, 16) : '',
      duration_minutes: webinar.duration_minutes,
      meet_link: webinar.meet_link,
      original_price: webinar.original_price,
      discounted_price: webinar.discounted_price,
      max_attendees: webinar.max_attendees || 100,
      status: webinar.status,
      is_featured: webinar.is_featured,
      target_audience: webinar.target_audience?.join(', ') || '',
      prerequisites: webinar.prerequisites?.join(', ') || '',
      learning_outcomes: webinar.learning_outcomes?.outcomes?.join('\n') || ''
    });
    setShowFormModal(true);
  };

  const handleSaveWebinar = async () => {
    if (!formData.title || !formData.slug || !formData.description || !formData.meet_link) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const webinarData: CreateWebinarData & { status?: WebinarStatus } = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        short_description: formData.short_description || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        banner_url: formData.banner_url || undefined,
        banner_alt_text: formData.banner_alt_text || undefined,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : new Date().toISOString(),
        duration_minutes: formData.duration_minutes,
        meet_link: formData.meet_link,
        original_price: formData.original_price,
        discounted_price: formData.discounted_price,
        max_attendees: formData.max_attendees || undefined,
        is_featured: formData.is_featured,
        target_audience: formData.target_audience ? formData.target_audience.split(',').map(s => s.trim()).filter(Boolean) : [],
        prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map(s => s.trim()).filter(Boolean) : [],
        learning_outcomes: formData.learning_outcomes
          ? { outcomes: formData.learning_outcomes.split('\n').map(s => s.trim()).filter(Boolean) }
          : undefined,
        status: formData.status
      };

      if (editingWebinar) {
        const { error } = await supabase
          .from('webinars')
          .update({ ...webinarData, updated_at: new Date().toISOString() })
          .eq('id', editingWebinar.id);
        if (error) throw error;
        showNotification('success', 'Webinar updated successfully');
      } else {
        const { error } = await supabase.from('webinars').insert(webinarData);
        if (error) throw error;
        showNotification('success', 'Webinar created successfully');
      }

      setShowFormModal(false);
      fetchWebinars();
    } catch (error: any) {
      console.error('Error saving webinar:', error);
      showNotification('error', error.message || 'Failed to save webinar');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeatured = async (webinarId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('webinars')
        .update({ is_featured: !currentFeatured })
        .eq('id', webinarId);

      if (error) throw error;
      setWebinars(webinars.map(w =>
        w.id === webinarId ? { ...w, is_featured: !currentFeatured } : w
      ));
      showNotification('success', `Webinar ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error) {
      console.error('Error toggling featured status:', error);
      showNotification('error', 'Failed to update featured status');
    }
  };

  const handleDeleteWebinar = async () => {
    if (!webinarToDelete) return;

    try {
      const { error } = await supabase.from('webinars').delete().eq('id', webinarToDelete);
      if (error) throw error;

      setWebinars(webinars.filter(w => w.id !== webinarToDelete));
      showNotification('success', 'Webinar deleted successfully');
      setShowDeleteModal(false);
      setWebinarToDelete(null);
    } catch (error) {
      console.error('Error deleting webinar:', error);
      showNotification('error', 'Failed to delete webinar');
    }
  };

  const filteredWebinars = webinars.filter(w => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: webinars.length,
    upcoming: webinars.filter(w => w.status === 'upcoming').length,
    live: webinars.filter(w => w.status === 'live').length,
    completed: webinars.filter(w => w.status === 'completed').length,
    featured: webinars.filter(w => w.is_featured).length
  };

  const getStatusBadge = (status: WebinarStatus) => {
    const styles: Record<WebinarStatus, string> = {
      upcoming: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
      live: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
      completed: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
    };
    return styles[status];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-dark-50 dark:to-dark-200 lg:pl-16 pb-20">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 dark:bg-dark-50 dark:border-dark-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 py-3">
            <button
              onClick={() => navigate('/admin/jobs')}
              className="lg:hidden bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-400 hover:to-cyan-400 py-3 px-5 rounded-xl inline-flex items-center space-x-2 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:block">Back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Admin - Manage Webinars</h1>
            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-3 px-5 rounded-xl inline-flex items-center space-x-2 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:block">Add Webinar</span>
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in-down">
          <div className={`p-4 rounded-xl shadow-lg border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-500/50 dark:text-green-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md p-4 border border-gray-200 dark:border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md p-4 border border-gray-200 dark:border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.upcoming}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-500/20 w-10 h-10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md p-4 border border-gray-200 dark:border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Live</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.live}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-500/20 w-10 h-10 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md p-4 border border-gray-200 dark:border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{stats.completed}</p>
              </div>
              <div className="bg-gray-100 dark:bg-dark-200 w-10 h-10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md p-4 border border-gray-200 dark:border-dark-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Featured</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.featured}</p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-500/20 w-10 h-10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md border border-gray-200 dark:border-dark-300 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search webinars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin" />
          </div>
        ) : filteredWebinars.length === 0 ? (
          <div className="bg-white dark:bg-dark-100 rounded-xl shadow-md border border-gray-200 dark:border-dark-300 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No webinars found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Start by creating your first webinar'}
            </p>
            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-3 px-6 rounded-xl inline-flex items-center space-x-2 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Webinar</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWebinars.map(webinar => (
              <div
                key={webinar.id}
                className="bg-white dark:bg-dark-100 rounded-xl shadow-md border border-gray-200 dark:border-dark-300 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-shrink-0 w-full lg:w-48 h-32 bg-gray-100 dark:bg-dark-200 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-300">
                    {webinar.banner_url || webinar.thumbnail_url ? (
                      <img
                        src={webinar.banner_url || webinar.thumbnail_url}
                        alt={webinar.banner_alt_text || webinar.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {webinar.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {webinar.short_description || webinar.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(webinar.status)}`}>
                          {webinar.status.charAt(0).toUpperCase() + webinar.status.slice(1)}
                        </span>
                        {webinar.is_featured && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(webinar.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{webinar.duration_minutes} mins</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{webinar.current_attendees}/{webinar.max_attendees || 'Unlimited'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="w-4 h-4" />
                        <span className="line-through text-gray-400">{webinar.original_price}</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{webinar.discounted_price}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/webinar/${webinar.slug}`)}
                        className="flex items-center space-x-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => openEditModal(webinar)}
                        className="flex items-center space-x-1 px-4 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => toggleFeatured(webinar.id, webinar.is_featured)}
                        className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                          webinar.is_featured
                            ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-500/10 dark:hover:bg-gray-500/20 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {webinar.is_featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                        <span>{webinar.is_featured ? 'Unfeature' : 'Feature'}</span>
                      </button>

                      {webinar.meet_link && (
                        <a
                          href={webinar.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-4 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Meet Link</span>
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setWebinarToDelete(webinar.id);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center space-x-1 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900/20 w-12 h-12 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Webinar?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this webinar? This will also delete all associated registrations.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setWebinarToDelete(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWebinar}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-dark-100 rounded-2xl shadow-2xl max-w-4xl w-full my-8 border border-gray-200 dark:border-dark-300">
            <div className="sticky top-0 bg-white dark:bg-dark-100 border-b border-gray-200 dark:border-dark-300 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingWebinar ? 'Edit Webinar' : 'Add New Webinar'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter webinar title"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="webinar-slug"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as WebinarStatus }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                    placeholder="Brief description (shown in cards)"
                    maxLength={150}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.short_description.length}/150 characters</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter detailed description"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div className="md:col-span-2 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
                  <h4 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Banner Image
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Banner URL
                      </label>
                      <input
                        type="url"
                        value={formData.banner_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, banner_url: e.target.value }))}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Banner Alt Text
                      </label>
                      <input
                        type="text"
                        value={formData.banner_alt_text}
                        onChange={(e) => setFormData(prev => ({ ...prev, banner_alt_text: e.target.value }))}
                        placeholder="Describe the banner image"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                      />
                    </div>
                    {formData.banner_url && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
                        <div className="relative w-full h-48 bg-gray-100 dark:bg-dark-200 rounded-xl overflow-hidden border border-gray-200 dark:border-dark-300">
                          <img
                            src={formData.banner_url}
                            alt={formData.banner_alt_text || 'Banner preview'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meet Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.meet_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, meet_link: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scheduled Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                    min={15}
                    max={480}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Original Price (INR)
                  </label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_price: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discounted Price (INR)
                  </label>
                  <input
                    type="number"
                    value={formData.discounted_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, discounted_price: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_attendees: parseInt(e.target.value) || 100 }))}
                    min={1}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div className="flex items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Featured Webinar</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.target_audience}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                    placeholder="Freshers, Students, Job Seekers"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prerequisites (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.prerequisites}
                    onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                    placeholder="Basic programming knowledge, Laptop with internet"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Learning Outcomes (one per line)
                  </label>
                  <textarea
                    value={formData.learning_outcomes}
                    onChange={(e) => setFormData(prev => ({ ...prev, learning_outcomes: e.target.value }))}
                    placeholder="Understand ATS scoring mechanisms&#10;Learn to optimize resume keywords&#10;Create an interview-ready resume"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-dark-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-dark-200 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-dark-100 border-t border-gray-200 dark:border-dark-300 px-6 py-4 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-dark-200 dark:hover:bg-dark-300 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWebinar}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSaving ? 'Saving...' : (editingWebinar ? 'Update Webinar' : 'Create Webinar')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
