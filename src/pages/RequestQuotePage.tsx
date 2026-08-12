import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { FileText, CheckCircle2, Building2, ArrowLeft } from "lucide-react";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../data/products";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../services/api";

const ALL_PRODUCTS = [...SUPER_SAVER_PRODUCTS, ...VALUE_MONEY_PRODUCTS, ...BEST_SELLER_PRODUCTS];

export function RequestQuotePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const productId = searchParams.get("productId") || "";
  const initialQty = searchParams.get("qty") || "50";

  const selectedProduct = ALL_PRODUCTS.find((p) => p.id === Number(productId)) || ALL_PRODUCTS[0];

  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [gstin, setGstin] = useState(user?.gstin || "");
  const [quantity, setQuantity] = useState(initialQty);
  const [targetPrice, setTargetPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [quoteRef, setQuoteRef] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = `QTE-${Date.now().toString().slice(-6)}`;
    setQuoteRef(ref);

    try {
      await fetchApi("/quotes", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: selectedProduct.id, quantity: Number(quantity), requestedPrice: Number(targetPrice) || undefined }],
          companyName,
          gstin,
          notes,
        }),
      });
    } catch {}

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-8 px-4 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#85431E] hover:text-[#34150F] font-bold text-xs mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="bg-white rounded-tr-3xl rounded-bl-3xl p-6 md:p-8 border border-[#34150F]/8 shadow-sm">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-black text-[#34150F] mb-2">B2B Quote Request Submitted!</h2>
              <p className="text-xs text-[#85431E] max-w-md mx-auto mb-6">
                Your quotation request <strong className="font-mono text-[#34150F]">{quoteRef}</strong> has been assigned to our wholesale pricing manager. You will receive negotiated rates in your profile dashboard.
              </p>
              <Link
                to="/profile/quotes"
                className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow"
              >
                View My Quotes in Profile
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="border-b border-[#34150F]/8 pb-4">
                <h1 className="text-2xl font-black text-[#34150F] mb-1" style={{ fontFamily: "'Gilda Display', serif" }}>
                  B2B Wholesale Price Negotiation Quote
                </h1>
                <p className="text-xs text-[#85431E]">
                  Request customized high-volume pricing directly for <strong className="text-[#34150F]">{selectedProduct.name}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                    Company / Firm Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Hardware Pvt Ltd"
                    className="w-full bg-[#EACEAA]/30 text-[#34150F] px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                    GSTIN (15 characters) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full bg-[#EACEAA]/30 text-[#34150F] px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                    Requested Volume Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[#EACEAA]/30 text-[#34150F] px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                    Target Price per Unit (Optional)
                  </label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full bg-[#EACEAA]/30 text-[#34150F] px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                  Project Notes & Delivery Timeline
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify project site location, delivery date requirements, or custom finish preferences..."
                  className="w-full bg-[#EACEAA]/30 text-[#34150F] px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#34150F] text-[#EACEAA] font-black py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-sm shadow-md"
              >
                Submit Custom B2B Quote Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
