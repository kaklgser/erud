import React from 'react';
import { motion } from 'framer-motion';
import { DarkPageWrapper, ChristmasTree, GiftBox } from '../ui';
import { Card } from '../common/Card';
import { PageSidebar } from '../navigation/PageSidebar';
import {
  Mail,
  Clock,
  MessageCircle,
  Headphones,
  Globe,
  Star,
  Zap,
  Heart,
  CheckCircle
} from 'lucide-react';

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

export const Contact: React.FC = () => {
  const isChristmas = new Date().getMonth() === 11 || new Date().getMonth() === 0;

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Support',
      details: 'primoboostai@gmail.com',
      description: 'Get help within 24 hours',
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-400/40'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Live Chat',
      details: 'Available 24/7',
      description: 'Instant support via chat',
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-400/40'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Presence',
      details: 'Serving customers worldwide',
      description: 'Available in 100+ countries',
      color: 'from-orange-500 to-red-500',
      borderColor: 'border-orange-400/40'
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: 'Customer Service',
      details: 'Dedicated support team',
      description: 'Mon-Fri, 9 AM - 6 PM PST',
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-400/40'
    }
  ];

  const faqs = [
    {
      question: 'How does the AI resume optimization work?',
      answer: 'Our AI analyzes your resume against job descriptions, identifies gaps, and suggests improvements for better ATS compatibility and recruiter appeal.'
    },
    {
      question: 'Is my data secure and private?',
      answer: 'Yes, we use enterprise-grade security measures. Your data is encrypted and never shared with third parties. You can delete your data anytime.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We support PDF, DOCX, and TXT files for upload. You can export your optimized resume in both PDF and Word formats.'
    },
    {
      question: 'Can I get a refund if not satisfied?',
      answer: 'We offer a 7-day money-back guarantee. If you\'re not satisfied with the results, contact us for a full refund.'
    },
    {
      question: 'Do you offer bulk discounts for teams?',
      answer: 'Yes, we have special pricing for teams and organizations. Contact our sales team for custom enterprise solutions.'
    }
  ];

  const stats = [
    { number: '2hrs', label: 'Avg Response', icon: <Clock className="w-5 h-5" /> },
    { number: '98%', label: 'Satisfaction', icon: <Heart className="w-5 h-5" /> },
    { number: '24/7', label: 'Availability', icon: <Zap className="w-5 h-5" /> },
    { number: '5★', label: 'Rating', icon: <Star className="w-5 h-5" /> },
  ];

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
              {isChristmas && (
                <div className="flex justify-center gap-4 mb-4">
                  <ChristmasTree size="sm" />
                  <GiftBox />
                  <ChristmasTree size="sm" />
              </div>
            )}

            <motion.div 
              variants={itemVariants}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl backdrop-blur-md ${
                isChristmas
                  ? 'bg-gradient-to-br from-red-500/20 to-green-500/20 border border-red-400/30 shadow-red-500/30'
                  : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 shadow-emerald-500/30'
              }`}
            >
              <Headphones className={`w-10 h-10 ${isChristmas ? 'text-red-400' : 'text-emerald-400'}`} />
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-white"
            >
              Get in Touch
              <span className={`block bg-gradient-to-r bg-clip-text text-transparent ${
                isChristmas
                  ? 'from-red-400 via-yellow-400 to-green-400'
                  : 'from-emerald-400 via-cyan-400 to-blue-400'
              }`}>
                We're Here to Help
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto px-4"
            >
              Have questions about our AI resume optimization? Need support? We'd love to hear from you.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative py-12 sm:py-16">
        <div className="container-responsive">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              {isChristmas ? '🎄 ' : ''}Multiple Ways to Reach Us{isChristmas ? ' 🎄' : ''}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">Choose the method that works best for you</p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  padding="lg"
                  className={`h-full bg-slate-900/70 border backdrop-blur-xl hover:shadow-lg transition-all duration-300 ${info.borderColor}`}
                >
                  <div className={`bg-gradient-to-r ${info.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4`}>
                    {info.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">{info.title}</h3>
                  <p className={`font-semibold mb-2 ${isChristmas ? 'text-green-400' : 'text-emerald-400'}`}>{info.details}</p>
                  <p className="text-sm text-slate-400">{info.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Developer Info */}
      <section className="relative py-16 sm:py-20">
        <div className="container-responsive max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card padding="lg" className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className={`p-6 rounded-2xl md:w-1/3 ${
                  isChristmas
                    ? 'bg-gradient-to-br from-red-500/20 to-green-500/20'
                    : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20'
                }`}>
                  <div className="text-center">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg ${
                      isChristmas
                        ? 'bg-gradient-to-r from-red-500 to-green-600 shadow-red-500/30'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-emerald-500/30'
                    }`}>
                      {isChristmas ? '🎅' : 'WO'}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Karthik</h3>
                    <p className={`font-medium ${isChristmas ? 'text-green-400' : 'text-emerald-400'}`}>Developer</p>
                  </div>
                </div>

                <div className="md:w-2/3">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
                    One Developer, Complete Solution
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 mb-4">
                    PrimoBoost was built by a single developer with a passion for creating accessible, high-quality tools for students and professionals.
                  </p>
                  <div className="space-y-2">
                    {[
                      'All-in-one resume optimization platform',
                      'Built with a focus on user needs',
                      'Continuous updates and new features'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center">
                        <CheckCircle className={`w-5 h-5 mr-2 ${isChristmas ? 'text-green-400' : 'text-emerald-400'}`} />
                        <span className="text-sm text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 sm:py-20 bg-slate-900/50">
        <div className="container-responsive max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              {isChristmas ? '❄️ ' : ''}Frequently Asked Questions{isChristmas ? ' ❄️' : ''}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">Quick answers to common questions</p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <Card padding="lg" className="bg-slate-900/70 border border-slate-800/70 backdrop-blur-xl">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-start">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                      isChristmas
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    {faq.question}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed ml-9">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`mt-10 rounded-2xl p-6 sm:p-8 shadow-2xl ${
              isChristmas
                ? 'bg-gradient-to-r from-red-600 via-red-700 to-green-700 shadow-red-500/30'
                : 'bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-700 shadow-emerald-500/30'
            }`}
          >
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 text-center">
              {isChristmas ? '🎁 ' : ''}Why Choose Our Support?{isChristmas ? ' 🎁' : ''}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-white/80 text-xs sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </DarkPageWrapper>
  );
};
