import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Trash2, Minus, Plus, ArrowRight,
  ShieldCheck, Package, ChevronRight, Tag, Truck, RotateCcw,
} from "lucide-react";
import { CartItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { getEffectivePrice, isB2BUser } from "../utils/pricing";
import { useB2BPricing } from "../hooks/useB2BPricing";

/* ─── Inline product image with graceful fallback ─── */
function ProductThumb({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-tr-xl rounded-bl-xl bg-gradient-to-br from-[#EACEAA] to-[#D39858]/30 flex items-center justify-center border border-[#34150F]/10">
        <Package size={22} className="text-[#85431E]/40" />
      </div>
    );
  }
  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-tr-xl rounded-bl-xl overflow-hidden border border-[#34150F]/10 bg-[#EACEAA]/30">
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

interface CartPageProps {
  cart: CartItem[];
  onRemoveFromCart: (id: number) => void;
  onChangeQty: (id: number, delta: number) => void;
}

export function CartPage({ cart, onRemoveFromCart, onChangeQty }: CartPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  const isB2B = isB2BUser(user);
  const b2bCache = useB2BPricing();

  const subtotal = cart.reduce((sum, item) => {
    const effective = getEffectivePrice(item, user, item.qty, b2bCache);
    return sum + effective.totalPrice;
  }, 0);

  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discount) / 100) : 0;
  const productSubtotal = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round(productSubtotal * 0.18);
  const freeShipping = productSubtotal >= 2000;
  const amountNeededForFreeShipping = Math.max(0, 2000 - productSubtotal);
  const grandTotal = productSubtotal + gstAmount;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (code === "WELCOME10") {
      setAppliedCoupon({ code: "WELCOME10", discount: 10 });
    } else if (code === "B2BBULK" && isB2B) {
      setAppliedCoupon({ code: "B2BBULK", discount: 15 });
    } else {
      setCouponError("Invalid coupon. Try WELCOME10.");
    }
  };

  /* ─── Empty State ─── */
  if (cart.length === 0) {
    return (
      <div
        className="min-h-screen bg-[#EACEAA] flex items-center justify-center px-4 py-16"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-[#34150F] rounded-tr-3xl rounded-bl-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <ShoppingCart size={40} className="text-[#D39858]" />
          </div>
          <h1
            className="text-3xl font-bold text-[#34150F] mb-3"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Your Cart is Empty
          </h1>
          <p className="text-[#85431E] text-sm mb-8 leading-relaxed">
            Browse our architectural hardware catalog — handles, hinges, locks, and accessories await.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-8 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all text-sm shadow-md active:scale-95"
          >
            Explore Catalog <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#EACEAA] px-4 py-8 md:px-8 lg:px-16"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Page Title ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#34150F] rounded-tr-xl rounded-bl-xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={18} className="text-[#D39858]" />
          </div>
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-[#34150F] leading-tight"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Shopping Cart
            </h1>
            <p className="text-xs text-[#85431E] mt-0.5">{totalItems} item{totalItems !== 1 ? "s" : ""} in your cart</p>
          </div>
          <Link
            to="/products"
            className="ml-auto hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* ── Main Layout: items | summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── Cart Items ── */}
          <div className="space-y-3">
            {cart.map((item) => {
              const effective = getEffectivePrice(item, user, item.qty, b2bCache);
              const hasSaving = item.originalPrice && item.originalPrice > effective.unitPrice;

              return (
                <div
                  key={item.id}
                  className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3 sm:gap-4 p-4 sm:p-5">
                    {/* Thumbnail */}
                    <ProductThumb src={item.image} name={item.name} />

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                      {/* Top: name + delete */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${item.slug || (item as any).apiId || item.id}`}
                            className="hover:text-[#D39858] transition-colors"
                          >
                            <h3 className="text-sm sm:text-base font-bold text-[#34150F] leading-snug line-clamp-2">
                              {item.name}
                            </h3>
                          </Link>
                          {item.category && (
                            <p className="text-[10px] font-bold text-[#85431E]/60 uppercase tracking-wider mt-1">
                              {item.category}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-tr-lg rounded-bl-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Bottom: qty controls + price */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Qty stepper */}
                        <div className="flex items-center gap-1.5 bg-[#EACEAA]/70 border border-[rgba(52,21,15,0.12)] rounded-tr-lg rounded-bl-lg px-2 py-1">
                          <button
                            type="button"
                            onClick={() => onChangeQty(item.id, -1)}
                            disabled={item.qty <= 1}
                            className="w-6 h-6 rounded-full bg-[#34150F]/10 hover:bg-[#34150F]/20 flex items-center justify-center text-[#34150F] transition-colors disabled:opacity-30"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-sm font-black text-[#34150F] w-7 text-center select-none">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onChangeQty(item.id, 1)}
                            className="w-6 h-6 rounded-full bg-[#34150F]/10 hover:bg-[#34150F]/20 flex items-center justify-center text-[#34150F] transition-colors"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-base font-black text-[#34150F]">
                            ₹{effective.totalPrice.toLocaleString("en-IN")}
                          </p>
                          <p className="text-[10px] text-[#85431E]/70">
                            ₹{effective.unitPrice.toLocaleString("en-IN")} / unit
                          </p>
                          {hasSaving && (
                            <p className="text-[10px] font-bold text-emerald-600">
                              Save ₹{((item.originalPrice! - effective.unitPrice) * item.qty).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Continue Shopping link — mobile */}
            <Link
              to="/products"
              className="flex sm:hidden items-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors pt-1"
            >
              ← Continue Shopping
            </Link>

            {/* Trust badges strip */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: ShieldCheck, label: "Secure Payment" },
                { icon: Truck, label: "Pan-India Delivery" },
                { icon: RotateCcw, label: "7-Day Returns" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl p-3 border border-[rgba(52,21,15,0.07)] text-center"
                >
                  <Icon size={18} className="text-[#D39858]" />
                  <span className="text-[10px] font-bold text-[#85431E] leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl border border-[rgba(52,21,15,0.08)] shadow-sm overflow-hidden">

              {/* Header */}
              <div className="bg-[#34150F] px-6 py-4">
                <h2
                  className="text-base font-bold text-[#EACEAA]"
                  style={{ fontFamily: "'Gilda Display', serif" }}
                >
                  Order Summary
                </h2>
                <p className="text-[#EACEAA]/60 text-xs mt-0.5">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
              </div>

              <div className="p-5 space-y-5">
                {/* Coupon */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-2 flex items-center gap-1">
                    <Tag size={11} /> Discount Coupon
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-tr-xl rounded-bl-xl px-3 py-2.5">
                      <div>
                        <p className="text-xs font-bold text-emerald-700">✓ {appliedCoupon.code}</p>
                        <p className="text-[10px] text-emerald-600">{appliedCoupon.discount}% discount applied</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="e.g. WELCOME10"
                        className="flex-1 min-w-0 bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors"
                      />
                      <button
                        type="submit"
                        className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-4 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-colors flex-shrink-0"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-[10px] text-red-600 mt-1.5 font-medium">{couponError}</p>}
                </div>

                {/* Free shipping progress bar */}
                {!freeShipping && (
                  <div>
                    <div className="flex justify-between text-[10px] text-[#85431E] mb-1.5">
                      <span className="font-semibold">
                        Add ₹{amountNeededForFreeShipping.toLocaleString("en-IN")} more for free shipping
                      </span>
                      <span className="font-bold">₹2,000</span>
                    </div>
                    <div className="h-1.5 bg-[#EACEAA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D39858] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (productSubtotal / 2000) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {freeShipping && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-tr-xl rounded-bl-xl px-3 py-2">
                    <Truck size={14} className="text-emerald-600 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-700">You've unlocked FREE shipping! 🎉</p>
                  </div>
                )}

                {/* Price breakdown */}
                <div className="space-y-2.5 text-xs border-t border-[rgba(52,21,15,0.08)] pt-4">
                  <div className="flex justify-between">
                    <span className="text-[#85431E] font-semibold">Subtotal ({totalItems} items)</span>
                    <span className="text-[#34150F] font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="font-semibold">Discount ({appliedCoupon.code})</span>
                      <span className="font-bold">-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#85431E] font-semibold">GST (18%)</span>
                    <span className="text-[#34150F] font-bold">+₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#85431E] font-semibold">Shipping Fee</span>
                    <span className={freeShipping ? "text-emerald-600 font-bold" : "text-[#34150F] font-bold"}>
                      {freeShipping ? "FREE" : "Calculated at checkout"}
                    </span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="bg-[#34150F] rounded-tr-xl rounded-bl-xl px-4 py-3 flex justify-between items-center">
                  <div>
                    <span className="text-[#EACEAA]/80 text-xs font-semibold block">Total Amount</span>
                    <span className="text-[10px] text-[#D39858]/80 font-medium">Includes 18% GST</span>
                  </div>
                  <span
                    className="text-[#D39858] text-xl font-black"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => navigate("/checkout")}
                  className="w-full bg-[#D39858] text-[#34150F] font-black py-4 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all text-sm shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ChevronRight size={16} />
                </button>

                <p className="text-center text-[10px] text-[#85431E]/60 flex items-center justify-center gap-1">
                  <ShieldCheck size={11} className="text-[#D39858]" />
                  Secured by Razorpay · GST Invoice included
                </p>
              </div>
            </div>

            {/* B2B note */}
            {isB2B && (
              <div className="bg-[#f5e8d4] border border-[#D39858]/40 rounded-tr-2xl rounded-bl-2xl p-4 text-xs text-[#85431E]">
                <p className="font-bold text-[#34150F] mb-1">B2B Account Active</p>
                <p>Volume pricing and GST input credit are automatically applied to your order.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Mobile Sticky Checkout Bar ── */}
      <div className="fixed bottom-14 md:hidden left-0 right-0 z-40 bg-[#34150F]/95 backdrop-blur-md border-t border-[#EACEAA]/20 p-2.5 px-4 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-[#EACEAA]/60 block font-semibold">Grand Total</span>
          <span className="text-base font-black text-[#D39858]" style={{ fontFamily: "'DM Mono', monospace" }}>
            ₹{grandTotal.toLocaleString("en-IN")}
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate("/checkout")}
          className="flex-1 max-w-[200px] bg-[#D39858] text-[#34150F] font-black py-2.5 px-4 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all text-xs shadow-md active:scale-95 flex items-center justify-center gap-1"
        >
          Checkout <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
