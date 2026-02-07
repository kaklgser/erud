// src/components/pages/Tutorials.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Download,
  ArrowRight,
  Lightbulb,
  Target,
  Zap,
  Award,
  Search,
  Sparkles,
} from 'lucide-react';
import { VideoModal } from '../VideoModal';
import { DarkPageWrapper, ChristmasTree, GiftBox } from '../ui';
import { Card } from '../common/Card';
import { PageSidebar } from '../navigation/PageSidebar';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export const Tutorials: React.FC = () => {
  const isChristmas = new Date().getMonth() === 11 || new Date().getMonth() === 0;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVideoModalOpen, setIsVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');

  const categories = [
    { id: 'all', name: 'All Tutorials', count: 0 },
    { id: 'getting-started', name: 'Getting Started', count: 0 },
    { id: 'tools-overview', name: 'Tools Overview', count: 0 },
    { id: 'job-strategy', name: 'Job Strategy', count: 0 },
    { id: 'advanced-strategy', name: 'Advanced Strategy', count: 0 },
    { id: 'linkedin-tips', name: 'LinkedIn Tips', count: 0 },
    { id: 'interview-prep', name: 'Interview Prep', count: 0 },
    { id: 'optimization', name: 'Optimization', count: 0 },
    { id: 'analysis', name: 'Analysis', count: 0 },
  ];

  const allTutorials = [
    {
      id: 1,
      title: 'Getting Started with PrimoBoost AI',
      description: 'Get started on your first resume.',
      duration: '2:52',
      difficulty: 'Beginner',
      category: 'getting-started',
      thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '12.5K',
      rating: 4.9,
      videoUrl: 'https://www.youtube.com/watch?v=x6AD2JsGafA',
      isPopular: true,
    },
    {
      id: 2,
      title: 'JD-Based Resume Optimization',
      description: 'Master the art of tailoring your resume to specific job descriptions.',
      duration: '2:30',
      difficulty: 'Intermediate',
      category: 'optimization',
      thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '8.2K',
      rating: 4.8,
      videoUrl: 'https://www.youtube.com/watch?v=_Jez3fo4NJs',
      isPopular: false,
    },
    {
      id: 3,
      title: 'Resume Score Analysis Deep Dive',
      description: 'Understand how our AI scores your resume and what each metric means.',
      duration: '6:20',
      difficulty: 'Beginner',
      category: 'analysis',
      thumbnail: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '15.1K',
      rating: 4.9,
      videoUrl: 'https://res.cloudinary.com/dlkovvlud/video/upload/v1700000000/sample_video.mp4',
      isPopular: true,
    },
    {
      id: 4,
      title: 'Mastering PrimoBoost AI: Your Four Essential Tools',
      description: 'A comprehensive guide on effectively utilizing all our tools.',
      duration: '10:15',
      difficulty: 'Beginner',
      category: 'tools-overview',
      thumbnail: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '5.3K',
      rating: 4.7,
      videoUrl: 'https://res.cloudinary.com/dlkovvlud/video/upload/v1700000000/sample_video.mp4',
      isPopular: false,
    },
    {
      id: 5,
      title: 'Job Search Mastery: Strategies to Land Your Dream Role',
      description: 'Learn proven techniques for effective job searching and interview preparation.',
      duration: '12:00',
      difficulty: 'Intermediate',
      category: 'job-strategy',
      thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '7.8K',
      rating: 4.9,
      videoUrl: 'https://res.cloudinary.com/dlkovvlud/video/upload/v1700000000/sample_video.mp4',
      isPopular: true,
    },
    {
      id: 6,
      title: "Cracking the Job Market: Combining AI Tools for Success",
      description: "Discover how to integrate PrimoBoost AI's tools to create a powerful job application strategy.",
      duration: '15:40',
      difficulty: 'Advanced',
      category: 'advanced-strategy',
      thumbnail: 'https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=600',
      views: '6.1K',
      rating: 4.8,
      videoUrl: 'https://res.cloudinary.com/dlkovvlud/video/upload/v1700000000/sample_video.mp4',
      isPopular: false,
    },
  ];

  const updatedCategories = categories.map((cat) => {
    if (cat.id === 'all') return { ...cat, count: allTutorials.length };
    const count = allTutorials.filter((t) => t.category === cat.id).length;
    return { ...cat, count };
  });

  const filteredTutorials = allTutorials.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const s = searchTerm.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s);
    return matchesCategory && matchesSearch;
  });

  const totalResults = filteredTutorials.length;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const mainVideoTutorial = filteredTutorials.length > 0 ? filteredTutorials[0] : allTutorials[0];

  const openVideoModal = (videoUrl: string, title: string) => {
    const embedUrl = videoUrl.replace('watch?v=', 'embed/');
    setCurrentVideoUrl(embedUrl);
    setCurrentVideoTitle(title);
    setIsVideoModal(true);
  };

  const closeVideoModal = () => {
    setIsVideoModal(false);
    setCurrentVideoUrl('');
    setCurrentVideoTitle('');
  };

  const learningPath = [
    { step: 1, title: 'Start with Basics', description: 'Learn how to upload your resume and understand the optimization process', duration: '15 minutes', icon: <Lightbulb className="w-6 h-6" /> },
    { step: 2, title: 'Master ATS Optimization', description: 'Understand how ATS systems work and optimize your resume accordingly', duration: '30 minutes', icon: <Target className="w-6 h-6" /> },
    { step: 3, title: 'Advanced Techniques', description: 'Learn keyword optimization, formatting, and industry-specific tips', duration: '45 minutes', icon: <Zap className="w-6 h-6" /> },
    { step: 4, title: 'Practice & Perfect', description: 'Apply your knowledge and create multiple optimized versions', duration: '60 minutes', icon: <Award className="w-6 h-6" /> },
  ];

  const highlights = [
    { title: 'Guided paths', value: '4 steps', accent: 'from-emerald-500/30 to-cyan-500/20' },
    { title: 'Videos', value: `${allTutorials.length}+`, accent: 'from-blue-500/30 to-sky-500/20' },
    { title: 'Avg. rating', value: '4.8/5', accent: 'from-amber-500/30 to-orange-500/20' },
    { title: 'Formats', value: 'Beginner to Advanced', accent: 'from-fuchsia-500/30 to-purple-500/20' },
  ];

  return (
    <DarkPageWrapper showSnow={isChristmas} showSanta={isChristmas}>
      {/* Page Sidebar */}
      <PageSidebar />
      
      {/* Main Content - with left margin for sidebar on desktop */}
      <div className="lg:ml-16 bg-gradient-to-b from-slate-950 via-slate-930 to-slate-950">
        {/* Hero Section */}
        <section className="relative pt-20 sm:pt-24 pb-16 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-20 w-72 h-72 bg-emerald-500/20 blur-[110px]" />
          <div className="absolute top-10 right-0 w-60 h-60 bg-cyan-500/15 blur-[100px]" />
        </div>
        <div className="container-responsive relative">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-5xl mx-auto space-y-6"
          >
            {isChristmas && (
              <div className="flex justify-center gap-4 mb-4">
                <ChristmasTree size="sm" />
                <GiftBox />
                <ChristmasTree size="sm" />
              </div>
            )}

            <motion.div 
              variants={itemVariants}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto shadow-[0_15px_50px_-12px_rgba(16,185,129,0.45)] ${
                isChristmas
                  ? 'bg-gradient-to-br from-red-500/30 to-green-500/30 border border-red-400/40'
                  : 'bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-400/40'
              }`}
            >
              <BookOpen className={`w-10 h-10 ${isChristmas ? 'text-red-200' : 'text-emerald-100'}`} />
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white"
            >
              Learn & Master
              <span className={`block bg-gradient-to-r bg-clip-text text-transparent ${
                isChristmas
                  ? 'from-red-300 via-yellow-300 to-green-300'
                  : 'from-emerald-300 via-cyan-300 to-blue-300'
              }`}>
                Resume Optimization
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto px-4"
            >
              Watch our comprehensive tutorials and transform your career with expert guidance.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2"
            >
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border border-white/10 bg-gradient-to-br ${item.accent} px-3 py-3 sm:px-4 sm:py-4 text-left shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]`}
                >
                  <p className="text-[11px] sm:text-xs uppercase tracking-wide text-slate-200/80 mb-1">{item.title}</p>
                  <p className="text-sm sm:text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Tutorial */}
      <section className="relative py-12 sm:py-16">
        <div className="container-responsive max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {isChristmas ? '🎄 ' : ''}Featured Tutorial{isChristmas ? ' 🎄' : ''}
            </h2>
            <p className="text-slate-300">Watch our top recommended guide to get started</p>
          </motion.div>

          {mainVideoTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card padding="lg" className="overflow-hidden bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[0_25px_60px_-30px_rgba(0,0,0,0.6)]">
                    <iframe
                      src={mainVideoTutorial.videoUrl.replace('watch?v=', 'embed/')}
                      title={mainVideoTutorial.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(mainVideoTutorial.difficulty)}`}>
                        {mainVideoTutorial.difficulty}
                      </span>
                      <span className="text-slate-400 text-sm flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {mainVideoTutorial.duration}
                      </span>
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(mainVideoTutorial.rating) ? 'fill-current' : ''}`} />
                        ))}
                        <span className="ml-1 text-slate-300 text-sm">{mainVideoTutorial.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white">{mainVideoTutorial.title}</h3>
                    <p className="text-slate-300">{mainVideoTutorial.description}</p>

                    <div className="flex flex-wrap gap-3">
                      <span className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                        isChristmas ? 'bg-green-500/20 text-green-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <Users className="w-4 h-4 mr-2" />
                        {mainVideoTutorial.views} views
                      </span>
                      <button
                        onClick={() => window.open(mainVideoTutorial.videoUrl, '_blank')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                          isChristmas
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                        }`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Watch Now
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </section>


      {/* All Tutorials */}
      <section className="relative py-12 sm:py-16 bg-slate-900/50">
        <div className="container-responsive max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">All Tutorials</h2>
            <p className="text-slate-300">Browse our full library of guides and videos</p>
          </motion.div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search tutorials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-base pl-10 bg-slate-900/70 border border-slate-800/70"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
            <div className="flex flex-wrap gap-2">
              {updatedCategories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                      active
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.6)]'
                        : 'bg-slate-900/60 border-slate-800/70 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <span className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/70">
                {totalResults} {totalResults === 1 ? 'tutorial' : 'tutorials'}
              </span>
              <span className="hidden sm:inline text-slate-500">Curated for your path</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-400/30 rounded-full px-3 py-1">
              <Sparkles className="w-4 h-4" />
              Modern UI refresh
            </div>
          </div>

          {/* Tutorial Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {filteredTutorials.map((tutorial) => (
              <motion.div
                key={tutorial.id}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card padding="md" className="h-full group bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                  <div
                    className="relative aspect-video overflow-hidden rounded-xl mb-4 cursor-pointer"
                    onClick={() => window.open(tutorial.videoUrl, '_blank')}
                  >
                    <img
                      src={tutorial.thumbnail}
                      alt={tutorial.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
                        <Play className="w-5 h-5 text-white" />
                        <span className="text-white text-sm font-semibold">Watch</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(tutorial.difficulty)}`}>
                      {tutorial.difficulty}
                    </span>
                    <span className="text-slate-400 text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {tutorial.duration}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2">{tutorial.title}</h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{tutorial.description}</p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(tutorial.rating) ? 'fill-current' : ''}`} />
                      ))}
                      <span className="ml-1 text-slate-400 text-xs">{tutorial.rating}</span>
                    </div>
                    <button
                      onClick={() => openVideoModal(tutorial.videoUrl, tutorial.title)}
                      className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                        isChristmas ? 'text-green-400 hover:text-green-300' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      Watch <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}

            {filteredTutorials.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg text-slate-400">No tutorials found matching your criteria.</p>
                <p className="text-sm text-slate-500">Try adjusting your search or filter options.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="relative py-16 sm:py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-10 w-40 h-40 bg-emerald-500/10 blur-[90px]" />
          <div className="absolute bottom-0 right-6 w-48 h-48 bg-cyan-500/10 blur-[120px]" />
        </div>
        <div className="container-responsive max-w-5xl relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-100 text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4" />
              Guided Learning Path
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {isChristmas ? '⭐ ' : ''}Recommended Learning Path{isChristmas ? ' ⭐' : ''}
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">Follow this structured path to move from basics to pro-level mastery.</p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-12 gap-4"
          >
            {learningPath.map((item, index) => {
              const spans = ['md:col-span-7 lg:col-span-7', 'md:col-span-5 lg:col-span-5', 'md:col-span-6', 'md:col-span-6'];
              const spanClass = spans[index] || 'md:col-span-6';
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className={`col-span-1 ${spanClass}`}
                >
                  <Card padding="lg" className="group h-full bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl shadow-[0_20px_50px_-24px_rgba(0,0,0,0.7)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-blue-500/5" />
                    <div className="flex items-start gap-4 sm:gap-5 relative">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0 shadow-lg ${
                        isChristmas
                          ? 'bg-gradient-to-r from-red-500 to-green-600'
                          : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                      }`}>
                        {item.step}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className={`${isChristmas ? 'text-green-300' : 'text-emerald-300'}`}>{item.icon}</span>
                          <h3 className="text-base sm:text-lg font-semibold text-white">{item.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isChristmas
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-emerald-500/15 text-emerald-200'
                          }`}>
                            {item.duration}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="h-1 w-16 rounded-full bg-emerald-400/40" />
                          <span>Next: Stay consistent</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 left-6 w-48 h-48 bg-emerald-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-6 w-56 h-56 bg-cyan-500/10 blur-[140px]" />
        </div>
        <div className="container-responsive relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto rounded-3xl p-8 sm:p-10 lg:p-12 bg-slate-900/80 border border-slate-800/70 backdrop-blur-xl shadow-[0_30px_70px_-40px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="absolute inset-0 opacity-60 bg-gradient-to-r from-emerald-600/30 via-cyan-600/25 to-blue-700/30" />
            <div className="relative grid lg:grid-cols-[1.6fr_1fr] gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 px-4 py-2 rounded-full text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Ready to Transform Your Career?
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {isChristmas ? '🎁 ' : ''}Start Learning Today{isChristmas ? ' 🎁' : ''}
                </h2>
                <p className="text-slate-200/90 max-w-2xl">
                  Join thousands of professionals who have transformed their careers with our tutorials—practical, concise, and built for real results.
                </p>

                <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Users className="w-4 h-4 text-emerald-300" />
                    50k+ learners
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Star className="w-4 h-4 text-amber-300" />
                    4.8/5 avg. rating
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Clock className="w-4 h-4 text-cyan-300" />
                    Bite-sized lessons
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 h-12 sm:h-13 px-6 sm:px-7 rounded-xl text-base sm:text-lg font-semibold text-slate-900 bg-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                  >
                    Start Learning Now
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 h-12 sm:h-13 px-6 sm:px-7 rounded-xl text-base sm:text-lg font-semibold text-white border border-white/25 bg-white/10 hover:bg-white/15 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download Free Guide
                  </motion.button>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4" />
                    What you get
                  </div>
                  <div className="space-y-2 text-sm text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      Curated learning paths for ATS success
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      Video walkthroughs with actionable steps
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-300" />
                      Downloadable checklists and guides
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 via-cyan-500/15 to-blue-600/15 border border-emerald-400/30 p-4 text-white shadow-[0_20px_60px_-35px_rgba(16,185,129,0.6)]">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-100 mb-1">Momentum</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">Daily 15-min plan</div>
                      <p className="text-sm text-emerald-50/80">Stay consistent, see results in a week.</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-lg font-semibold">
                      7d
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

        {/* Footer spacer */}
        <div className="h-8" />

        <VideoModal
          isOpen={isVideoModalOpen}
          onClose={closeVideoModal}
          videoUrl={currentVideoUrl}
          title={currentVideoTitle}
        />
      </div>
    </DarkPageWrapper>
  );
};
