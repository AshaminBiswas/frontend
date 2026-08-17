import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, CreditCard, MapPin, Building2, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { CartItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice, isB2BUser } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";
import { fetchApi } from "../services/api";

interface CheckoutPageProps {
  cart: CartItem[];
  onClearCart: () => void;
}

export function CheckoutPage({ cart, onClearCart }: CheckoutPageProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("400001");

  const [gstin, setGstin] = useState(user?.gstin || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod" | "bank">("razorpay");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isB2B = isB2BUser(user);
  const b2bCache = useB2BPricing();

  const subtotal = cart.reduce((sum, item) => {
    const effective = getEffectivePrice(item, user, item.qty, b2bCache);
    return sum + effective.totalPrice;
  }, 0);

  const gstAmount = Math.round(subtotal * 0.18);
  const shippingFee = subtotal >= 2000 ? 0 : 150;
  const grandTotal = subtotal + gstAmount + shippingFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    if (!addressLine.trim() || !pincode.trim()) {
      setErrorMsg("Please fill in your complete shipping address and pincode.");
      return;
    }

    if (isB2B && (!companyName.trim() || !gstin.trim())) {
      setErrorMsg("B2B orders require a valid Company Name and 15-digit GSTIN.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate / Create order API call
      const orderPayload = {
        items: cart.map((i) => ({
          productId: i.id,
          quantity: i.qty,
          unitPrice: getEffectivePrice(i, user, i.qty, b2bCache).unitPrice,
        })),
        shippingAddress: { line1: addressLine, city, state, pincode },
        gstin: isB2B ? gstin : undefined,
        companyName: isB2B ? companyName : undefined,
        paymentMethod,
        totalAmount: grandTotal,
      };

      const res = await fetchApi("/checkout/place-order", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      const orderId = res?.data?.id || `ORD-${Date.now().toString().slice(-6)}`;
      onClearCart();
      setIsSubmitting(false);
      navigate(`/order-success/${orderId}`);
    } catch {
      // Fallback local order placement
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      onClearCart();
      setIsSubmitting(false);
      navigate(`/order-success/${orderId}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#EACEAA]/20 py-16 px-4 text-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-md mx-auto bg-white p-8 rounded-tr-3xl rounded-bl-3xl border border-[#34150F]/8 shadow-sm">
          <Lock size={40} className="text-[#D39858] mx-auto mb-3" />
          <h2 className="text-xl font-black text-[#34150F] mb-2">Authentication Required</h2>
          <p className="text-xs text-[#85431E] mb-6">
            Please log in or create an account to proceed with checkout and receive GST invoices.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="w-full bg-[#34150F] text-[#EACEAA] font-black py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-sm shadow-md"
          >
            Sign In / Register to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-8 px-4 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-[#34150F] mb-6 flex items-center gap-3" style={{ fontFamily: "'Gilda Display', serif" }}>
          <ShieldCheck size={28} className="text-[#D39858]" /> Checkout & GST Invoice
        </h1>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-tr-xl rounded-bl-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Shipping & GST Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Address */}
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 border border-[#34150F]/8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-[#D39858]" /> Shipping & Delivery Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                    Address Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Plot No. 42, Industrial Area, Phase 1"
                    className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* B2B GST Details */}
            {isB2B && (
              <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 border border-[#34150F]/8 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-4 flex items-center gap-2">
                  <Building2 size={16} className="text-[#D39858]" /> B2B GST Tax Invoice Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required={isB2B}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                      GSTIN (15 Chars) *
                    </label>
                    <input
                      type="text"
                      required={isB2B}
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 border border-[#34150F]/8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-[#D39858]" /> Payment Options
              </h3>
              <div className="space-y-3">
                {[
                  { id: "razorpay", title: "Razorpay Online Payment (UPI / Cards / NetBanking / EMI)", badge: "Recommended" },
                  { id: "cod", title: "Pay on Delivery (Cash / UPI upon delivery)", badge: null },
                  { id: "bank", title: "Direct Bank NEFT / RTGS Transfer (B2B Bulk Orders)", badge: null },
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center justify-between p-4 rounded-tr-xl rounded-bl-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === pm.id
                        ? "border-[#34150F] bg-[#EACEAA]/30 shadow-sm"
                        : "border-[#34150F]/10 hover:border-[#34150F]/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id as any)}
                        className="accent-[#34150F]"
                      />
                      <span className="text-xs font-bold text-[#34150F]">{pm.title}</span>
                    </div>
                    {pm.badge && (
                      <span className="text-[9px] font-black uppercase bg-[#34150F] text-[#EACEAA] px-2 py-0.5 rounded-full">
                        {pm.badge}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 border border-[#34150F]/8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-4 pb-2 border-b border-[#34150F]/8">
                Order Review ({cart.length} items)
              </h3>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const effective = getEffectivePrice(item, user, item.qty, b2bCache);
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-[#34150F]/6">
                      <div className="truncate pr-2">
                        <p className="font-bold text-[#34150F] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#85431E]">Qty: {item.qty}</p>
                      </div>
                      <span className="font-black text-[#34150F]">₹{effective.totalPrice.toLocaleString("en-IN")}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-[#85431E]">Subtotal</span>
                  <span className="font-bold text-[#34150F]">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#85431E]">GST (18%)</span>
                  <span className="font-bold text-[#34150F]">+₹{gstAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#85431E]">Shipping Fee</span>
                  <span className="font-bold text-[#34150F]">
                    {shippingFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="border-t border-[#34150F]/8 pt-2 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-[#34150F] block">Grand Total</span>
                    <span className="text-[10px] text-[#85431E]/70 font-medium">Includes 18% GST</span>
                  </div>
                  <span className="text-base font-black text-[#D39858]">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#34150F] text-[#EACEAA] font-black py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-sm shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Processing Order..." : `Place Order — ₹${grandTotal.toLocaleString("en-IN")}`}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
