import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Loader2,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface PaymentTransaction {
  id: string;
  plan_id: string | null;
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  purchase_type: string | null;
  coupon_code: string | null;
  discount_amount: number;
  final_amount: number;
  wallet_deduction_amount: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  success: { label: 'Success', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: <XCircle className="w-3.5 h-3.5" /> },
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: <Clock className="w-3.5 h-3.5" /> },
};

export const ProfilePaymentsTab: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (paise: number) => {
    return (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 });
  };

  const formatPurchaseType = (type: string | null) => {
    if (!type) return 'Purchase';
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#00E6B8] mr-2" />
        <span className="text-slate-400">Loading payment history...</span>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 bg-[#0a1a24] rounded-xl border border-[#0c1d25]">
        <Receipt className="w-14 h-14 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-200 mb-2">No Transactions</h3>
        <p className="text-slate-400 max-w-sm mx-auto">
          Your payment history will appear here once you make a purchase.
        </p>
      </div>
    );
  }

  const totalSpent = transactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + t.final_amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-[#0a1a24] rounded-xl border border-[#0c1d25] p-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-4 h-4 text-[#00E6B8]" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {formatAmount(totalSpent)}
          </p>
        </div>
        <div className="bg-[#0a1a24] rounded-xl border border-[#0c1d25] p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Purchases</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {transactions.filter(t => t.status === 'success').length}
          </p>
        </div>
        <div className="bg-[#0a1a24] rounded-xl border border-[#0c1d25] p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Saved</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">
            {formatAmount(transactions.reduce((sum, t) => sum + (t.discount_amount || 0) + (t.wallet_deduction_amount || 0), 0))}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Transaction History</h3>
        <div className="space-y-3">
          {transactions.map((tx) => {
            const st = statusConfig[tx.status] || statusConfig.pending;
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a1a24] border border-[#0c1d25] rounded-xl p-4 hover:border-[rgba(0,230,184,0.15)] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {tx.plan_id ? tx.plan_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : formatPurchaseType(tx.purchase_type)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-100">
                      {formatAmount(tx.final_amount)}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1 ${st.color}`}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                </div>
                {(tx.coupon_code || tx.wallet_deduction_amount > 0) && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 pt-2 border-t border-[#0c1d25]">
                    {tx.coupon_code && <span>Coupon: <span className="text-[#00E6B8]">{tx.coupon_code}</span></span>}
                    {tx.wallet_deduction_amount > 0 && <span>Wallet used: {formatAmount(tx.wallet_deduction_amount)}</span>}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
