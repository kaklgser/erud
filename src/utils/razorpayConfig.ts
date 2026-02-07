// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  KEY_ID: 'rzp_live_U7N6E8ot31tiej',
  KEY_SECRET: 'HG2iWDiXa39rXibjCYQYxDs5', // This should be kept secure on backend
  CURRENCY: 'INR',
  COMPANY_NAME: 'PrimoJobs',
  COMPANY_LOGO: '/favicon.ico',
  THEME_COLOR: '#2563eb'
};

// Payment verification utility (should be done on backend in production)
export const verifyRazorpayPayment = async (paymentData: {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}) => {
  try {
    // In production, this verification should be done on your backend server
    // using the Razorpay webhook or API with your secret key
    
    console.log('Payment data received:', paymentData);
    
    // For now, we'll do basic validation
    if (!paymentData.razorpay_payment_id) {
      throw new Error('Invalid payment ID');
    }
    
    // Payment ID format validation (Razorpay payment IDs start with 'pay_')
    if (!paymentData.razorpay_payment_id.startsWith('pay_')) {
      throw new Error('Invalid payment ID format');
    }
    
    return {
      success: true,
      payment_id: paymentData.razorpay_payment_id,
      verified: true
    };
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message,
      verified: false
    };
  }
};

// Create Razorpay order (should be done on backend)
export const createRazorpayOrder = async (amount: number, currency: string = 'INR') => {
  try {
    // In production, this should be an API call to your backend
    // which creates the order using Razorpay Orders API
    
    const orderData = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100, // Convert to paise
      currency: currency,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000)
    };
    
    return {
      success: true,
      order: orderData
    };
    
  } catch (error) {
    console.error('Order creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Payment status tracking
export interface PaymentStatus {
  payment_id: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number;
  currency: string;
  created_at: number;
  method?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  card_id?: string;
}

// Get payment status (should be done via backend API)
export const getPaymentStatus = async (paymentId: string): Promise<PaymentStatus | null> => {
  try {
    // In production, this should be an API call to your backend
    // which fetches payment status from Razorpay
    
    console.log('Fetching payment status for:', paymentId);
    
    // Mock response for now
    return {
      payment_id: paymentId,
      status: 'captured',
      amount: 4900, // Amount in paise
      currency: 'INR',
      created_at: Math.floor(Date.now() / 1000),
      method: 'card'
    };
    
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return null;
  }
};

// Refund payment (should be done via backend API)
export const refundPayment = async (paymentId: string, amount?: number) => {
  try {
    // In production, this should be an API call to your backend
    // which processes refund via Razorpay Refunds API
    
    console.log('Processing refund for payment:', paymentId, 'amount:', amount);
    
    return {
      success: true,
      refund_id: `rfnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      status: 'processed'
    };
    
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Webhook signature verification (for backend use)
export const verifyWebhookSignature = (
  webhookBody: string,
  webhookSignature: string,
  webhookSecret: string
) => {
  try {
    // This should be implemented on your backend
    // using crypto.createHmac('sha256', webhookSecret)
    
    console.log('Webhook verification should be done on backend');
    return true;
    
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
};