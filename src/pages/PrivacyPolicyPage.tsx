import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, ChevronRight, Mail, Phone, Clock, ArrowLeft } from "lucide-react";
import { fetchApi } from "../services/api";

const DEFAULT_PRIVACY_CONTENT = `
## 1. Executive Summary & Scope
PRC Hardware ("we", "our", or "us") respects your privacy and is committed to protecting the personal data of our customers, architects, interior designers, and website visitors. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or place orders for architectural hardware.

## 2. Information We Collect
We collect information that identifies, relates to, or describes you ("Personal Data"):
- **Account Data**: Full Name, Email Address, Phone Number, Business Name, GSTIN, and Delivery Addresses.
- **Transaction Data**: Payment transaction references, order history, invoice records, and shipping manifests.
- **Technical Data**: IP address, browser type, operating system, device identifiers, and site interaction cookies.
- **B2B Verification Data**: Trade licenses, architect registration details, and bulk order inquiry specifications.

## 3. How We Use Your Information
We use your data for legitimate business purposes including:
- Processing, fulfilling, and dispatching hardware orders across India.
- Issuing GST Tax Invoices and managing trade account pricing.
- Sending real-time order tracking updates via SMS, WhatsApp, and email.
- Protecting against fraudulent transactions and verifying trade credentials.
- Improving website navigation, catalog search experience, and customer service.

## 4. Data Sharing & Third-Party Processors
We do not sell, rent, or trade your personal data. We only share necessary data with trusted service providers under strict data protection agreements:
- **Logistics Partners**: Bluedart, Delhivery, SafeExpress for shipment delivery.
- **Payment Gateways**: Razorpay, Cashfree, PhonePe for PCI-DSS compliant payment processing.
- **Communication Systems**: Twilio / MSG91 for transactional SMS and tracking alerts.

## 5. Security & Encryption
We deploy enterprise-grade security protocols including 256-bit TLS/SSL encryption for data in transit and AES-256 encryption for sensitive data at rest. Access to personal information is strictly restricted to authorized staff handling order fulfillment.

## 6. Your Rights & Data Choices
You have the right to:
- Access, review, or update your personal account details via your User Profile.
- Request deletion of non-essential personal data.
- Opt-out of promotional communications at any time.

## 7. Contact Privacy Team
If you have questions regarding this Privacy Policy or wish to exercise your data rights, contact us at:
- **Email**: privacy@prchardware.in
- **Phone**: +91 98765 43210
- **Address**: PRC Hardware India, Architectural Hardware Complex, New Delhi, India.
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
          <ShieldCheck size={18} className="text-[#D39858]" />
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

export function PrivacyPolicyPage() {
  const [data, setData] = useState<{ title: string; content: string; updatedAt?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Try fetching dynamically by slug from Backend CMS API
    fetchApi<{ title: string; content: string; updatedAt?: string }>("/cms/pages/slug/privacy-policy")
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          // Try alternative slug "privacy"
          fetchApi<{ title: string; content: string; updatedAt?: string }>("/cms/pages/slug/privacy")
            .then((r) => {
              if (r.success && r.data) setData(r.data);
              else setData({ title: "Privacy Policy", content: DEFAULT_PRIVACY_CONTENT });
            })
            .catch(() => setData({ title: "Privacy Policy", content: DEFAULT_PRIVACY_CONTENT }));
        }
      })
      .catch(() => setData({ title: "Privacy Policy", content: DEFAULT_PRIVACY_CONTENT }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <section className="bg-gradient-to-r from-[#34150F] via-[#5c2415] to-[#85431E] py-5 sm:py-8 md:py-14 px-3 sm:px-6 md:px-8 lg:px-16 text-[#EACEAA]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#EACEAA]/70 mb-2 sm:mb-4">
            <Link to="/" className="hover:text-[#D39858]">Home</Link>
            <ChevronRight size={11} />
            <span className="text-[#EACEAA] font-bold">Privacy Policy</span>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#D39858]/20 border border-[#D39858]/40 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full mb-2 sm:mb-3">
            <Lock size={13} className="text-[#D39858]" />
            <span className="text-[9px] sm:text-[10px] font-black text-[#D39858] uppercase tracking-wider">
              Data Protection &amp; Compliance
            </span>
          </div>

          <h1
            className="text-xl sm:text-3xl md:text-5xl font-black text-[#EACEAA] mb-2 sm:mb-3"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            {data?.title || "Privacy Policy"}
          </h1>

          <p className="text-xs md:text-sm text-[#EACEAA]/80 max-w-2xl leading-relaxed">
            Your privacy and security are paramount. Learn how PRC Hardware handles and protects customer and enterprise data.
          </p>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-12 pb-20 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">

          {/* Left Policy Menu / Mobile Pills Bar */}
          <div className="lg:col-span-4">
            <div className="bg-[#f5e8d4] rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-3 sm:p-5 border border-[rgba(52,21,15,0.08)] shadow-2xs lg:sticky lg:top-24">
              <h3 className="text-[10px] sm:text-xs font-bold text-[#34150F] uppercase tracking-wider mb-2 sm:mb-4 pb-1.5 sm:pb-2 border-b border-[rgba(52,21,15,0.1)]">
                Legal &amp; Governance
              </h3>
              <div className="flex overflow-x-auto no-scrollbar touch-pan-x gap-1.5 lg:flex-col lg:space-y-1.5 pb-1">
                {[
                  { label: "Privacy Policy", to: "/policy/privacy", active: true },
                  { label: "Return & Refund Policy", to: "/policy/returns", active: false },
                  { label: "Shipping & Delivery Policy", to: "/policy/shipping", active: false },
                  { label: "Terms of Service", to: "/policy/terms", active: false },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      item.active
                        ? "bg-[#34150F] text-[#EACEAA] shadow-xs"
                        : "text-[#85431E] bg-[#EACEAA]/40 lg:bg-transparent hover:bg-[#EACEAA]/50 hover:text-[#34150F]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.active && <ChevronRight size={13} className="ml-2 hidden lg:block" />}
                  </Link>
                ))}
              </div>

              {/* Support Contact Box */}
              <div className="mt-4 sm:mt-6 p-3.5 sm:p-4 bg-[#EACEAA]/40 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl border border-[rgba(52,21,15,0.1)]">
                <p className="text-[11px] font-bold text-[#34150F] mb-1">Need Legal Clarifications?</p>
                <p className="text-[10px] text-[#85431E] mb-2 sm:mb-3">Our privacy team is available Monday to Saturday.</p>
                <a
                  href="mailto:privacy@prchardware.in"
                  className="text-[11px] font-extrabold text-[#34150F] hover:text-[#D39858] flex items-center gap-1.5"
                >
                  <Mail size={12} /> privacy@prchardware.in
                </a>
              </div>
            </div>
          </div>

          {/* Right Document Body */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 animate-pulse space-y-4">
                <div className="h-8 bg-[#34150F]/10 rounded w-1/2" />
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
                    Active & Compliant
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(data?.content || DEFAULT_PRIVACY_CONTENT)}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
