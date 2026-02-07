import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Eye, ArrowRight } from 'lucide-react';
import { BlogPostWithRelations } from '../../types/blog';
import { blogService } from '../../services/blogService';

interface BlogPostCardProps {
  post: BlogPostWithRelations;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const readingTime = blogService.calculateReadingTime(post.body_content);

  return (
    <article
      onClick={() => navigate(`/blog/${post.slug}`)}
      className="group bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-md hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden cursor-pointer border border-slate-700/50 hover:border-emerald-500/30"
    >
      {post.featured_image_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.categories?.slice(0, 2).map((category) => (
            <span
              key={category.id}
              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30"
            >
              {category.name}
            </span>
          ))}
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="text-slate-400 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.view_count}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm group-hover:gap-3 transition-all">
            Read More
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </article>
  );
};
