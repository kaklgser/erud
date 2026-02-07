import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { blogService } from '../../services/blogService';
import { BlogPostWithRelations, BlogCategory } from '../../types/blog';
import { BlogPostCard } from '../blog/BlogPostCard';
import { Breadcrumb } from '../common/Breadcrumb';
import { DarkPageWrapper } from '../ui';

export const BlogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPostWithRelations[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [page, selectedCategory]);

  useEffect(() => {
    const params: any = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    setSearchParams(params);
  }, [searchQuery, selectedCategory, setSearchParams]);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await blogService.fetchAllCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: any = {};
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory !== 'all') filters.category_id = selectedCategory;
      const response = await blogService.fetchPublishedPosts(page, 12, filters);
      setPosts(response.posts);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error('Error loading posts:', err);
      setError(err.message || 'Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  return (
    <DarkPageWrapper>
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-700 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Blog', path: '/blog' }
            ]}
          />
          <div className="flex items-center gap-3 mb-4 mt-4">
            <BookOpen className="w-10 h-10 text-white" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">PrimoBoost AI Blog</h1>
          </div>
          <p className="text-lg text-white/80 max-w-2xl">
            Expert insights on resume optimization, career development, and job search strategies
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search & Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-glow"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Category Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-emerald-500/50'
            }`}
          >
            All Articles
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:border-emerald-500/50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-100 mb-2">No Articles Found</h3>
            <p className="text-slate-400">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Check back soon for new content'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 font-medium hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="text-slate-400">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 font-medium hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DarkPageWrapper>
  );
};
