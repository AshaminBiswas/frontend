import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, ChevronRight, Mail, Clock, Scale, Building2 } from "lucide-react";
import { fetchApi } from "../services/api";

const DEFAULT_TERMS_CONTENT = `
## 1. Terms & Acceptance
By accessing or placing orders through PRC Hardware ("the Platform"), you agree to be bound by these Terms of Service. These terms apply to all buyers, trade contractors, architects, B2B wholesale account holders, and site visitors.

## 2. Commercial Pricing & Tax Invoices
- All retail and B2B wholesale prices listed on the website are in Indian Rupees (INR) and include GST unless explicitly indicated as ex-GST.
- Tax Invoices containing your business GSTIN and registered trade name are issued automatically upon order confirmation.
- PRC Hardware reserves the right to modify prices, discount structures, and promotional codes at any time without prior notice.

## 3. Orders, Wholesale Quotations & Payments
- Orders placed online or via approved B2B quotation contracts become binding upon successful payment authorization or verified credit terms.
- Accepted payment methods include UPI (Google Pay, PhonePe, Paytm), Net banking, Credit/Debit Cards, and approved NEFT/RTGS bank transfers for wholesale orders.

## 4. Architectural Product Specifications
- Product dimensions, finishes, metal grades (e.g. Grade 304 Stainless Steel, Solid Brass), and load capacities are specified accurately based on laboratory test certificates.
- Minor color finish variations may occur due to individual screen calibrations and metallic PVD electroplating batch runs.

## 5. Intellectual Property & Brand Trademarks
All logo trademarks, catalog designs, product photography, technical schematics, and website code belong exclusively to PRC Hardware India. Reproduction without written authorization is strictly prohibited.

## 6. Governing Law & Jurisdiction
These Terms of Service are governed by and construed in accordance with the laws of India. Any legal disputes shall be subject to the exclusive jurisdiction of the courts in **New Delhi, India**.
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
          <Scale size={18} className="text-[#D39858]" />
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

export function TermsOfServicePage() {
  const [data, setData] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetchApi<{ title: string; content: string }>("/cms/pages/slug/terms-of-service")
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          fetchApi<{ title: string; content: string }>("/cms/pages/slug/terms")
            .then((r) => {
              if (r.success && r.data) setData(r.data);
              else setData({ title: "Terms of Service", content: DEFAULT_TERMS_CONTENT });
            })
            .catch(() => setData({ title: "Terms of Service", content: DEFAULT_TERMS_CONTENT }));
        }
      })
      .catch(() => setData({ title: "Terms of Service", content: DEFAULT_TERMS_CONTENT }))
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
            <span className="text-[#EACEAA] font-bold">Terms of Service</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#D39858]/20 border border-[#D39858]/40 px-3.5 py-1 rounded-full mb-3">
            <Scale size={14} className="text-[#D39858]" />
            <span className="text-[10px] font-black text-[#D39858] uppercase tracking-[0.2em]">
              Legal Governance & Terms
            </span>
          </div>

          <h1
            className="text-3xl md:text-5xl font-black text-[#EACEAA] mb-3"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {data?.title || "Terms of Service"}
          </h1>

          <p className="text-xs md:text-sm text-[#EACEAA]/80 max-w-2xl leading-relaxed">
            Legal terms governing retail purchases, B2B wholesale accounts, tax invoices, and intellectual property.
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
                  { label: "Return & Refund Policy", to: "/policy/returns", active: false },
                  { label: "Shipping & Delivery Policy", to: "/policy/shipping", active: false },
                  { label: "Terms of Service", to: "/policy/terms", active: true },
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
                    Legally Binding Agreement
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(data?.content || DEFAULT_TERMS_CONTENT)}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
