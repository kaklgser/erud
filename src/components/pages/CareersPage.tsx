// src/components/pages/CareersPage.tsx
import React from 'react';
import {
  MapPin,
  Clock,
  Users,
  Briefcase,
  Target,
  TrendingUp,
  MessageCircle,
  Monitor,
  Database,
  Brain,
  Cpu,
  Cloud,
  Palette,
  BarChart3,
  ArrowRight,
  Sparkles,
  Crown,
  Award,
  Zap,
  FileText,
  Search,
  Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { careersData } from '../../data/careersData';
import { DarkPageWrapper } from '../ui';

interface CareersPageProps {
  isAuthenticated: boolean;
  onShowAuth: (callback?: () => void) => void;
}

export const CareersPage: React.FC<CareersPageProps> = ({ isAuthenticated, onShowAuth }) => {
  const navigate = useNavigate();

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'Frontend': return <Monitor className="w-6 h-6" />;
      case 'Backend': return <Database className="w-6 h-6" />;
      case 'Full-Stack': return <Briefcase className="w-6 h-6" />;
      case 'Mobile': return <Briefcase className="w-6 h-6" />;
      case 'Data': return <BarChart3 className="w-6 h-6" />;
      case 'ML': return <Brain className="w-6 h-6" />;
      case 'AI': return <Cpu className="w-6 h-6" />;
      case 'Prompt': return <MessageCircle className="w-6 h-6" />;
      case 'DevOps': return <Cloud className="w-6 h-6" />;
      case 'Design': return <Palette className="w-6 h-6" />;
      case 'Marketing': return <TrendingUp className="w-6 h-6" />;
      case 'Content': return <FileText className="w-6 h-6" />;
      case 'SEO': return <Search className="w-6 h-6" />;
      case 'Social': return <Users className="w-6 h-6" />;
      case 'Video': return <Video className="w-6 h-6" />;
      default: return <Briefcase className="w-6 h-6" />;
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'Frontend': return 'from-blue-500 to-cyan-500';
      case 'Backend': return 'from-green-500 to-emerald-500';
      case 'Full-Stack': return 'from-purple-500 to-pink-500';
      case 'Mobile': return 'from-orange-500 to-red-500';
      case 'Data': return 'from-indigo-500 to-blue-500';
      case 'ML': return 'from-violet-500 to-purple-500';
      case 'AI': return 'from-pink-500 to-rose-500';
      case 'Prompt': return 'from-teal-500 to-cyan-500';
      case 'DevOps': return 'from-gray-500 to-slate-500';
      case 'Design': return 'from-yellow-500 to-orange-500';
      case 'Marketing': return 'from-red-500 to-orange-500';
      case 'Content': return 'from-blue-500 to-purple-500';
      case 'SEO': return 'from-green-500 to-blue-500';
      case 'Social': return 'from-pink-500 to-purple-500';
      case 'Video': return 'from-orange-500 to-yellow-500';
      default: return 'from-emerald-500 to-cyan-500';
    }
  };

  const handleViewDetails = (jobId: string) => {
    navigate(`/careers/${jobId}`);
  };

  return (
    <DarkPageWrapper>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-700 py-20 sm:py-28">
        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white">
              {careersData.hero.title}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-8 leading-relaxed max-w-2xl mx-auto">
              {careersData.hero.subtitle}
            </p>
            <a
              href={careersData.hero.ctaHref}
              className="inline-flex items-center bg-white text-emerald-600 font-bold py-4 px-8 rounded-xl hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {careersData.hero.ctaText}
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="py-16 hidden lg:block">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '50,000+', label: 'Users Served', icon: <Users className="w-6 h-6" /> },
              { number: '95%', label: 'Success Rate', icon: <Award className="w-6 h-6" /> },
              { number: '24/7', label: 'AI Support', icon: <Zap className="w-6 h-6" /> },
              { number: '10+', label: 'Open Roles', icon: <Crown className="w-6 h-6" /> }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-emerald-500/10 border border-emerald-500/30 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 text-emerald-400">
                  {stat.icon}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">{stat.number}</div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Overview */}
      <div id="open-roles" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-4">Open Positions</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Join our team of innovators and help shape the future of career technology
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {careersData.jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => handleViewDetails(job.id)}
                className="card-surface p-6 hover:shadow-emerald-glow hover:border-emerald-500/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`bg-gradient-to-r ${getDomainColor(job.domain)} w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg`}>
                      {getDomainIcon(job.domain)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 mb-2">{job.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full font-medium border border-cyan-500/30">
                          {job.domain}
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full font-medium border border-emerald-500/30">
                          {job.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-400 mb-4 leading-relaxed line-clamp-2 text-sm">{job.summary}</p>

                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="flex items-center text-slate-400">
                    <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
                    {job.location}
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                    {job.eligibility.experience}
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Users className="w-4 h-4 mr-2 text-cyan-400" />
                    Team: {job.team}
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Briefcase className="w-4 h-4 mr-2 text-cyan-400" />
                    {job.perks.find(p => p.includes('Stipend') || p.includes('salary')) || 'Competitive'}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleViewDetails(job.id); }}
                  className={`w-full bg-gradient-to-r ${getDomainColor(job.domain)} hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg`}
                >
                  <span>View Details</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Join */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-10">Why PrimoBoost AI?</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="card-surface p-6 group hover:border-emerald-500/30">
                <div className="bg-emerald-500/10 border border-emerald-500/30 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">Cutting-edge Technology</h3>
                <p className="text-slate-400 text-sm">
                  Work with the latest AI technologies and contribute to solutions that impact thousands of careers.
                </p>
              </div>

              <div className="card-surface p-6 group hover:border-cyan-500/30">
                <div className="bg-cyan-500/10 border border-cyan-500/30 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">Growth Focused</h3>
                <p className="text-slate-400 text-sm">
                  Fast-paced environment with strong mentorship and unlimited learning opportunities.
                </p>
              </div>

              <div className="card-surface p-6 group hover:border-purple-500/30">
                <div className="bg-purple-500/10 border border-purple-500/30 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Crown className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">Impact & Ownership</h3>
                <p className="text-slate-400 text-sm">
                  Own projects from conception to deployment and see your work directly impact user success.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DarkPageWrapper>
  );
};
