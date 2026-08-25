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
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || "Failed to place order. Please try again or contact support.");
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
    <div className="min-h-screen bg-[#EACEAA]/20 py-4 sm:py-8 px-3 sm:px-6 md:px-8 lg:px-16 pb-20 md:pb-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl sm:text-3xl font-black text-[#34150F] mb-4 sm:mb-6 flex items-center gap-2.5" style={{ fontFamily: "'Gilda Display', serif" }}>
          <ShieldCheck size={24} className="text-[#D39858]" /> Checkout & GST Invoice
        </h1>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-tr-xl rounded-bl-xl text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">

          {/* Shipping & GST Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Address */}
            <div className="bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-4 sm:p-6 border border-[rgba(52,21,15,0.08)] shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-[#D39858]" /> Shipping & Delivery Address
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                    Address Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Plot No. 42, Industrial Area, Phase 1"
                    className="w-full bg-[#EACEAA]/50 text-[#34150F] placeholder-[#85431E]/40 px-3.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs sm:text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#EACEAA]/50 text-[#34150F] px-2.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[#EACEAA]/50 text-[#34150F] px-2.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-[#EACEAA]/50 text-[#34150F] px-2.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* B2B GST Details */}
            {isB2B && (
              <div className="bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-4 sm:p-6 border border-[rgba(52,21,15,0.08)] shadow-xs">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-3 flex items-center gap-2">
                  <Building2 size={15} className="text-[#D39858]" /> B2B GST Tax Invoice Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required={isB2B}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#EACEAA]/50 text-[#34150F] px-3.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs sm:text-sm border border-[rgba(52,21,15,0.15)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                      GSTIN (15 Chars) *
                    </label>
                    <input
                      type="text"
                      required={isB2B}
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className="w-full bg-[#EACEAA]/50 text-[#34150F] px-3.5 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs sm:text-sm border border-[rgba(52,21,15,0.15)] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-4 sm:p-6 border border-[rgba(52,21,15,0.08)] shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-3 flex items-center gap-2">
                <CreditCard size={15} className="text-[#D39858]" /> Payment Gateway
              </h3>
              <div className="space-y-2">
                {[
                  { id: "razorpay", title: "Razorpay (UPI / NetBanking / Cards / EMI)", badge: "Instant Confirmation" },
                  { id: "cod", title: "Cash on Delivery (COD)", badge: "Available" },
                  { id: "bank", title: "Direct NEFT / RTGS Bank Transfer", badge: "B2B Orders" },
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center justify-between p-3 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl border cursor-pointer transition-all ${
                      paymentMethod === pm.id
                        ? "bg-[#34150F] text-[#EACEAA] border-[#34150F]"
                        : "bg-[#EACEAA]/40 text-[#34150F] border-[rgba(52,21,15,0.12)] hover:border-[#D39858]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id as any)}
                        className="accent-[#D39858]"
                      />
                      <span className="text-xs font-bold">{pm.title}</span>
                    </div>
                    {pm.badge && (
                      <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        paymentMethod === pm.id ? "bg-[#D39858] text-[#34150F]" : "bg-[#34150F] text-[#EACEAA]"
                      }`}>
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
            <div className="bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-4 sm:p-6 border border-[rgba(52,21,15,0.08)] shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-3 pb-2 border-b border-[rgba(52,21,15,0.08)]">
                Order Review ({cart.length} items)
              </h3>

              <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const effective = getEffectivePrice(item, user, item.qty, b2bCache);
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-[rgba(52,21,15,0.06)]">
                      <div className="truncate pr-2">
                        <p className="font-bold text-[#34150F] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#85431E]">Qty: {item.qty}</p>
                      </div>
                      <span className="font-black text-[#34150F]">₹{effective.totalPrice.toLocaleString("en-IN")}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-xs mb-4">
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
                <div className="border-t border-[rgba(52,21,15,0.08)] pt-2 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-[#34150F] block">Grand Total</span>
                    <span className="text-[10px] text-[#85431E]/70 font-medium">Includes 18% GST</span>
                  </div>
                  <span className="text-base font-black text-[#34150F]" style={{ fontFamily: "'DM Mono', monospace" }}>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="hidden md:flex w-full bg-[#34150F] text-[#EACEAA] font-black py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-xs shadow-md active:scale-95 disabled:opacity-50 items-center justify-center gap-2"
              >
                {isSubmitting ? "Processing Order..." : `Place Order — ₹${grandTotal.toLocaleString("en-IN")}`}
              </button>
            </div>
          </div>

          {/* ── Mobile Sticky Order Placement Bar ── */}
          <div className="fixed bottom-14 md:hidden left-0 right-0 z-40 bg-[#34150F]/95 backdrop-blur-md border-t border-[#EACEAA]/20 p-2.5 px-4 shadow-2xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-[#EACEAA]/60 block font-semibold">Total Payable</span>
              <span className="text-base font-black text-[#D39858]" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 max-w-[200px] bg-[#D39858] text-[#34150F] font-black py-2.5 px-4 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all text-xs shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
