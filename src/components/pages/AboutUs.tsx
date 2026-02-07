import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Target,
  Award,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  Zap,
  Heart,
  Globe,
  ArrowRight
} from "lucide-react";
import { Card } from "../common/Card";
import { useNavigate } from "react-router-dom";
import { DarkPageWrapper, ChristmasTree, GiftBox } from "../ui";
import { PageSidebar } from "../navigation/PageSidebar";

const values = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "People First",
    description:
      "Every decision we make is centered around helping people achieve their career goals and unlock their potential.",
    color: "emerald"
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Innovation",
    description:
      "We continuously push the boundaries of what's possible with AI to deliver cutting-edge solutions.",
    color: "cyan"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Trust",
    description:
      "We maintain the highest standards of security, privacy, and reliability in everything we do.",
    color: "violet"
  }
];

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

export const AboutUs: React.FC = () => {
  const navigate = useNavigate();
  const isChristmas = new Date().getMonth() === 11 || new Date().getMonth() === 0;

  const stats = [
    { number: "50,000+", label: "Resumes Optimized", icon: <TrendingUp className="w-5 h-5" />, microcopy: "Trusted by professionals worldwide" },
    { number: "95%", label: "Success Rate", icon: <Award className="w-5 h-5" />, microcopy: "Achieved by our AI-driven approach" },
    { number: "24/7", label: "AI Support", icon: <Clock className="w-5 h-5" />, microcopy: "Instant assistance anytime" },
    { number: "100+", label: "Countries Served", icon: <Globe className="w-5 h-5" />, microcopy: "Empowering careers globally" }
  ];

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Optimization",
      description: "Our advanced AI analyzes your resume against job requirements and optimizes it for maximum impact.",
      accent: "emerald"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "ATS-Friendly Formatting",
      description: "Ensure your resume passes through Applicant Tracking Systems with our specialized formatting.",
      accent: "cyan"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "JD-Based Projects",
      description: "Get targeted project suggestions based on your job description to make your resume more relevant.",
      accent: "amber"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Results",
      description: "Get your optimized resume in seconds, not hours. Fast, efficient, and reliable.",
      accent: "violet"
    }
  ];

  const accentColors: Record<string, string> = {
    emerald: "from-emerald-500/20 to-cyan-500/20 border-emerald-400/40 text-emerald-400",
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-400/40 text-cyan-400",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-400/40 text-amber-400",
    violet: "from-violet-500/20 to-purple-500/20 border-violet-400/40 text-violet-400",
  };

  return (
    <DarkPageWrapper showSnow={isChristmas} showSanta={isChristmas}>
      {/* Page Sidebar */}
      <PageSidebar />
      
      {/* Main Content - with left margin for sidebar on desktop */}
      <div className="lg:ml-16">
        {/* Hero Section */}
        <section className="relative pt-20 sm:pt-24 pb-16 sm:pb-20">
          <div className="container-responsive">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center max-w-4xl mx-auto space-y-6"
            >
            {/* Christmas decorations */}
            {isChristmas && (
              <div className="flex justify-center gap-4 mb-4">
                <ChristmasTree size="sm" />
                <GiftBox />
                <ChristmasTree size="sm" />
              </div>
            )}

            <motion.div 
              variants={itemVariants}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${
                isChristmas
                  ? 'bg-gradient-to-br from-red-500 via-pink-500 to-rose-600 shadow-red-500/50'
                  : 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/50'
              }`}
            >
              <Heart className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white"
            >
              Empowering Careers with{' '}
              <span className={`block bg-gradient-to-r bg-clip-text text-transparent ${
                isChristmas
                  ? 'from-red-400 via-yellow-400 to-green-400'
                  : 'from-emerald-400 via-cyan-400 to-teal-400'
              }`}>
                AI Innovation
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto px-4"
            >
              We're on a mission to help professionals land their dream jobs through intelligent resume optimization and career guidance.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className={`inline-flex items-center justify-center backdrop-blur-md px-5 py-3 rounded-full border ${
                isChristmas
                  ? 'bg-green-500/10 border-green-400/30'
                  : 'bg-emerald-500/10 border-emerald-400/30'
              }`}
            >
              <span className="text-sm sm:text-base font-semibold text-white">
                {isChristmas ? '🎄 ' : ''}Trusted by 50,000+ professionals{isChristmas ? ' 🎄' : ''}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      

      {/* Stats Section */}
      <section className="relative py-12 sm:py-16">
        <div className="container-responsive">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  padding="lg"
                  className="h-full bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl flex-shrink-0 ${
                      isChristmas
                        ? 'bg-gradient-to-br from-red-500/20 to-green-500/20 text-green-400'
                        : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400'
                    }`}>
                      {stat.icon}
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <div className="text-lg sm:text-xl font-bold text-white">{stat.number}</div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-300">{stat.label}</div>
                      <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed hidden sm:block">{stat.microcopy}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="relative py-16 sm:py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 left-6 w-40 h-40 bg-emerald-500/10 blur-[100px]" />
          <div className="absolute bottom-0 right-10 w-48 h-48 bg-cyan-500/10 blur-[120px]" />
        </div>
        <div className="container-responsive max-w-6xl relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-100 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              Our Story
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Built to make hiring fairer and faster
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We started PrimoBoost AI after seeing great candidates get filtered out by ATS. Now we translate talent into recruiter-ready resumes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            <Card className="md:col-span-2 bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl p-6 sm:p-7 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.7)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white">From frustration to innovation</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-400/30 text-emerald-100">Since 2025</span>
              </div>
              <div className="space-y-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                <p>We saw skilled professionals being filtered out because their resumes weren’t tuned for modern hiring. Instead of accepting it, we built an AI that makes resumes ATS-friendly and recruiter-ready.</p>
                <p>Today, PrimoBoost AI delivers JD-aligned resumes, project suggestions, and outreach that convert—making opportunity about fit, not luck.</p>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl p-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.7)]">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    isChristmas ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-white">Our mission</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Democratize career success by making professional resume optimization accessible, affordable, and effective for everyone.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className={`bg-gradient-to-br ${
                isChristmas
                  ? 'from-red-600 via-red-700 to-green-700 shadow-red-500/30'
                  : 'from-emerald-600 via-cyan-600 to-blue-700 shadow-emerald-500/30'
              } border-none text-white p-5 shadow-2xl`}>
                <div className="space-y-2 text-sm sm:text-base">
                  {[
                    "AI-first from day one",
                    "Global reach, local nuance",
                    "Continuous innovation",
                    "Built for real candidates"
                  ].map((text) => (
                    <div key={text} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-200" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

       {/* Team & Company Section */}
       <section className="relative py-12 sm:py-16">
        <div className="container-responsive max-w-4xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl p-6 sm:p-8 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Who We Are</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                PrimoboostAI is built to turn any job description into a tailored, ATS-friendly resume that gets noticed.
                We combine deep hiring insights with fast, reliable AI so you can apply with confidence.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wide mb-1">Developer</p>
                  <p className="text-white text-base sm:text-lg font-semibold">Karthik</p>
                  <p className="text-slate-300 text-sm leading-relaxed mt-1">Engineering the product experience end-to-end.</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-4">
                  <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wide mb-1">Founder</p>
                  <p className="text-white text-base sm:text-lg font-semibold">Yadali Rishitha</p>
                  <p className="text-slate-300 text-sm leading-relaxed mt-1">Leading the vision for smarter, user-first career tools.</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>


      {/* Features Section */}
      <section className="relative py-16 sm:py-20 bg-slate-900/50">
        <div className="container-responsive max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              What Makes Us Different
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
              We combine cutting-edge AI technology with deep understanding of hiring processes to deliver unmatched results.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-4 sm:gap-5"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card
                  padding="lg"
                  className={`h-full bg-slate-900/70 border backdrop-blur-xl transition-all duration-300 hover:shadow-lg ${
                    accentColors[feature.accent].split(' ').slice(2).join(' ')
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${
                      accentColors[feature.accent]
                    }`}>
                      {feature.icon}
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-16 sm:py-20">
        <div className="container-responsive max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-10">
              {isChristmas ? '⭐ ' : ''}Our Core Values{isChristmas ? ' ⭐' : ''}
            </h2>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-3 gap-4 sm:gap-6"
          >
            {values.map((value) => (
              <motion.div
                key={value.title}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.03 }}
              >
                <Card padding="lg" className="h-full bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl mx-auto mb-4 bg-gradient-to-br ${
                    accentColors[value.color]
                  }`}>
                    {value.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 text-center shadow-2xl ${
              isChristmas
                ? 'bg-gradient-to-r from-red-600 via-red-700 to-green-700 shadow-red-500/30'
                : 'bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-700 shadow-emerald-500/30'
            }`}
          >
            {isChristmas && (
              <div className="flex justify-center gap-4 mb-6">
                <ChristmasTree size="md" />
                <GiftBox className="text-4xl" />
                <ChristmasTree size="md" />
              </div>
            )}
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              {isChristmas ? '🎁 ' : ''}Ready to Transform Your Career?{isChristmas ? ' 🎁' : ''}
            </h2>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-6 max-w-2xl mx-auto">
              Join thousands of professionals who have already upgraded their resumes and landed their dream jobs.
            </p>
            
            <motion.button
              onClick={() => navigate("/optimizer")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg font-semibold bg-white text-slate-900 shadow-lg hover:shadow-xl transition-all"
            >
              Start Optimizing Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </DarkPageWrapper>
  );
};
