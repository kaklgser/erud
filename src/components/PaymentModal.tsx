import React, { useState, useEffect } from 'react';
import { X, Tag, CreditCard, Shield, Clock, CheckCircle } from 'lucide-react';
import { supabaseStorage } from '../utils/supabaseStorage';
import { PaymentSettings } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  questionPrice?: number;
  onSuccess: (paymentId: string, amount: number) => void;
}

// Razorpay configuration
const RAZORPAY_KEY_ID = 'rzp_live_U7N6E8ot31tiej';

// Declare Razorpay interface for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  questionId, 
  questionPrice, 
  onSuccess 
}) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    basePrice: 49,
    currency: 'INR',
    activeCoupons: []
  });
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [finalAmount, setFinalAmount] = useState(49);
  const [promoError, setPromoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPaymentSettings();
      loadRazorpay();
    }
  }, [isOpen]);

  const loadRazorpay = () => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setRazorpayLoaded(true));
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay script loaded successfully');
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      setRazorpayLoaded(false);
    };
    document.head.appendChild(script);
  };

  const loadPaymentSettings = async () => {
    try {
      const settings = await supabaseStorage.getPaymentSettings();
      setPaymentSettings(settings);
      const basePrice = questionPrice || settings.basePrice;
      setFinalAmount(basePrice);
      setPromoCode('');
      setAppliedCoupon(null);
      setPromoError('');
    } catch (error) {
      console.error('Error loading payment settings:', error);
    }
  };

  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    const coupon = paymentSettings.activeCoupons.find(
      c => c.code.toLowerCase() === promoCode.toLowerCase()
    );

    if (coupon) {
      const basePrice = questionPrice || paymentSettings.basePrice;
      const discount = (basePrice * coupon.discount) / 100;
      const discountedAmount = basePrice - discount;
      setFinalAmount(Math.max(0, Math.round(discountedAmount)));
      setAppliedCoupon(coupon.code);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
      setAppliedCoupon(null);
      setFinalAmount(questionPrice || paymentSettings.basePrice);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedCoupon(null);
    setFinalAmount(questionPrice || paymentSettings.basePrice);
    setPromoError('');
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      alert('Payment system is loading. Please wait a moment and try again.');
      return;
    }

    if (finalAmount === 0) {
      // Free access with 100% coupon
      onSuccess('free_access_' + Date.now(), 0);
      onClose();
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay order
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: finalAmount * 100, // Amount in paise (multiply by 100)
        currency: 'INR',
        name: 'PrimoJobs',
        description: 'Premium Question Access - 1 Hour',
        image: '/favicon.ico', // Add your logo here
        order_id: undefined, // We'll create this if needed
        handler: function (response: any) {
          console.log('Payment successful:', response);
          
          // Verify payment on success
          verifyPayment(response);
        },
        prefill: {
          name: 'PrimoJobs User',
          email: '', // You can get this from user context
          contact: ''
        },
        notes: {
          question_id: questionId,
          access_duration: '1_hour',
          coupon_applied: appliedCoupon || 'none'
        },
        theme: {
          color: '#2563eb' // Blue color matching your theme
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setLoading(false);
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 300, // 5 minutes timeout
        remember_customer: false
      };

      const razorpay = new window.Razorpay(options);
      
      // Handle payment failure
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        setLoading(false);
        
        let errorMessage = 'Payment failed. Please try again.';
        
        if (response.error.code === 'BAD_REQUEST_ERROR') {
          errorMessage = 'Invalid payment details. Please check and try again.';
        } else if (response.error.code === 'GATEWAY_ERROR') {
          errorMessage = 'Payment gateway error. Please try again or use a different payment method.';
        } else if (response.error.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (response.error.description) {
          errorMessage = response.error.description;
        }
        
        alert(errorMessage);
      });

      // Open Razorpay checkout
      razorpay.open();
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      setLoading(false);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const verifyPayment = async (paymentResponse: any) => {
    try {
      console.log('Verifying payment:', paymentResponse);
      
      // In a real application, you should verify the payment on your backend
      // For now, we'll assume the payment is successful if we get a payment_id
      
      if (paymentResponse.razorpay_payment_id) {
        console.log('Payment verified successfully');
        
        // Call success callback with payment details
        onSuccess(paymentResponse.razorpay_payment_id, finalAmount);
        onClose();
        
        // Show success message
        alert('Payment successful! You now have 1-hour access to this question.');
      } else {
        throw new Error('Payment verification failed');
      }
      
    } catch (error) {
      console.error('Payment verification error:', error);
      setLoading(false);
      alert('Payment verification failed. Please contact support if amount was deducted.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Payment Security Badge */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium text-sm">Secure Payment by Razorpay</p>
                  <p className="text-green-700 text-xs">Your payment information is encrypted and secure</p>
                </div>
              </div>
            </div>

            {/* Access Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Access Details</h3>
             
              <p className="text-lg font-bold text-blue-600">
                Base Price: ₹{questionPrice || paymentSettings.basePrice}
              </p>
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  What you get:
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Complete solution with step-by-step explanation</li>
                  <li>• Optimized code examples with comments</li>
                  <li>• Time & space complexity analysis</li>
                  <li>• Alternative approaches and best practices</li>
                 
                </ul>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Promo Code (Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!appliedCoupon || loading}
                />
                {appliedCoupon ? (
                  <button
                    onClick={removePromoCode}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={applyPromoCode}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                )}
              </div>
              {promoError && (
                <p className="text-sm text-red-600">{promoError}</p>
              )}
              {appliedCoupon && (
                <p className="text-sm text-green-600">
                  ✓ Promo code "{appliedCoupon}" applied successfully!
                </p>
              )}
            </div>

            {/* Final Amount */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Final Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{finalAmount}
                </span>
              </div>
              {appliedCoupon && (
                <p className="text-sm text-gray-600 mt-1">
                  Discount applied: {paymentSettings.activeCoupons.find(c => c.code === appliedCoupon)?.discount}% off ₹{questionPrice || paymentSettings.basePrice}
                </p>
              )}
              {finalAmount === 0 && (
                <p className="text-sm text-green-600 mt-1 font-medium">
                  🎉 Free access with 100% discount!
                </p>
              )}
            </div>

            {/* Available Coupons */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Available Promo Codes:</h4>
              <div className="grid grid-cols-1 gap-2">
                {paymentSettings.activeCoupons.map((coupon) => (
                  <div key={coupon.code} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-sm font-medium">{coupon.code}</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">{coupon.discount}% OFF</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : !razorpayLoaded ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Loading Payment...</span>
                </>
              ) : finalAmount === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Get Free Access</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  <span>Pay ₹{finalAmount} with Razorpay</span>
                </>
              )}
            </button>

            {/* Payment Methods Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Secure payment powered by Razorpay</p>
              <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
                <span>💳 Cards</span>
                <span>🏦 Net Banking</span>
                <span>📱 UPI</span>
                <span>💰 Wallets</span>
              </div>
            </div>

            {/* Access Duration Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium text-sm">100% secure</p>
                  <p className="text-yellow-700 text-xs">For any Queries message primojobs@gmail.com you get respond 5 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;