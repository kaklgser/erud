import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Menu, X, Home, Info, BookOpen, Phone, FileText, LogIn, LogOut, User, Wallet, Briefcase, Crown, Sparkles, Gamepad2, Mail, Brain, Calendar, Video } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Navigation } from './components/navigation/Navigation';
import { AuthModal } from './components/auth/AuthModal';
import { paymentService } from './services/paymentService';
import { AlertModal } from './components/AlertModal';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { OfferOverlay } from './components/OfferOverlay';
import { DiwaliOfferBanner } from './components/DiwaliOfferBanner';
import { SnowEffect, SantaSleigh } from './components/ui/ChristmasTheme';
import { PageSidebar } from './components/navigation/PageSidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SuspenseFallback } from './components/SuspenseFallback';

const HomePage = lazy(() => import('./components/pages/HomePage').then(m => ({ default: m.HomePage })));
const ResumeOptimizer = lazy(() => import('./components/ResumeOptimizer'));
const GuidedResumeBuilder = lazy(() => import('./components/GuidedResumeBuilder'));
const ResumeScoreChecker = lazy(() => import('./components/ResumeScoreChecker').then(m => ({ default: m.ResumeScoreChecker })));
const LinkedInMessageGenerator = lazy(() => import('./components/LinkedInMessageGenerator').then(m => ({ default: m.LinkedInMessageGenerator })));
const AboutUs = lazy(() => import('./components/pages/AboutUs').then(m => ({ default: m.AboutUs })));
const Contact = lazy(() => import('./components/pages/Contact').then(m => ({ default: m.Contact })));
const Tutorials = lazy(() => import('./components/pages/Tutorials').then(m => ({ default: m.Tutorials })));
const UserProfileManagement = lazy(() => import('./components/UserProfileManagement').then(m => ({ default: m.UserProfileManagement })));
const SubscriptionPlans = lazy(() => import('./components/payment/SubscriptionPlans').then(m => ({ default: m.SubscriptionPlans })));
const ToolsAndPagesNavigation = lazy(() => import('./components/pages/ToolsAndPagesNavigation').then(m => ({ default: m.ToolsAndPagesNavigation })));
const PlanSelectionModal = lazy(() => import('./components/payment/PlanSelectionModal').then(m => ({ default: m.PlanSelectionModal })));
const FloatingChatbot = lazy(() => import('./components/common/FloatingChatbot').then(m => ({ default: m.FloatingChatbot })));
const CareersPage = lazy(() => import('./components/pages/CareersPage').then(m => ({ default: m.CareersPage })));
const JobDetailsPage = lazy(() => import('./components/pages/JobDetailsPageNew').then(m => ({ default: m.JobDetailsPageNew })));
const JobsPage = lazy(() => import('./components/pages/JobsPage').then(m => ({ default: m.JobsPage })));
const MyApplicationsPage = lazy(() => import('./components/pages/MyApplicationsPage').then(m => ({ default: m.MyApplicationsPage })));
const JobApplicationPage = lazy(() => import('./components/pages/JobApplicationPage').then(m => ({ default: m.JobApplicationPage })));
const JobApplicationFormPage = lazy(() => import('./components/pages/JobApplicationFormPage').then(m => ({ default: m.JobApplicationFormPage })));
const AdminRoute = lazy(() => import('./components/admin/AdminRoute').then(m => ({ default: m.AdminRoute })));
const JobUploadForm = lazy(() => import('./components/admin/JobUploadForm').then(m => ({ default: m.JobUploadForm })));
const AdminJobsPage = lazy(() => import('./components/admin/AdminJobsPage').then(m => ({ default: m.AdminJobsPage })));
const JobEditPage = lazy(() => import('./components/admin/JobEditPage').then(m => ({ default: m.JobEditPage })));
const AdminUsersPage = lazy(() => import('./components/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const PortfolioBuilderPage = lazy(() => import('./components/pages/PortfolioBuilderPage').then(m => ({ default: m.PortfolioBuilderPage })));
const MockInterviewPage = lazy(() => import('./components/pages/MockInterviewPage').then(m => ({ default: m.MockInterviewPage })));
const ResumeBasedInterviewPage = lazy(() => import('./components/pages/ResumeBasedInterviewPage').then(m => ({ default: m.ResumeBasedInterviewPage })));
const UnifiedInterviewOrchestrator = lazy(() => import('./components/interview/UnifiedInterviewOrchestrator').then(m => ({ default: m.UnifiedInterviewOrchestrator })));
const SmartInterviewPage = lazy(() => import('./components/pages/SmartInterviewPage').then(m => ({ default: m.SmartInterviewPage })));
const EnhancedBlogPage = lazy(() => import('./components/pages/EnhancedBlogPage').then(m => ({ default: m.EnhancedBlogPage })));
const BlogPostPage = lazy(() => import('./components/pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const AdminBlogPostsList = lazy(() => import('./components/admin/AdminBlogPostsList').then(m => ({ default: m.AdminBlogPostsList })));
const AdminBlogPostForm = lazy(() => import('./components/admin/AdminBlogPostForm').then(m => ({ default: m.AdminBlogPostForm })));
const AdminBlogCategoriesManager = lazy(() => import('./components/admin/AdminBlogCategoriesManager').then(m => ({ default: m.AdminBlogCategoriesManager })));
const EmailTestingPanel = lazy(() => import('./components/admin/EmailTestingPanel').then(m => ({ default: m.EmailTestingPanel })));
const WebinarsPage = lazy(() => import('./components/pages/WebinarsPage').then(m => ({ default: m.WebinarsPage })));
const ATSScoreChecker16ParameterComponent = lazy(() => import('./components/ATSScoreChecker16Parameter').then(m => ({ default: m.ATSScoreChecker16ParameterComponent })));
const ATSScoreChecker16ParameterAdvanced = lazy(() => import('./components/ATSScoreChecker16ParameterAdvanced').then(m => ({ default: m.ATSScoreChecker16ParameterAdvanced })));
const WebinarLandingPage = lazy(() => import('./components/pages/WebinarLandingPage').then(m => ({ default: m.WebinarLandingPage })));
const WebinarDetailsPage = lazy(() => import('./components/pages/WebinarDetailsPage').then(m => ({ default: m.WebinarDetailsPage })));
const MyWebinarsPage = lazy(() => import('./components/pages/MyWebinarsPage').then(m => ({ default: m.MyWebinarsPage })));
const GamingAptitudePage = lazy(() => import('./components/pages/GamingAptitudePage').then(m => ({ default: m.GamingAptitudePage })));
const CompanyGamePage = lazy(() => import('./components/pages/CompanyGamePage').then(m => ({ default: m.CompanyGamePage })));
const AccenturePathFinderPage = lazy(() => import('./components/pages/AccenturePathFinderPage').then(m => ({ default: m.AccenturePathFinderPage })));
const CognitivePathFinderPage = lazy(() => import('./components/pages/CognitivePathFinderPage').then(m => ({ default: m.CognitivePathFinderPage })));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const KeyFinderPage = lazy(() => import('./components/pages/KeyFinderPage').then(m => ({ default: m.KeyFinderPage })));
const BubbleSelectionPage = lazy(() => import('./components/pages/BubbleSelectionPage').then(m => ({ default: m.BubbleSelectionPage })));
const SpatialReasoningDemoPage = lazy(() => import('./pages/SpatialReasoningDemoPage').then(m => ({ default: m.SpatialReasoningDemoPage })));
const ResetPasswordPage = lazy(() => import('./components/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const TestEmailDigest = lazy(() => import('./pages/TestEmailDigest').then(m => ({ default: m.TestEmailDigest })));
const SessionLandingPage = lazy(() => import('./components/session/SessionLandingPage').then(m => ({ default: m.SessionLandingPage })));
const SessionBookingFlow = lazy(() => import('./components/session/SessionBookingFlow').then(m => ({ default: m.SessionBookingFlow })));
const MyBookingsPage = lazy(() => import('./components/pages/MyBookingsPage').then(m => ({ default: m.MyBookingsPage })));
const AdminSessionSchedule = lazy(() => import('./components/admin/AdminSessionSchedule').then(m => ({ default: m.AdminSessionSchedule })));
const AdminSessionServiceEditor = lazy(() => import('./components/admin/AdminSessionServiceEditor').then(m => ({ default: m.AdminSessionServiceEditor })));
const AdminWebinarsPage = lazy(() => import('./components/admin/AdminWebinarsPage').then(m => ({ default: m.AdminWebinarsPage })));

function App() {
  const { isAuthenticated, user, markProfilePromptSeen, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [userSubscription, setUserSubscription] = useState<any>(null);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [alertActionText, setAlertActionText] = useState<string | undefined>(undefined);
  const [alertActionCallback, setAlertActionCallback] = useState<(() => void) | undefined>(undefined);

  const [authModalInitialView, setAuthModalInitialView] = useState<
    'login' | 'signup' | 'forgot-password' | 'success' | 'postSignupPrompt' | 'reset_password'
  >('login');


  const [showPlanSelectionModal, setShowPlanSelectionModal] = useState(false);
  const [planSelectionFeatureId, setPlanSelectionFeatureId] = useState<string | undefined>(undefined);
  const [initialExpandAddons, setInitialExpandAddons] = useState(true);

 const [showWelcomeOffer, setShowWelcomeOffer] = useState(false);
  // Disable Diwali homepage banner
  const [showDiwaliBanner, setShowDiwaliBanner] = useState(false);

  const [messageGenerationInterrupted, setMessageGenerationInterrupted] = useState(false);
  const [postAuthCallback, setPostAuthCallback] = useState<(() => void) | null>(null);
  const [toolProcessTrigger, setToolProcessTrigger] = useState<(() => void) | null>(null);

  const logoImage =
    'https://res.cloudinary.com/dlkovvlud/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1751536902/a-modern-logo-design-featuring-primoboos_XhhkS8E_Q5iOwxbAXB4CqQ_HnpCsJn4S1yrhb826jmMDw_nmycqj.jpg';

  const handleMobileMenuToggle = useCallback(() => {
    setShowMobileMenu((v) => !v);
  }, []);

  const handleShowAuth = useCallback((callback?: () => void) => {
    console.log('handleShowAuth called in App.tsx');
    setShowAuthModal(true);
    setAuthModalInitialView('login');
    console.log('showAuthModal set to true');
    setShowMobileMenu(false);
    if (typeof callback === 'function') {
      setPostAuthCallback(() => callback);
    } else {
      setPostAuthCallback(null);
    }
  }, []);

  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const fetchSubscription = useCallback(async () => {
    if (isAuthenticated && user) {
      const sub = await paymentService.getUserSubscription(user.id);
      setUserSubscription(sub);
      console.log('App.tsx: fetchSubscription - Fetched subscription:', sub);
    } else {
      setUserSubscription(null);
    }
  }, [isAuthenticated, user]);

  const refreshUserSubscription = useCallback(async () => {
    if (isAuthenticated && user) {
      console.log('App.tsx: Refreshing user subscription...');
      const sub = await paymentService.getUserSubscription(user.id);
      setUserSubscription(sub);
      console.log('App.tsx: refreshUserSubscription - Fetched subscription:', sub);
    }
  }, [isAuthenticated, user]);

  const handleShowAlert = useCallback(
    (
      title: string,
      message: string,
      type: 'info' | 'success' | 'warning' | 'error' = 'info',
      actionText?: string,
      onAction?: () => void
    ) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertType(type);
      setAlertActionText(actionText);
      setAlertActionCallback(() => {
        if (onAction) onAction();
        setShowAlertModal(false);
      });
      setShowAlertModal(true);

      if (!actionText) {
        setTimeout(() => {
          setShowAlertModal(false);
        }, 5000);
      }
    },
    []
  );

  const handleSubscriptionSuccess = useCallback(async () => {
    setShowSubscriptionPlans(false);
    setShowPlanSelectionModal(false);
    setSuccessMessage('🎄 Subscription activated successfully! Merry Christmas! 🎅');
    setShowSuccessNotification(true);
    setTimeout(() => {
      setShowSuccessNotification(false);
      setSuccessMessage('');
    }, 5000);

    await fetchSubscription();
    setWalletRefreshKey((prev) => prev + 1);

    queueMicrotask(() => {
      if (toolProcessTrigger) {
        console.log('App.tsx: Running toolProcessTrigger after subscription success');
        toolProcessTrigger();
      }
    });
  }, [fetchSubscription, toolProcessTrigger]);

  const handleAddonPurchaseSuccess = useCallback(
    async (featureId: string) => {
      console.log(`App.tsx: Add-on purchase successful for feature: ${featureId}. Triggering tool process.`);
      await refreshUserSubscription();
      console.log(`App.tsx: User subscription refreshed. Now attempting to trigger tool process.`);

      let message = 'Add-on credit(s) added successfully!';
      switch (featureId) {
        case 'score-checker':
          message = '1 Resume Score Check credit added successfully!';
          break;
        case 'optimizer':
          message = '1 JD-Based Optimization credit added successfully!';
          break;
        case 'guided-builder':
          message = '1 Guided Resume Build credit added successfully!';
          break;
        case 'linkedin-generator':
          message = 'LinkedIn Message credits added successfully!';
          break;
      }
      handleShowAlert('Purchase Complete', message, 'success');

      setShowPlanSelectionModal(false);
      setShowSubscriptionPlans(false);

      queueMicrotask(() => {
        if (toolProcessTrigger) {
          console.log('App.tsx: Executing toolProcessTrigger for feature:', featureId);
          toolProcessTrigger();
        }
      });
    },
    [refreshUserSubscription, handleShowAlert, toolProcessTrigger]
  );

  const handleShowProfile = useCallback((mode: 'profile' | 'wallet' = 'profile') => {
    setShowMobileMenu(false);
    navigate(mode === 'wallet' ? '/profile?tab=wallet' : '/profile');
  }, [navigate]);

  const handleShowPlanSelection = useCallback(
    (featureId?: string, expandAddons: boolean = false, planId?: string, couponCode?: string) => {
      console.log(
        'App.tsx: handleShowPlanSelection called with featureId:',
        featureId,
        'expandAddons:',
        expandAddons,
        'planId:',
        planId,
        'couponCode:',
        couponCode
      );
      setPlanSelectionFeatureId(featureId);
      setInitialExpandAddons(expandAddons);
      setShowPlanSelectionModal(true);
    },
    []
  );

  const handleSelectCareerPlans = useCallback(() => {
    console.log(
      'handleSelectCareerPlans called. Attempting to close PlanSelectionModal and open SubscriptionPlans modal.'
    );
    setShowPlanSelectionModal(false);
    setShowSubscriptionPlans(true);
  }, []);

  const handleShowSubscriptionPlansDirectly = useCallback(() => {
    console.log('App.tsx: handleShowSubscriptionPlansDirectly called. Opening SubscriptionPlans modal directly.');
    setShowSubscriptionPlans(true);
    setInitialExpandAddons(false);
  }, []);

const handleDiwaliCTAClick = useCallback(() => {
  handleShowSubscriptionPlansDirectly();
  
}, [handleShowSubscriptionPlansDirectly]);

  const handlePageChange = useCallback(
    (path: string) => {
      if (path === 'menu') {
        handleMobileMenuToggle();
      } else if (path === 'profile') {
        navigate('/profile');
        setShowMobileMenu(false);
      } else if (path === 'wallet') {
        navigate('/profile?tab=wallet');
        setShowMobileMenu(false);
      } else if (path === 'subscription-plans') {
        handleShowPlanSelection(undefined, false);
        setShowMobileMenu(false);
      } else {
        navigate(path);
        setShowMobileMenu(false);
      }
    },
    [handleMobileMenuToggle, handleShowPlanSelection, navigate]
  );

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
  // Check both hash and search params for password recovery
  const hash = window.location.hash;
  const searchParams = new URLSearchParams(window.location.search);
  const urlType = searchParams.get('type');
  const accessToken = searchParams.get('access_token');
  
  // Parse hash parameters
  const hashParams = new URLSearchParams(hash.substring(1));
  const hashType = hashParams.get('type');
  const hashAccessToken = hashParams.get('access_token');

  // Supabase sends recovery links with hash fragments: #access_token=...&type=recovery
  const isRecoveryLink = (urlType === 'recovery' || hashType === 'recovery') && (accessToken || hashAccessToken);

  if (isRecoveryLink && location.pathname !== '/reset-password') {
    console.log('App.tsx: Detected password recovery link in URL. Redirecting to /reset-password');
    console.log('App.tsx: Type:', urlType || hashType, 'Has access token:', !!(accessToken || hashAccessToken));

    // IMPORTANT: Keep the hash intact so Supabase can process it
    // Navigate to reset-password page preserving the hash
    const fullHash = hash || '';
    navigate(`/reset-password${fullHash}`, { replace: true });
  }
}, [location.pathname, navigate]);

  useEffect(() => {
  console.log(
    'App.tsx useEffect: isAuthenticated:',
    isAuthenticated,
    'user:',
    user?.id,
    'hasSeenProfilePrompt:',
    user?.hasSeenProfilePrompt,
    'isLoadingAuth:',
    isLoading,
    'current path:',
    location.pathname
  );

  // FIXED: Don't run this logic on the reset-password page
  if (location.pathname === '/reset-password') {
    console.log('App.tsx useEffect: On reset-password page, skipping AuthModal/profile logic.');
    return;
  }

  if (isLoading) {
    console.log('App.tsx useEffect: AuthContext is still loading, deferring AuthModal logic.');
    return;
  }

  // MODIFIED: Removed auto-opening of AuthModal for incomplete profiles
  // Users can manually access profile settings from the menu
  
  if (isAuthenticated && user) {
    if (user.hasSeenProfilePrompt === undefined) {
      console.log('App.tsx useEffect: user.hasSeenProfilePrompt is undefined, waiting for full profile load.');
      return;
    }
    
    // REMOVED: Auto-show profile prompt
    // if (user.hasSeenProfilePrompt === false) {
    //   console.log('App.tsx useEffect: User authenticated and profile incomplete, opening AuthModal to prompt.');
    //   setAuthModalInitialView('postSignupPrompt');
    //   setShowAuthModal(true);
    // }
    
    if (user.hasSeenProfilePrompt === true) {
      console.log('App.tsx useEffect: User authenticated and profile complete, ensuring AuthModal is closed.');
      setShowAuthModal(false);
      setAuthModalInitialView('login');
      if (postAuthCallback) {
        postAuthCallback();
        setPostAuthCallback(null);
      }
    }
  } else {
    console.log('App.tsx useEffect: User not authenticated, ensuring AuthModal is closed.');
    setAuthModalInitialView('login');
  }
}, [isAuthenticated, user, user?.hasSeenProfilePrompt, isLoading, postAuthCallback, location.pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (location.pathname === '/') {
      timer = setTimeout(() => {
        setShowWelcomeOffer(true);
      }, 2000);
    } else {
      setShowWelcomeOffer(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [location.pathname]);

  const commonPageProps = {
    isAuthenticated: isAuthenticated,
    onShowAuth: handleShowAuth,
    onShowSubscriptionPlans: handleShowPlanSelection,
    onShowSubscriptionPlansDirectly: handleShowSubscriptionPlansDirectly,
    userSubscription: userSubscription,
    onShowAlert: handleShowAlert,
    refreshUserSubscription: refreshUserSubscription,
    onNavigateBack: handleNavigateHome,
    toolProcessTrigger,
    setToolProcessTrigger,
  };

  console.log('App.tsx: showPlanSelectionModal state before PlanSelectionModal render:', showPlanSelectionModal);

  // Check if we're in interview mode OR reset password mode
  // Only hide sidebar during active interview session (when ?session=active is in URL)
  const isInterviewMode = location.pathname.includes('/mock-interview') && location.search.includes('session=active');
  const isResetPasswordMode = location.pathname === '/reset-password';

  // Check if it's Christmas season
  const isChristmasSeason = new Date().getMonth() === 11 || new Date().getMonth() === 0;

  return (
    <div className={`min-h-screen pb-safe-bottom safe-area transition-colors duration-300 ${
      isChristmasSeason
        ? 'bg-gradient-to-b from-[#1a0a0f] via-[#0f1a0f] to-[#070b14]'
        : 'bg-gradient-to-b from-[#0a1e1e] via-[#0d1a1a] to-[#070b14]'
    } text-slate-100`}>
      {/* Global Christmas Effects */}
      {isChristmasSeason && !isInterviewMode && (
        <>
          <SnowEffect intensity="light" />
          <SantaSleigh />
        </>
      )}

      {/* Diwali Banner - Hide in interview mode and reset password mode */}
      {showDiwaliBanner && !isInterviewMode && !isResetPasswordMode && <DiwaliOfferBanner onCTAClick={handleDiwaliCTAClick} />}

      {/* Add padding-top to account for the banner */}
      <div className={showDiwaliBanner && !isInterviewMode && !isResetPasswordMode ? 'pt-20 sm:pt-24' : ''}>
        {showSuccessNotification && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3 text-white rounded-lg shadow-lg animate-fade-in-down ${
            isChristmasSeason ? 'bg-gradient-to-r from-red-500 to-green-600' : 'bg-emerald-500'
          }`}>
            {successMessage}
          </div>
        )}

        {/* Hide header when in interview mode OR reset password mode */}
        {!isInterviewMode && !isResetPasswordMode && (
          <Header onMobileMenuToggle={handleMobileMenuToggle} showMobileMenu={showMobileMenu} onShowProfile={handleShowProfile}>
            <Navigation onPageChange={handlePageChange} />
          </Header>
        )}

        {/* Global Sidebar - visible on all pages except interview and reset password */}
        {!isInterviewMode && !isResetPasswordMode && <PageSidebar />}

        <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path="/" element={<><HomePage {...commonPageProps} /><Suspense fallback={null}><FloatingChatbot /></Suspense></>} />
          <Route
            path="/optimizer"
            element={
              <main className="min-h-screen">
                <ResumeOptimizer
                  isAuthenticated={isAuthenticated}
                  onShowAuth={handleShowAuth}
                  onShowProfile={handleShowProfile}
                  onNavigateBack={handleNavigateHome}
                  onShowPlanSelection={handleShowPlanSelection}
                  userSubscription={userSubscription}
                  refreshUserSubscription={refreshUserSubscription}
                  toolProcessTrigger={toolProcessTrigger}
                  setToolProcessTrigger={setToolProcessTrigger}
                />
              </main>
            }
          />
          <Route path="/score-checker" element={<ResumeScoreChecker {...commonPageProps} />} />
          <Route path="/ats-16-parameter" element={<ATSScoreChecker16ParameterComponent onNavigateBack={() => navigate('/')} />} />
          <Route path="/ats-16-parameter-advanced" element={<ATSScoreChecker16ParameterAdvanced onNavigateBack={() => navigate('/')} />} />
          <Route path="/guided-builder" element={<GuidedResumeBuilder {...commonPageProps} />} />
          <Route path="/linkedin-generator" element={<LinkedInMessageGenerator {...commonPageProps} />} />
          <Route path="/portfolio-builder" element={<PortfolioBuilderPage isAuthenticated={isAuthenticated} onShowAuth={handleShowAuth} />} />
          <Route path="/mock-interview" element={<MockInterviewPage isAuthenticated={isAuthenticated} onShowAuth={handleShowAuth} />} />
          <Route path="/resume-interview" element={<ResumeBasedInterviewPage />} />
          <Route path="/realistic-interview" element={<UnifiedInterviewOrchestrator />} />
          <Route path="/smart-interview" element={<SmartInterviewPage isAuthenticated={isAuthenticated} onShowAuth={handleShowAuth} />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/all-tools" element={<ToolsAndPagesNavigation {...commonPageProps} />} />
          <Route path="/pricing" element={
            <SubscriptionPlans
              isOpen={true}
              onNavigateBack={() => navigate(-1)}
              onSubscriptionSuccess={handleSubscriptionSuccess}
              onShowAlert={handleShowAlert}
              initialExpandAddons={false}
            />
          } />
          <Route path="/careers" element={<CareersPage {...commonPageProps} />} />
          <Route path="/careers/:jobId" element={<JobDetailsPage {...commonPageProps} />} />
          <Route path="/jobs" element={<JobsPage {...commonPageProps} onShowProfile={handleShowProfile} />} />
          <Route path="/jobs/:jobId" element={<JobDetailsPage {...commonPageProps} />} />
          <Route path="/jobs/:jobId/apply" element={<JobApplicationPage />} />
          <Route path="/jobs/:jobId/apply-form" element={<JobApplicationFormPage />} />
          <Route path="/jobs/applications" element={<MyApplicationsPage {...commonPageProps} />} />
          <Route path="/webinar-details/:registrationId" element={<WebinarDetailsPage />} />

          <Route path="/my-webinars" element={<MyWebinarsPage />} />
          <Route path="/gaming" element={<GamingAptitudePage isAuthenticated={isAuthenticated} onShowAuth={handleShowAuth} />} />
          <Route path="/gaming/:companyId" element={<CompanyGamePage onShowAuth={handleShowAuth} />} />
          <Route path="/pathfinder" element={<AccenturePathFinderPage />} />
          <Route path="/cognitive-pathfinder" element={<CognitivePathFinderPage />} />
          <Route path="/key-finder" element={<KeyFinderPage />} />
          <Route path="/bubble-selection" element={<BubbleSelectionPage />} />
          <Route path="/spatial-reasoning" element={<SpatialReasoningDemoPage />} />
          <Route path="/profile" element={<UserProfileManagement />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/test-email-digest" element={<TestEmailDigest />} />
          <Route path="/session" element={<SessionLandingPage onShowAuth={handleShowAuth} />} />
          <Route path="/session/book" element={<SessionBookingFlow />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route
            path="/admin/sessions"
            element={
              <AdminRoute>
                <div className="min-h-screen pb-20 md:pl-16">
                  <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
                    <h1 className="text-2xl font-bold text-white">Session Schedule Management</h1>
                    <AdminSessionServiceEditor />
                    <AdminSessionSchedule />
                  </div>
                </div>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <AdminRoute>
                <AdminJobsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jobs/new"
            element={
              <AdminRoute>
                <JobUploadForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/jobs/:jobId/edit"
            element={
              <AdminRoute>
                <JobEditPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route path="/blog" element={<EnhancedBlogPage isAuthenticated={isAuthenticated} onShowAuth={() => setShowAuthModal(true)} />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/webinars" element={<WebinarsPage onShowAuth={handleShowAuth} />} />
          <Route path="/webinar/:slug" element={<WebinarLandingPage onShowAuth={handleShowAuth} />} />
          <Route
            path="/admin/blog"
            element={
              <AdminRoute>
                <AdminBlogPostsList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/blog/new"
            element={
              <AdminRoute>
                <AdminBlogPostForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/blog/edit/:id"
            element={
              <AdminRoute>
                <AdminBlogPostForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/blog/categories"
            element={
              <AdminRoute>
                <AdminBlogCategoriesManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/email-testing"
            element={
              <AdminRoute>
                <EmailTestingPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/webinars"
            element={
              <AdminRoute>
                <AdminWebinarsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Navigate to="/admin/jobs" replace />
              </AdminRoute>
            }
          />
        </Routes>
        </Suspense>
        </ErrorBoundary>

        {showMobileMenu && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label="Navigation menu" aria-modal="true">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
            <div className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-[#05131A] shadow-2xl overflow-y-auto safe-area border-l border-[#0c1d25]">
              <div className="flex flex-col space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg">
                      <img src={logoImage} alt="PrimoBoost AI Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-100">PrimoBoost AI</h1>
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    aria-label="Close menu"
                    className="min-w-touch min-h-touch p-2 text-[#7A8CAA] hover:text-slate-100 hover:bg-[#0c1d25] rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="border-t border-[#0c1d25] pt-4">
                  <nav className="flex flex-col space-y-1">
                    {[
                      { id: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
                      { id: '/about', label: 'About Us', icon: <Info className="w-5 h-5" /> },
                      { id: '/blog', label: 'Blog', icon: <BookOpen className="w-5 h-5" /> },
                      { id: '/webinars', label: 'Webinars', icon: <Sparkles className="w-5 h-5" /> },
                      ...(isAuthenticated ? [{ id: '/my-webinars', label: 'My Webinars', icon: <Sparkles className="w-5 h-5" /> }] : []),
                      { id: '/gaming', label: 'Gaming', icon: <Gamepad2 className="w-5 h-5" /> },
                      { id: '/spatial-reasoning', label: 'Spatial Reasoning', icon: <Brain className="w-5 h-5" /> },
                      { id: '/session', label: 'Resume Session', icon: <Sparkles className="w-5 h-5" /> },
                      ...(isAuthenticated ? [{ id: '/my-bookings', label: 'My Bookings', icon: <BookOpen className="w-5 h-5" /> }] : []),
                      { id: '/careers', label: 'Careers', icon: <Briefcase className="w-5 h-5" /> },
                      { id: '/jobs', label: 'Latest Jobs', icon: <Briefcase className="w-5 h-5" /> },
                      ...((user?.role === 'admin' || user?.email === 'primoboostai@gmail.com') ? [{ id: '/admin/jobs', label: 'Admin Panel', icon: <Crown className="w-5 h-5" /> }] : []),
                      ...((user?.role === 'admin' || user?.email === 'primoboostai@gmail.com') ? [{ id: '/admin/webinars', label: 'Webinar Management', icon: <Video className="w-5 h-5" /> }] : []),
                      ...((user?.role === 'admin' || user?.email === 'primoboostai@gmail.com') ? [{ id: '/admin/blog', label: 'Blog Management', icon: <FileText className="w-5 h-5" /> }] : []),
                      ...((user?.role === 'admin' || user?.email === 'primoboostai@gmail.com') ? [{ id: '/admin/email-testing', label: 'Email Testing', icon: <Mail className="w-5 h-5" /> }] : []),
                      ...((user?.role === 'admin' || user?.email === 'primoboostai@gmail.com') ? [{ id: '/admin/sessions', label: 'Session Schedule', icon: <Calendar className="w-5 h-5" /> }] : []),
                      { id: '/tutorials', label: 'Tutorials', icon: <BookOpen className="w-5 h-5" /> },
                      { id: '/contact', label: 'Contact', icon: <Phone className="w-5 h-5" /> },
                      ...(isAuthenticated ? [{ id: 'wallet', label: 'Referral & Wallet', icon: <Wallet className="w-5 h-5" /> }] : []),
                      ...(isAuthenticated ? [{ id: '/jobs/applications', label: 'My Applications', icon: <FileText className="w-5 h-5" /> }] : []),
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          handlePageChange(item.id);
                        }}
                        className={`flex items-center space-x-3 min-h-touch px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          window.location.pathname === item.id
                            ? 'bg-[rgba(0,230,184,0.12)] text-[#00E6B8]'
                            : 'text-[#7A8CAA] hover:text-[#00E6B8] hover:bg-[#0c1d25]'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="border-t border-[#0c1d25] pt-4">
                  <AuthButtons
                    onPageChange={handlePageChange}
                    onClose={() => setShowMobileMenu(false)}
                    onShowAuth={handleShowAuth}
                  />
                </div>

                <div className="mt-auto pt-4 border-t border-[#0c1d25]">
                  <div className="bg-[#0c1d25] rounded-xl p-4">
                    <p className="text-sm text-[#7A8CAA] mb-2">Need help with your resume?</p>
                    <button
                      onClick={() => {
                        handlePageChange('/');
                        setShowMobileMenu(false);
                      }}
                      className="w-full bg-gradient-to-r from-[#00E6B8] to-cyan-500 text-[#05131A] font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Optimize Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            if (authModalInitialView === 'postSignupPrompt' && user) {
              markProfilePromptSeen();
            }
            setShowAuthModal(false);
            setAuthModalInitialView('login');
          }}
          onProfileFillRequest={() => handleShowProfile('profile')}
          initialView={authModalInitialView}
          onPromptDismissed={() => {
            if (user) {
              markProfilePromptSeen();
            }
            setShowAuthModal(false);
            setAuthModalInitialView('login');
          }}
        />

        <Suspense fallback={null}>
          {showPlanSelectionModal && (
            <PlanSelectionModal
              isOpen={showPlanSelectionModal}
              onClose={() => setShowPlanSelectionModal(false)}
              onSelectCareerPlans={handleSelectCareerPlans}
              onSubscriptionSuccess={handleSubscriptionSuccess}
              onShowAlert={handleShowAlert}
              triggeredByFeatureId={planSelectionFeatureId}
              onAddonPurchaseSuccess={handleAddonPurchaseSuccess}
            />
          )}

          {showSubscriptionPlans && (
            <SubscriptionPlans
              isOpen={showSubscriptionPlans}
              onNavigateBack={() => setShowSubscriptionPlans(false)}
              onSubscriptionSuccess={handleSubscriptionSuccess}
              onShowAlert={handleShowAlert}
              initialExpandAddons={initialExpandAddons}
            />
          )}
        </Suspense>

        <AlertModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          actionText={alertActionText}
          onAction={alertActionCallback}
        />

        {showWelcomeOffer && (
          <OfferOverlay
            isOpen={showWelcomeOffer}
            onClose={() => setShowWelcomeOffer(false)}
            targetPath="/optimizer"
            ctaLabel="Optimize Resume Now"
          />
        )}
      

      </div>
    </div>
  );
}

const AuthButtons: React.FC<{
  onPageChange: (path: string) => void;
  onClose: () => void;
  onShowAuth: (callback?: () => void) => void;
}> = ({ onPageChange, onClose, onShowAuth }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Sign in button clicked - calling onShowAuth');
    onShowAuth();
    console.log('showAuthModal set to true');
  };
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#7A8CAA] mb-3">Account</h3>
      {isAuthenticated && user ? (
        <div className="space-y-1">
          <div className="flex items-center space-x-3 px-4 py-3 bg-[#0c1d25] rounded-xl mb-3">
            <div className="bg-gradient-to-br from-[#00E6B8] to-cyan-500 w-10 h-10 rounded-full flex items-center justify-center text-[#05131A] font-semibold">
              {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-slate-100 truncate">{user.name}</p>
              <p className="text-xs text-[#7A8CAA] truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => { navigate('/profile'); onClose(); }}
            className="w-full flex items-center space-x-3 min-h-touch px-4 py-3 rounded-lg font-medium transition-all duration-200 text-[#7A8CAA] hover:text-[#00E6B8] hover:bg-[#0c1d25]"
          >
            <User className="w-5 h-5" />
            <span>Profile Settings</span>
          </button>
          <button
            onClick={() => { navigate('/profile?tab=wallet'); onClose(); }}
            className="w-full flex items-center space-x-3 min-h-touch px-4 py-3 rounded-lg font-medium transition-all duration-200 text-[#7A8CAA] hover:text-[#00E6B8] hover:bg-[#0c1d25]"
          >
            <Wallet className="w-5 h-5" />
            <span>My Wallet</span>
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center space-x-3 min-h-touch px-4 py-3 rounded-lg font-medium transition-all duration-200 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="w-full flex items-center space-x-3 min-h-touch px-4 py-3 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-[#00E6B8] to-cyan-500 text-[#05131A] hover:opacity-90"
          type="button"
        >
          <LogIn className="w-5 h-5" />
          <span>Sign In</span>
        </button>
      )}
    </div>
  );
};

export default App;
