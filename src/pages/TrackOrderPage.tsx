import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, Package, CheckCircle2, Truck, Home, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';

const STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2, desc: 'Order confirmed & payment received' },
  { key: 'PROCESSING', label: 'Processing', icon: Package, desc: 'Being packed & prepared' },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck, desc: 'Out for delivery' },
  { key: 'DELIVERED', label: 'Delivered', icon: Home, desc: 'Successfully delivered' },
];

const ORDER_STEP_INDEX: Record<string, number> = {
  PENDING: -1, CONFIRMED: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: -2,
};

function OrderStepper({ status }: { status: string }) {
  const activeIdx = ORDER_STEP_INDEX[status] ?? 0;
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-tr-2xl rounded-bl-2xl p-4">
        <AlertCircle size={20} className="text-red-500" />
        <span className="text-red-700 font-semibold text-sm">This order was cancelled.</span>
      </div>
    );
  }
  return (
    <div className="relative">
      {/* Desktop horizontal */}
      <div className="hidden md:flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const done = idx <= activeIdx;
          const active = idx === activeIdx;
          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {idx < STEPS.length - 1 && (
                <div className={`absolute top-5 left-1/2 w-full h-0.5 ${idx < activeIdx ? 'bg-[#D39858]' : 'bg-[#34150F]/15'}`} />
              )}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? 'bg-[#D39858] border-[#D39858]' : 'bg-[#f5e8d4] border-[#34150F]/20'
              } ${active ? 'ring-4 ring-[#D39858]/30 scale-110' : ''}`}>
                <Icon size={18} className={done ? 'text-[#34150F]' : 'text-[#85431E]/40'} />
              </div>
              <p className={`text-xs font-bold mt-2 text-center ${done ? 'text-[#34150F]' : 'text-[#85431E]/50'}`}>{step.label}</p>
              <p className={`text-[10px] text-center max-w-[90px] mt-0.5 ${done ? 'text-[#85431E]' : 'text-[#85431E]/40'}`}>{step.desc}</p>
            </div>
          );
        })}
      </div>
      {/* Mobile vertical */}
      <div className="md:hidden flex flex-col gap-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const done = idx <= activeIdx;
          const active = idx === activeIdx;
          return (
            <div key={step.key} className="flex items-start gap-4 relative">
              {idx < STEPS.length - 1 && <div className={`absolute left-4 top-10 w-0.5 h-full ${idx < activeIdx ? 'bg-[#D39858]' : 'bg-[#34150F]/15'}`} />}
              <div className={`relative z-10 w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
                done ? 'bg-[#D39858] border-[#D39858]' : 'bg-[#f5e8d4] border-[#34150F]/20'
              } ${active ? 'ring-4 ring-[#D39858]/30' : ''}`}>
                <Icon size={16} className={done ? 'text-[#34150F]' : 'text-[#85431E]/40'} />
              </div>
              <div className="pb-8">
                <p className={`text-sm font-bold ${done ? 'text-[#34150F]' : 'text-[#85431E]/50'}`}>{step.label}</p>
                <p className={`text-xs mt-0.5 ${done ? 'text-[#85431E]' : 'text-[#85431E]/40'}`}>{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrackOrderPage() {
  const { orderId: paramOrderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [inputId, setInputId] = useState(paramOrderId || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paramOrderId) fetchOrder(paramOrderId);
  }, [paramOrderId]);

  const fetchOrder = async (id: string) => {
    if (!isAuthenticated) { openAuthModal('login'); return; }
    setLoading(true); setError('');
    const res = await fetchApi(`/orders/${id}`);
    if (res.success && res.data) {
      setOrder(res.data?.order ?? res.data);
    } else {
      setError('Order not found. Please check the order number and try again.');
      setOrder(null);
    }
    setLoading(false);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) return;
    navigate(`/track-order/${inputId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-[#EACEAA] px-3 sm:px-4 py-4 sm:py-10 pb-20 sm:pb-12 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-4 sm:mb-10">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#34150F] rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl flex items-center justify-center mx-auto mb-2.5 sm:mb-4 shadow-sm">
            <Truck size={24} className="text-[#D39858] sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>Track Your Order</h1>
          <p className="text-xs sm:text-sm text-[#85431E] mt-1 sm:mt-2">Enter your order ID to see real-time delivery status</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-8">
          <input
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            placeholder="Enter Order ID (e.g. ORD-2024-001)"
            className="flex-1 bg-[#f5e8d4] text-[#34150F] placeholder-[#85431E]/50 px-3.5 py-2.5 sm:py-3 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors text-xs sm:text-sm"
          />
          <button type="submit" className="flex items-center justify-center gap-2 bg-[#34150F] text-[#EACEAA] px-6 py-2.5 sm:py-3 rounded-tr-xl rounded-bl-xl font-bold hover:bg-[#85431E] transition-colors text-xs sm:text-sm">
            <Search size={15} /> Track
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 animate-pulse">
            <div className="flex justify-between mb-8">
              {[1,2,3,4].map(i => <div key={i} className="flex flex-col items-center gap-2"><div className="w-10 h-10 bg-[#34150F]/10 rounded-full" /><div className="h-3 w-16 bg-[#34150F]/10 rounded" /></div>)}
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-[#34150F]/10 rounded w-1/2" />
              <div className="h-4 bg-[#34150F]/10 rounded w-3/4" />
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 text-center border border-red-200">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#34150F] mb-1" style={{ fontFamily: "'Gilda Display', serif" }}>Order Not Found</h3>
            <p className="text-sm text-[#85431E]">{error}</p>
            <Link to="/profile" className="inline-block mt-4 text-sm font-bold text-[#D39858] hover:underline">View my orders →</Link>
          </div>
        )}

        {/* Order Detail */}
        {!loading && order && (
          <div className="space-y-6">
            {/* Status stepper */}
            <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 border border-[rgba(52,21,15,0.08)] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>Order #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}</h2>
                  <p className="text-xs text-[#85431E] mt-0.5">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <span className={`px-3 py-1 rounded-tr-lg rounded-bl-lg text-xs font-bold border ${
                  order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  order.status === 'SHIPPED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>{order.status}</span>
              </div>
              <OrderStepper status={order.status} />
            </div>

            {/* Items */}
            {Array.isArray(order.items) && order.items.length > 0 && (
              <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 border border-[rgba(52,21,15,0.08)]">
                <h3 className="font-bold text-[#34150F] mb-4" style={{ fontFamily: "'Gilda Display', serif" }}>Items in this order</h3>
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#34150F]">{item.productName || item.product?.name}</p>
                        <p className="text-xs text-[#85431E]">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-[#34150F] text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>₹{Number(item.total || item.price).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[rgba(52,21,15,0.1)] mt-4 pt-4 flex justify-between">
                  <span className="font-bold text-[#34150F]">Total</span>
                  <span className="font-bold text-[#34150F]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{Number(order.grandTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3">
              <Link to="/profile" className="flex-1 text-center bg-[#34150F] text-[#EACEAA] px-6 py-3 rounded-tr-xl rounded-bl-xl font-bold hover:bg-[#85431E] transition-colors text-sm">
                View All Orders
              </Link>
              <Link to="/contact" className="flex-1 text-center bg-[#f5e8d4] text-[#34150F] border border-[rgba(52,21,15,0.15)] px-6 py-3 rounded-tr-xl rounded-bl-xl font-bold hover:bg-[#D39858] transition-colors text-sm">
                Contact Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
