import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, ShieldCheck, CheckCircle2, ChevronRight, Mail, Clock, AlertTriangle, Truck, DollarSign } from "lucide-react";
import { fetchApi } from "../services/api";

const DEFAULT_REFUND_CONTENT = `
## 1. 7-Day Return & Replacement Guarantee
At PRC Hardware, we stand behind the precision quality of our architectural fittings. If you receive a product that is defective, damaged in transit, or incorrect, you are eligible for a full replacement or refund within **7 days of delivery**.

## 2. Return Eligibility Criteria
To qualify for a return or replacement:
- The product must be unused, uninstalled, and in its original manufacturer packaging with all accessories and screws included.
- You must provide the original Tax Invoice or Order Number.
- Photo/video proof of damage or defect must be submitted to our support team within 48 hours of package receipt.

## 3. Non-Returnable Items
The following categories are non-returnable unless defective:
- Custom-manufactured hardware, specialized color finishes, or custom-cut tracks.
- Bulk trade orders placed under custom B2B wholesale quotation agreements.
- Clearance or final sale hardware items marked as non-refundable.

## 4. Return Process & Free Pickup
1. **Initiate Request**: Log into your PRC Account and click "Request Return" on the order details page, or email returns@prchardware.in.
2. **Reverse Pickup**: Once approved, our logistics partner (Bluedart/Delhivery) will arrange a doorstep reverse pickup within 48-72 hours.
3. **Quality Audit**: Returned items are inspected at our New Delhi fulfillment center within 24 hours of arrival.

## 5. Refund Processing Timelines
- **UPI & Netbanking Orders**: Refund credited directly to your bank account within **3 to 5 business days**.
- **Credit / Debit Card Orders**: Refund reflected on your card statement within **5 to 7 business days**.
- **Store Credit**: Option to receive instant store credit with bonus 5% discount on future hardware purchases.

## 6. Contact Return Support
For assistance with returns, replacements, or shipping damage claims:
- **Email**: returns@prchardware.in
- **Helpline**: +91 98765 43210 (Mon-Sat, 9:30 AM - 6:30 PM IST)
`.trim();

function renderMarkdown(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2
          key={i}
          className="text-xl font-bold text-[#34150F] mt-8 mb-4 border-b border-[rgba(52,21,15,0.1)] pb-2 flex items-center gap-2"
          style={{ fontFamily: "'Gilda Display', serif" }}
        >
          <RotateCcw size={18} className="text-[#D39858]" />
          {line.replace("## ", "")}
        </h2>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="text-[#85431E] text-xs md:text-sm leading-relaxed ml-5 list-disc mb-1">
          {line.replace("- ", "")}
        </li>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-[#85431E] text-xs md:text-sm leading-relaxed mb-3">
        {line}
      </p>
    );
  });
}

export function RefundPolicyPage() {
  const [data, setData] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetchApi<{ title: string; content: string }>("/cms/pages/slug/refund-policy")
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          fetchApi<{ title: string; content: string }>("/cms/pages/slug/returns")
            .then((r) => {
              if (r.success && r.data) setData(r.data);
              else setData({ title: "Return & Refund Policy", content: DEFAULT_REFUND_CONTENT });
            })
            .catch(() => setData({ title: "Return & Refund Policy", content: DEFAULT_REFUND_CONTENT }));
        }
      })
      .catch(() => setData({ title: "Return & Refund Policy", content: DEFAULT_REFUND_CONTENT }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <section className="bg-gradient-to-r from-[#34150F] via-[#5c2415] to-[#85431E] py-14 px-4 md:px-8 lg:px-16 text-[#EACEAA]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#EACEAA]/70 mb-4">
            <Link to="/" className="hover:text-[#D39858]">Home</Link>
            <ChevronRight size={12} />
            <span className="text-[#EACEAA] font-bold">Return & Refund Policy</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#D39858]/20 border border-[#D39858]/40 px-3.5 py-1 rounded-full mb-3">
            <RotateCcw size={14} className="text-[#D39858]" />
            <span className="text-[10px] font-black text-[#D39858] uppercase tracking-[0.2em]">
              Hassle-Free 7-Day Returns
            </span>
          </div>

          <h1
            className="text-3xl md:text-5xl font-black text-[#EACEAA] mb-3"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {data?.title || "Return & Refund Policy"}
          </h1>

          <p className="text-xs md:text-sm text-[#EACEAA]/80 max-w-2xl leading-relaxed">
            Easy doorstep return pickups and quick refunds. Complete information on return eligibility, timelines, and replacement workflows.
          </p>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Policy Menu */}
          <div className="lg:col-span-4">
            <div className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-5 border border-[rgba(52,21,15,0.08)] shadow-sm sticky top-24">
              <h3 className="text-xs font-bold text-[#34150F] uppercase tracking-wider mb-4 pb-2 border-b border-[rgba(52,21,15,0.1)]">
                Legal & Governance Links
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: "Privacy Policy", to: "/policy/privacy", active: false },
                  { label: "Return & Refund Policy", to: "/policy/returns", active: true },
                  { label: "Shipping & Delivery Policy", to: "/policy/shipping", active: false },
                  { label: "Terms of Service", to: "/policy/terms", active: false },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold transition-all ${
                      item.active
                        ? "bg-[#34150F] text-[#EACEAA] shadow-md"
                        : "text-[#85431E] hover:bg-[#EACEAA]/50 hover:text-[#34150F]"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Document Body */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 animate-pulse space-y-4">
                <div className="h-8 bg-[#34150F]/10 rounded w-1/2" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 bg-[#34150F]/10 rounded" />
                ))}
              </div>
            ) : (
              <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 md:p-10 border border-[rgba(52,21,15,0.08)] shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[rgba(52,21,15,0.1)] text-xs text-[#85431E]">
                  <span className="font-bold flex items-center gap-1">
                    <Clock size={13} /> Last Updated: January 2026
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    7 Days Replacement Guaranteed
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(data?.content || DEFAULT_REFUND_CONTENT)}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
