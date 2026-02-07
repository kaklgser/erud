import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, ExternalLink, TrendingUp } from 'lucide-react';
import { jobUpdatesService } from '../../services/jobUpdatesService';
import type { JobUpdate, JobUpdateCategory, JobUpdateMetadata } from '../../types/jobs';

export const AdminJobUpdatesManager: React.FC = () => {
  const [updates, setUpdates] = useState<JobUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<JobUpdate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    featured: 0,
    byCategory: {} as Record<JobUpdateCategory, number>
  });

  useEffect(() => {
    loadUpdates();
    loadStats();
  }, []);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      const data = await jobUpdatesService.getAllUpdates();
      setUpdates(data);
    } catch (error) {
      console.error('Error loading updates:', error);
      alert('Failed to load job updates');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await jobUpdatesService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this update?')) {
      return;
    }

    try {
      await jobUpdatesService.deleteUpdate(id);
      await loadUpdates();
      await loadStats();
    } catch (error) {
      console.error('Error deleting update:', error);
      alert('Failed to delete update');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await jobUpdatesService.toggleActive(id, !currentStatus);
      await loadUpdates();
      await loadStats();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Failed to update status');
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await jobUpdatesService.toggleFeatured(id, !currentStatus);
      await loadUpdates();
      await loadStats();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    }
  };

  const handleEdit = (update: JobUpdate) => {
    setEditingUpdate(update);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUpdate(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    loadUpdates();
    loadStats();
  };

  const filteredUpdates = updates.filter(update => {
    if (filterCategory === 'all') return true;
    return update.category === filterCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Updates Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage job market updates, news, and announcements
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Update
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Updates" value={stats.total} color="blue" />
        <StatCard title="Active" value={stats.active} color="green" />
        <StatCard title="Featured" value={stats.featured} color="yellow" />
        <StatCard title="Drafts" value={stats.total - stats.active} color="gray" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-gray-700">Filter by category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="market_trend">Market Trend</option>
            <option value="hiring_news">Hiring News</option>
            <option value="industry_update">Industry Update</option>
            <option value="platform_update">Platform Update</option>
            <option value="salary_insights">Salary Insights</option>
            <option value="skill_demand">Skill Demand</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredUpdates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No updates found
            </div>
          ) : (
            filteredUpdates.map((update) => (
              <div
                key={update.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {update.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${jobUpdatesService.getCategoryColor(
                          update.category
                        )}`}
                      >
                        {jobUpdatesService.getCategoryLabel(update.category)}
                      </span>
                      {update.is_featured && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          Featured
                        </span>
                      )}
                      {!update.is_active && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{update.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Published: {new Date(update.published_at).toLocaleDateString()}
                      </span>
                      {update.source_platform && (
                        <span>Source: {update.source_platform}</span>
                      )}
                      {update.external_link && (
                        <a
                          href={update.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Source
                        </a>
                      )}
                    </div>

                    {update.metadata?.tags && update.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {update.metadata.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFeatured(update.id, update.is_featured)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title={update.is_featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      {update.is_featured ? (
                        <StarOff className="w-4 h-4" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleActive(update.id, update.is_active)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title={update.is_active ? 'Set as draft' : 'Publish'}
                    >
                      {update.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(update)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(update.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <UpdateForm
          update={editingUpdate}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'gray';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-600">{title}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-2xl font-bold">{value}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

interface UpdateFormProps {
  update: JobUpdate | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateForm: React.FC<UpdateFormProps> = ({ update, onClose, onSuccess }) => {
  const [title, setTitle] = useState(update?.title || '');
  const [description, setDescription] = useState(update?.description || '');
  const [content, setContent] = useState(update?.content || '');
  const [category, setCategory] = useState<JobUpdateCategory>(update?.category || 'industry_update');
  const [sourcePlatform, setSourcePlatform] = useState(update?.source_platform || '');
  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(update?.metadata || jobUpdatesService.generateDefaultMetadata('industry_update'), null, 2)
  );
  const [imageUrl, setImageUrl] = useState(update?.image_url || '');
  const [externalLink, setExternalLink] = useState(update?.external_link || '');
  const [isFeatured, setIsFeatured] = useState(update?.is_featured || false);
  const [isActive, setIsActive] = useState(update?.is_active ?? true);
  const [publishedAt, setPublishedAt] = useState(
    update?.published_at ? new Date(update.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = (newCategory: JobUpdateCategory) => {
    setCategory(newCategory);
    if (!update) {
      const defaultMetadata = jobUpdatesService.generateDefaultMetadata(newCategory);
      setMetadataJson(JSON.stringify(defaultMetadata, null, 2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let metadata: JobUpdateMetadata;
    try {
      metadata = JSON.parse(metadataJson);
    } catch (error) {
      alert('Invalid JSON in metadata field');
      return;
    }

    const validation = jobUpdatesService.validateMetadata(metadata);
    if (!validation.valid) {
      alert(`Invalid metadata: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        title,
        description,
        content,
        category,
        source_platform: sourcePlatform || undefined,
        metadata,
        image_url: imageUrl || undefined,
        external_link: externalLink || undefined,
        is_featured: isFeatured,
        is_active: isActive,
        published_at: new Date(publishedAt).toISOString(),
      };

      if (update) {
        await jobUpdatesService.updateUpdate(update.id, updateData);
      } else {
        await jobUpdatesService.createUpdate(updateData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving update:', error);
      alert('Failed to save update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {update ? 'Edit Update' : 'Create New Update'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter update title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Short Summary)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Brief description for preview"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
              placeholder="Detailed content of the update"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as JobUpdateCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="market_trend">Market Trend</option>
                <option value="hiring_news">Hiring News</option>
                <option value="industry_update">Industry Update</option>
                <option value="platform_update">Platform Update</option>
                <option value="salary_insights">Salary Insights</option>
                <option value="skill_demand">Skill Demand</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Platform (Optional)
              </label>
              <input
                type="text"
                value={sourcePlatform}
                onChange={(e) => setSourcePlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., LinkedIn, Indeed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metadata (JSON Format)
            </label>
            <textarea
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={8}
              placeholder='{"tags": ["tag1", "tag2"], "stats": {"key": "value"}}'
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Flexible JSON data. Can include tags, stats, links, companies, locations, etc.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                External Link (Optional)
              </label>
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://source.com/article"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Published Date/Time
            </label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Featured (show prominently)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active (publish now)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : update ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
