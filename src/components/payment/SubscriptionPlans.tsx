// src/components/payment/SubscriptionPlans.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Star,
  Zap,
  Crown,
  Clock,
  X,
  Tag,
  Sparkles,
  ArrowRight,
  Info,
  ChevronLeft,
  ChevronRight,
  Timer,
  Target,
  Rocket,
  Briefcase,
  Infinity,
  CheckCircle,
  AlertCircle,
  Wrench,
  Gift,
  Plus,
  ChevronDown,
  ChevronUp,
  Wallet
} from 'lucide-react';
import { SubscriptionPlan } from '../../types/payment';
import { paymentService } from '../../services/paymentService';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface SubscriptionPlansProps {
  isOpen: boolean;
  onNavigateBack: () => void;
  onSubscriptionSuccess: () => void;
  onShowAlert: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', actionText?: string, onAction?: () => void) => void;
  initialExpandAddons?: boolean;
}

type AddOn = {
  id: string;
  name: string;
  price: number;
};

type AppliedCoupon = {
  code: string;
  discount: number;
  finalAmount: number;
};

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  isOpen,
  onNavigateBack,
  onSubscriptionSuccess,
  onShowAlert,
  initialExpandAddons,
}) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);
  const [loadingWallet, setLoadingWallet] = useState<boolean>(true);
  const [showAddOns, setShowAddOns] = useState<boolean>(initialExpandAddons || false);
  const [selectedAddOns, setSelectedAddOns] = useState<{ [key: string]: number }>({});
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const plans: SubscriptionPlan[] = paymentService.getPlans();
  const addOns: AddOn[] = paymentService.getAddOns();

  const allPlansWithAddOnOption = [...plans];

  // Helper function (Diwali promo disabled)
  const isDiwaliEligiblePlan = (_planId: string) => {
    return false;
  };

  useEffect(() => {
    if (user && isOpen) {
      fetchWalletBalance();
    }
  }, [user, isOpen]);

  const fetchWalletBalance = async () => {
    if (!user) return;
    setLoadingWallet(true);
    try {
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('amount, status')
        .eq('user_id', user.id);
      if (error) {
        console.error('Error fetching wallet balance:', error);
        return;
      }
      const completed = (transactions || []).filter((t: any) => t.status === 'completed');
      const balance = completed.reduce((sum: number, tr: any) => sum + parseFloat(tr.amount), 0) * 100;
      setWalletBalance(Math.max(0, balance));
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoadingWallet(false);
    }
  };

  if (!isOpen) return null;

  const getPlanIcon = (iconType: string) => {
    switch (iconType) {
      case 'crown':
        return <Crown className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'zap':
        return <Zap className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'rocket':
        return <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'target':
        return <Target className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'wrench':
        return <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'check_circle':
        return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'gift':
        return <Gift className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'briefcase':
        return <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'infinity':
        return <Infinity className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <Star className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % allPlansWithAddOnOption.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + allPlansWithAddOnOption.length) % allPlansWithAddOnOption.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      onShowAlert('Coupon Error', 'Please enter a coupon code.', 'warning');
      return;
    }
    if (!user) {
      onShowAlert('Authentication Required', 'Please sign in to apply coupon.', 'error', 'Sign In', () => {});
      return;
    }

    const result = await paymentService.applyCoupon(selectedPlan, couponCode.trim(), user.id);

    if (result.isValid) {
      setAppliedCoupon({
        code: result.couponApplied!,
        discount: result.discountAmount,
        finalAmount: result.finalAmount,
      });
      setCouponError('');
      // ✅ UPDATED: Special message for DIWALI coupon
      if (result.couponApplied?.toLowerCase() === 'diwali') {
        onShowAlert('🪔 Diwali Offer Applied!', result.message, 'success');
      } else {
        onShowAlert('Coupon Applied!', result.message, 'success');
      }
    } else {
      setCouponError(result.message);
      setAppliedCoupon(null);
      onShowAlert('Coupon Error', result.message, 'warning');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const selectedPlanData = allPlansWithAddOnOption.find((p) => p.id === selectedPlan);

  const addOnsTotal = Object.entries(selectedAddOns).reduce((total, [addOnId, qty]) => {
    const addOn = paymentService.getAddOnById(addOnId);
    return total + (addOn ? addOn.price * 100 * qty : 0);
  }, 0);

  let planPrice = (selectedPlanData?.price || 0) * 100;
  if (appliedCoupon) {
    planPrice = appliedCoupon.finalAmount;
  }

  const walletDeduction = useWalletBalance ? Math.min(walletBalance, planPrice) : 0;
  const finalPlanPrice = Math.max(0, planPrice - walletDeduction);
  const grandTotal = finalPlanPrice + addOnsTotal;

  const handlePayment = async () => {
    if (!user || !selectedPlanData) return;
    setIsProcessing(true);

    console.log('DEBUG: handlePayment - walletBalance (paise):', walletBalance);
    console.log('DEBUG: handlePayment - planPrice (paise, after coupon):', planPrice);
    console.log('DEBUG: handlePayment - walletDeduction (paise):', walletDeduction);
    console.log('DEBUG: handlePayment - finalPlanPrice (paise):', finalPlanPrice);
    console.log('DEBUG: handlePayment - addOnsTotal (paise):', addOnsTotal);
    console.log('DEBUG: handlePayment - grandTotal (paise):', grandTotal);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('SubscriptionPlans: session object after getSession:', session);
      console.log('SubscriptionPlans: session.access_token after getSession:', session?.access_token);

      if (sessionError || !session || !session.access_token) {
        console.error('SubscriptionPlans: No active session found for payment:', sessionError);
        onShowAlert('Authentication Required', 'Please log in to complete your purchase.', 'error', 'Sign In', () => {});
        setIsProcessing(false);
        return;
      }

      const accessToken = session.access_token;

      console.log('SubscriptionPlans: Value of accessToken before calling processPayment:', accessToken);

      if (grandTotal === 0) {
        const result = await paymentService.processFreeSubscription(
          selectedPlan,
          user.id,
          appliedCoupon ? appliedCoupon.code : undefined,
          addOnsTotal,
          selectedAddOns,
          selectedPlanData.price * 100,
          walletDeduction
        );
        if (result.success) {
          await fetchWalletBalance();
          onSubscriptionSuccess();
          // ✅ UPDATED: Special message for CHRISTMAS coupon
          if (appliedCoupon?.code.toLowerCase() === 'christmas') {
            onShowAlert('🎉 New Year Offer Activated!', 'Your subscription has been activated with discount! Happy New Year 2025! 🎊', 'success');
          } else {
            onShowAlert('Subscription Activated!', 'Your free plan has been activated successfully.', 'success');
          }
        } else {
          console.error(result.error || 'Failed to activate free plan.');
          onShowAlert('Activation Failed', result.error || 'Failed to activate free plan.', 'error');
        }
      } else {
        const paymentData = {
          planId: selectedPlan,
          amount: grandTotal,
          currency: 'INR',
        };
        const result = await paymentService.processPayment(
          paymentData,
          user.email,
          user.name,
          accessToken,
          appliedCoupon ? appliedCoupon.code : undefined,
          walletDeduction,
          addOnsTotal,
          selectedAddOns
        );
        if (result.success) {
          await fetchWalletBalance();
          onSubscriptionSuccess();
          // ✅ UPDATED: Special message for DIWALI coupon
          if (appliedCoupon?.code.toLowerCase() === 'diwali') {
            onShowAlert('🪔 Payment Successful!', 'Congratulations! You saved 90% with our Diwali offer! 🎉', 'success');
          } else {
            onShowAlert('Payment Successful!', 'Your subscription has been activated.', 'success');
          }
        } else {
          console.error('Payment failed:', result.error);
          if (result.error && result.error.includes('Payment cancelled by user')) {
            onShowAlert('Payment Cancelled', 'You have cancelled the payment. Please try again if you wish to proceed.', 'info');
          } else {
            onShowAlert('Payment Failed', result.error || 'Payment processing failed. Please try again.', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Payment process error:', error);
      onShowAlert('Payment Error', error instanceof Error ? error.message : 'An unexpected error occurred during payment.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddOnQuantityChange = (addOnId: string, quantity: number) => {
    console.log('DEBUG: handleAddOnQuantityChange called for:', addOnId, 'with quantity:', quantity);
    setSelectedAddOns((prev) => ({
      ...prev,
      [addOnId]: Math.max(0, quantity),
    }));
  };

  // Show plans directly - no step system needed

  return (
    <div className="fixed inset-0 lg:left-16 bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] flex items-start justify-center z-50 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Close Button */}
        <button
          onClick={onNavigateBack}
          className="fixed top-4 right-4 lg:right-8 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors rounded-full bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-sm z-50 border border-slate-700/50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Simple Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Success Plan</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Invest in your career with our flexible pricing options
          </p>
        </div>

        {/* Main Content Area */}
        <>
            {/* Desktop: Clean minimal cards like reference */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-0">
              {allPlansWithAddOnOption.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`relative bg-[#1a1d24] border-r border-slate-800 last:border-r-0 flex flex-col ${
                    index === 0 ? 'rounded-l-2xl' : ''
                  } ${index === allPlansWithAddOnOption.length - 1 ? 'rounded-r-2xl' : ''}`}
                >
                  {/* Header Section */}
                  <div className="p-6 pb-4">
                    {/* Plan Name & Popular Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-slate-100">{plan.name}</h3>
                      {plan.popular && (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                          POPULAR
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-bold text-slate-100">₹{plan.price}</span>
                      <span className="text-slate-500 text-sm">one-time</span>
                    </div>
                    <p className="text-slate-500 text-sm mb-6">{plan.optimizations} credits included</p>

                    {/* CTA Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan.id);
                        // Scroll to checkout section
                        setTimeout(() => {
                          document.getElementById('pay-now-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                        plan.popular
                          ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {plan.popular ? 'Get Started' : 'Select Plan'}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-800 mx-6" />

                  {/* Features Section */}
                  <div className="p-6 pt-5 flex-1">
                    <p className="text-slate-400 text-sm font-medium mb-4">You get:</p>
                    <div className="space-y-3">
                      {(plan.features || []).map((feature: string, fi: number) => (
                        <div key={fi} className="flex items-start gap-3 text-sm">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300">{feature.replace('✅ ', '').replace('❌ ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile/Tablet: Carousel with 1 card */}
            <div className="lg:hidden relative">
              {/* Carousel Container */}
              <div 
                className="overflow-hidden touch-pan-y" 
                ref={carouselRef}
                onTouchStart={(e) => {
                  setDragStart(e.touches[0].clientX);
                  setIsDragging(true);
                }}
                onTouchMove={() => {
                  // Touch move handled in onTouchEnd
                }}
                onTouchEnd={(e) => {
                  if (!isDragging || dragStart === null) return;
                  const endX = e.changedTouches[0].clientX;
                  const diff = dragStart - endX;
                  const threshold = 50; // minimum swipe distance
                  
                  if (diff > threshold && currentSlide < allPlansWithAddOnOption.length - 1) {
                    setCurrentSlide(prev => prev + 1);
                  } else if (diff < -threshold && currentSlide > 0) {
                    setCurrentSlide(prev => prev - 1);
                  }
                  
                  setDragStart(null);
                  setIsDragging(false);
                }}
                onMouseDown={(e) => {
                  setDragStart(e.clientX);
                  setIsDragging(true);
                }}
                onMouseMove={() => {
                  // Mouse move handled in onMouseUp
                }}
                onMouseUp={(e) => {
                  if (!isDragging || dragStart === null) return;
                  const diff = dragStart - e.clientX;
                  const threshold = 50;
                  
                  if (diff > threshold && currentSlide < allPlansWithAddOnOption.length - 1) {
                    setCurrentSlide(prev => prev + 1);
                  } else if (diff < -threshold && currentSlide > 0) {
                    setCurrentSlide(prev => prev - 1);
                  }
                  
                  setDragStart(null);
                  setIsDragging(false);
                }}
                onMouseLeave={() => {
                  setDragStart(null);
                  setIsDragging(false);
                }}
              >
                <motion.div
                  className="flex cursor-grab active:cursor-grabbing"
                  animate={{ x: `-${currentSlide * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {allPlansWithAddOnOption.map((plan, index) => (
                    <div key={plan.id} className="w-full flex-shrink-0 px-2">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col ${
                          selectedPlan === plan.id
                            ? 'border-emerald-400/60 bg-gradient-to-b from-emerald-500/15 to-cyan-500/10 shadow-[0_0_40px_rgba(16,185,129,0.25)]'
                            : plan.popular
                              ? 'border-emerald-400/40 bg-slate-900/80 shadow-lg'
                              : 'border-slate-700/50 bg-slate-900/60'
                        }`}
                        onClick={() => {
                          setSelectedPlan(plan.id);
                          // Scroll to checkout section
                          setTimeout(() => {
                            document.getElementById('pay-now-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }}
                      >
                        {/* Popular Badge */}
                        {plan.popular && (
                          <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
                            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-1.5 rounded-b-xl text-xs font-bold flex items-center gap-1.5 shadow-lg">
                              <Crown className="w-3.5 h-3.5" />
                              Best Value
                            </div>
                          </div>
                        )}

                        <div className="p-6 flex flex-col flex-1">
                          {/* Plan Icon & Name */}
                          <div className="text-center mb-6 pt-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                              plan.popular 
                                ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/30' 
                                : 'bg-slate-800 border border-slate-700'
                            }`}>
                              {index === 0 ? <Rocket className="w-8 h-8 text-white" /> : 
                               index === 1 ? <Target className="w-8 h-8 text-white" /> : 
                               <Zap className="w-8 h-8 text-white" />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-100">{plan.name}</h3>
                          </div>

                          {/* Price */}
                          <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <span className="text-slate-500 line-through text-sm">₹{plan.mrp}</span>
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">
                                {plan.discountPercentage}% OFF
                              </span>
                            </div>
                            <div className="text-4xl font-bold text-slate-100">₹{plan.price}</div>
                            <p className="text-slate-400 text-sm mt-1">One-time purchase</p>
                          </div>

                          {/* Credits Badge */}
                          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 rounded-xl px-4 py-3 text-center mb-6">
                            <div className="text-3xl font-bold text-indigo-300">{plan.optimizations}</div>
                            <div className="text-sm text-indigo-400">Resume Credits</div>
                          </div>

                          {/* Features */}
                          <div className="space-y-3 mb-6 flex-1">
                            {(plan.features || []).slice(0, 5).map((feature: string, fi: number) => (
                              <div key={fi} className="flex items-center gap-2 text-sm text-slate-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span>{feature.replace('✅ ', '').replace('❌ ', '')}</span>
                              </div>
                            ))}
                          </div>

                          {/* CTA Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlan(plan.id);
                              // Scroll to checkout section
                              setTimeout(() => {
                                document.getElementById('pay-now-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                              plan.popular
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/25'
                                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                            }`}
                          >
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Selection Indicator */}
                        {selectedPlan === plan.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                        )}
                      </motion.div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Carousel Navigation Arrows */}
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl z-10 ${
                  currentSlide === 0 
                    ? 'bg-slate-800/50 border border-slate-700/50 text-slate-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 border border-emerald-400/50 text-white hover:from-emerald-400 hover:to-cyan-400 hover:scale-110'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlide === allPlansWithAddOnOption.length - 1}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl z-10 ${
                  currentSlide === allPlansWithAddOnOption.length - 1 
                    ? 'bg-slate-800/50 border border-slate-700/50 text-slate-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 border border-emerald-400/50 text-white hover:from-emerald-400 hover:to-cyan-400 hover:scale-110'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Swipe Hint */}
              <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 3, duration: 1 }}
                className="text-center mt-4 text-slate-500 text-sm flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4 animate-pulse" />
                <span>Swipe to explore plans</span>
                <ChevronRight className="w-4 h-4 animate-pulse" />
              </motion.div>

              {/* Carousel Dots & Progress */}
              <div className="flex flex-col items-center gap-3 mt-4">
                <div className="flex justify-center gap-3">
                  {allPlansWithAddOnOption.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`relative transition-all duration-300 ${
                        currentSlide === index
                          ? 'w-10 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/30'
                          : 'w-3 h-3 rounded-full bg-slate-600 hover:bg-slate-500 hover:scale-125'
                      }`}
                    >
                      {currentSlide === index && (
                        <motion.div
                          layoutId="activeDot"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-xs">
                  {currentSlide + 1} of {allPlansWithAddOnOption.length} plans
                </p>
              </div>
            </div>
          </>

        {/* Checkout Section - Shows when plan is selected */}
        {selectedPlan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            {/* Selected Plan Indicator */}
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-200">
                  Selected: <span className="font-semibold text-emerald-400">{selectedPlanData?.name}</span> - ₹{selectedPlanData?.price}
                </span>
              </div>
              <button 
                onClick={() => setSelectedPlan(null)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                Change
              </button>
            </div>

            {/* Add-ons Section */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-100 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-purple-400" />
                  Add-ons
                </h2>
                <button
                  onClick={() => setShowAddOns(!showAddOns)}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>{showAddOns ? 'Hide' : 'Show'} Add-ons</span>
                  {showAddOns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              {showAddOns && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {addOns.map((addOn) => (
                    <div key={addOn.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <h3 className="font-semibold text-slate-100 mb-1">{addOn.name}</h3>
                      <p className="text-sm text-slate-400 mb-3">₹{addOn.price}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAddOnQuantityChange(addOn.id, (selectedAddOns[addOn.id] || 0) - 1)}
                          disabled={(selectedAddOns[addOn.id] || 0) === 0}
                          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="font-bold text-lg text-slate-100 w-8 text-center">
                          {selectedAddOns[addOn.id] || 0}
                        </span>
                        <button
                          onClick={() => handleAddOnQuantityChange(addOn.id, (selectedAddOns[addOn.id] || 0) + 1)}
                          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Coupon Code Section */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-amber-400" />
                Apply Coupon Code
              </h2>
              {isDiwaliEligiblePlan(selectedPlan || '') && !appliedCoupon && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Gift className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-amber-300 font-bold">🪔 Diwali Special!</p>
                      <p className="text-amber-400/80 text-sm">
                        Use code <span className="font-bold bg-amber-500 text-white px-2 py-0.5 rounded">DIWALI</span> to get 90% OFF!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400/50"
                  disabled={!!appliedCoupon}
                />
                {!appliedCoupon ? (
                  <button
                    onClick={handleApplyCoupon}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50"
                    disabled={!couponCode.trim()}
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    onClick={handleRemoveCoupon}
                    className="px-6 py-3 bg-slate-700 text-slate-200 rounded-xl font-semibold hover:bg-slate-600"
                  >
                    Remove
                    </button>
                  )}
                </div>
              {couponError && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {couponError}
                </p>
              )}
              {appliedCoupon && (
                <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 mt-3">
                  <p className="text-emerald-300 font-semibold flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Coupon "{appliedCoupon.code.toUpperCase()}" applied!
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-slate-400">You saved:</span>
                    <span className="text-xl font-bold text-emerald-400">
                      ₹{(appliedCoupon.discount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Wallet Balance Section */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-emerald-400" />
                Wallet Balance
              </h2>
              {loadingWallet ? (
                <div className="text-slate-400">Loading wallet...</div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-slate-100">
                    ₹{(walletBalance / 100).toFixed(2)}
                  </span>
                  {walletBalance > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useWalletBalance}
                        onChange={(e) => setUseWalletBalance(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-emerald-500 rounded bg-slate-800 border-slate-600 focus:ring-emerald-500"
                      />
                      <span className="text-slate-300 text-sm">Use wallet balance</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-400" />
                Order Summary
              </h2>
              <div className="space-y-3 text-slate-300">
                <div className="flex justify-between">
                  <span>Plan Price:</span>
                  <span>₹{(planPrice / 100).toFixed(2)}</span>
                </div>
                {Object.keys(selectedAddOns).length > 0 && (
                  <div className="flex justify-between">
                    <span>Add-ons:</span>
                    <span>₹{(addOnsTotal / 100).toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon Discount:</span>
                    <span>- ₹{(appliedCoupon.discount / 100).toFixed(2)}</span>
                  </div>
                )}
                {useWalletBalance && walletDeduction > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Wallet Deduction:</span>
                    <span>- ₹{(walletDeduction / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-slate-100 border-t border-slate-700 pt-3 mt-3">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400">₹{(grandTotal / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              id="pay-now-btn"
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-lg font-semibold rounded-xl hover:from-emerald-400 hover:to-cyan-400 shadow-lg shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Proceed to Checkout <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
