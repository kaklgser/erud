import React, { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, X, Calendar, Tag } from 'lucide-react';
import { jobUpdatesService } from '../../services/jobUpdatesService';
import type { JobUpdate } from '../../types/jobs';

export const LatestJobUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<JobUpdate[]>([]);
  const [featuredUpdates, setFeaturedUpdates] = useState<JobUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<JobUpdate | null>(null);

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      setLoading(true);
      const [latest, featured] = await Promise.all([
        jobUpdatesService.getLatestUpdates(6),
        jobUpdatesService.getFeaturedUpdates()
      ]);
      setUpdates(latest);
      setFeaturedUpdates(featured);
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Latest Job Market Updates</h2>
        </div>

        {featuredUpdates.length > 0 && (
          <div className="mb-6 pb-6 border-b border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredUpdates.map((update) => (
                <FeaturedUpdateCard
                  key={update.id}
                  update={update}
                  onClick={() => setSelectedUpdate(update)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {updates.map((update) => (
            <UpdateCard
              key={update.id}
              update={update}
              onClick={() => setSelectedUpdate(update)}
            />
          ))}
        </div>
      </div>

      {selectedUpdate && (
        <UpdateDetailsModal
          update={selectedUpdate}
          onClose={() => setSelectedUpdate(null)}
        />
      )}
    </>
  );
};

interface FeaturedUpdateCardProps {
  update: JobUpdate;
  onClick: () => void;
}

const FeaturedUpdateCard: React.FC<FeaturedUpdateCardProps> = ({ update, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border-2 border-yellow-300 p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
    >
      {update.image_url && (
        <img
          src={update.image_url}
          alt={update.title}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}
      <div className="flex items-start gap-2 mb-2">
        <span
          className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${jobUpdatesService.getCategoryColor(
            update.category
          )}`}
        >
          {jobUpdatesService.getCategoryLabel(update.category)}
        </span>
        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">
          Featured
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{update.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2">{update.description}</p>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <Calendar className="w-3 h-3" />
        {new Date(update.published_at).toLocaleDateString()}
      </div>
    </div>
  );
};

interface UpdateCardProps {
  update: JobUpdate;
  onClick: () => void;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ update, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${jobUpdatesService.getCategoryColor(
                update.category
              )}`}
            >
              {jobUpdatesService.getCategoryLabel(update.category)}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(update.published_at).toLocaleDateString()}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{update.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{update.description}</p>
          {update.metadata?.tags && update.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {update.metadata.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {update.image_url && (
          <img
            src={update.image_url}
            alt={update.title}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
};

interface UpdateDetailsModalProps {
  update: JobUpdate;
  onClose: () => void;
}

const UpdateDetailsModal: React.FC<UpdateDetailsModalProps> = ({ update, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${jobUpdatesService.getCategoryColor(
                update.category
              )}`}
            >
              {jobUpdatesService.getCategoryLabel(update.category)}
            </span>
            {update.is_featured && (
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">
                Featured
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {update.image_url && (
            <img
              src={update.image_url}
              alt={update.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-3">{update.title}</h2>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(update.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            {update.source_platform && (
              <span>Source: {update.source_platform}</span>
            )}
          </div>

          <p className="text-lg text-gray-700 mb-4">{update.description}</p>

          <div className="prose max-w-none mb-6">
            <div className="whitespace-pre-wrap text-gray-800">{update.content}</div>
          </div>

          {update.metadata?.stats && Object.keys(update.metadata.stats).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Key Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(update.metadata.stats).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {update.metadata?.companies && update.metadata.companies.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Related Companies</h3>
              <div className="flex flex-wrap gap-2">
                {update.metadata.companies.map((company, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {company}
                  </span>
                ))}
              </div>
            </div>
          )}

          {update.metadata?.links && update.metadata.links.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Related Links</h3>
              <div className="space-y-2">
                {update.metadata.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {update.metadata?.tags && update.metadata.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {update.metadata.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {update.external_link && (
            <a
              href={update.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Original Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
