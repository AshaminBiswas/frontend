import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Minus, Plus, Trash2, ShoppingBag, ArrowRight,
  Package, Truck, Heart
} from "lucide-react";
import { CartItem } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";

/* ── Safe Thumbnail Component — Never breaks container dimensions ── */
function DrawerThumb({ src, name }: { src?: string; name: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-tr-lg rounded-bl-lg bg-gradient-to-br from-[#EACEAA] to-[#D39858]/30 flex items-center justify-center border border-[#34150F]/10 flex-shrink-0">
        <Package size={20} className="text-[#85431E]/40" />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-tr-lg rounded-bl-lg overflow-hidden border border-[#34150F]/10 bg-[#EACEAA]/20 flex-shrink-0">
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

interface CartDrawerProps {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: number) => void;
  onQty: (id: number, delta: number) => void;
}

export function CartDrawer({ cart, onClose, onRemove, onQty }: CartDrawerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const b2bCache = useB2BPricing();
  const total = cart.reduce((s, i) => {
    const effective = getEffectivePrice(i, user, i.qty, b2bCache);
    return s + effective.totalPrice;
  }, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const freeShipping = total >= 2000;

  // Lock body scroll + Esc key listener
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  const handleViewCart = () => {
    onClose();
    navigate("/cart");
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end animate-in fade-in duration-200"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#34150F]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative bg-[#EACEAA] w-full sm:max-w-md h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#34150F] border-b border-[#EACEAA]/10">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-[#D39858]" />
            <h3
              className="text-[#EACEAA] font-bold text-lg leading-none"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Your Cart ({totalItems})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart drawer"
            className="w-8 h-8 rounded-tr-lg rounded-bl-lg bg-[#EACEAA]/10 hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Free Shipping Bar ── */}
        {cart.length > 0 && (
          <div className="bg-[#FAF4ED] px-4 sm:px-6 py-2.5 border-b border-[#34150F]/8">
            {!freeShipping ? (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-[#85431E] flex items-center justify-between">
                  <span>Add ₹{(2000 - total).toLocaleString("en-IN")} more for FREE shipping</span>
                  <span className="font-bold text-[#34150F]">₹2,000</span>
                </p>
                <div className="h-1.5 bg-[#EACEAA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D39858] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (total / 2000) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Truck size={14} className="text-emerald-600" />
                You've unlocked FREE shipping pan-India! 🎉
              </p>
            )}
          </div>
        )}

        {/* ── Cart Items List ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 bg-[#34150F] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <ShoppingBag size={32} className="text-[#D39858]" />
              </div>
              <h4
                className="text-[#34150F] font-bold text-lg mb-1"
                style={{ fontFamily: "'Gilda Display', serif" }}
              >
                Your cart is empty
              </h4>
              <p className="text-[#85431E] text-xs max-w-xs mx-auto mb-6">
                Explore our premium hardware catalog to add handles, hinges, locks, and accessories.
              </p>
              <button
                type="button"
                onClick={handleViewCart}
                className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all text-xs shadow-md"
              >
                Browse Products <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const effective = getEffectivePrice(item, user, item.qty, b2bCache);
              return (
                <div
                  key={item.id}
                  className="flex gap-3 bg-[#FAF4ED] p-3.5 rounded-tr-xl rounded-bl-xl border border-[#34150F]/10 shadow-xs hover:border-[#D39858]/40 transition-colors"
                >
                  <DrawerThumb src={item.image} name={item.name} />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Title + Delete */}
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-[#34150F] text-xs font-bold leading-snug line-clamp-2 pr-1">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Pricing + Stepper */}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      {/* Qty modifier */}
                      <div className="flex items-center gap-1.5 bg-[#EACEAA]/60 rounded-tr-lg rounded-bl-lg px-1.5 py-0.5 border border-[#34150F]/10">
                        <button
                          type="button"
                          onClick={() => onQty(item.id, -1)}
                          disabled={item.qty <= 1}
                          className="w-5 h-5 rounded-full bg-[#34150F]/10 hover:bg-[#34150F]/20 flex items-center justify-center text-[#34150F] text-xs transition-colors disabled:opacity-30"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-black text-[#34150F] w-5 text-center select-none">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onQty(item.id, 1)}
                          className="w-5 h-5 rounded-full bg-[#34150F]/10 hover:bg-[#34150F]/20 flex items-center justify-center text-[#34150F] text-xs transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Total price for line */}
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-black text-[#34150F]" style={{ fontFamily: "'DM Mono', monospace" }}>
                          ₹{effective.totalPrice.toLocaleString("en-IN")}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] text-[#85431E]/70 font-semibold">
                            ₹{effective.unitPrice.toLocaleString("en-IN")}/u
                          </span>
                          {effective.isB2B && (
                            <span className="text-[8px] bg-[#D39858] text-[#34150F] px-1 py-0.2 rounded font-black uppercase leading-none">
                              B2B
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer / Checkout ── */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#34150F]/15 bg-[#FAF4ED] space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#85431E] font-semibold">Subtotal</span>
                <span
                  className="text-[#34150F] font-black text-sm"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-[10px] text-[#85431E]/70">
                Taxes calculated at checkout. GST invoice included.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleViewCart}
                className="flex-1 bg-white text-[#34150F] border border-[#34150F]/20 font-bold py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-colors text-xs text-center"
              >
                View Full Cart
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                className="flex-[1.5] bg-[#34150F] text-[#EACEAA] font-bold py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                Checkout <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
