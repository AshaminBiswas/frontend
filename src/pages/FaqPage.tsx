import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle, Search, ChevronDown, ChevronUp, MessageSquare, Mail, Phone,
  Sparkles, CheckCircle2, Package, ShieldCheck, Truck, RotateCcw, Building2, X
} from "lucide-react";
import { fetchApi } from "../services/api";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  faqs: FaqItem[];
}

const DEFAULT_FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "general",
    name: "General & Orders",
    description: "Order placing, tracking, account management, and payment methods.",
    faqs: [
      {
        id: "gen-1",
        question: "How do I place an order on PRC Hardware?",
        answer: "Browse our catalog, select your desired finish and quantity, and click 'Add to Cart'. Proceed to checkout to enter your delivery address and pay securely via UPI, Credit/Debit Cards, or Net Banking."
      },
      {
        id: "gen-2",
        question: "Do you issue GST Tax Invoices for business buyers?",
        answer: "Yes! During checkout, enter your registered GSTIN and Company Name. An official Tax Invoice with 18% GST input credit will be generated automatically upon dispatch."
      },
      {
        id: "gen-3",
        question: "Can I modify or cancel my order after placing it?",
        answer: "Orders can be modified or cancelled within 2 hours of placement before dispatch. Contact our support line at +91 98765 43210 for immediate assistance."
      }
    ]
  },
  {
    id: "shipping",
    name: "Shipping & Delivery",
    description: "Delivery timelines, logistics partners, and free shipping thresholds.",
    faqs: [
      {
        id: "ship-1",
        question: "What are your delivery timelines across India?",
        answer: "Metro cities (Delhi NCR, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata) receive delivery in 24 to 48 hours. Tier-2 and Tier-3 cities take 2 to 4 business days."
      },
      {
        id: "ship-2",
        question: "Is free shipping available on orders?",
        answer: "Yes! All orders above ₹2,000 enjoy FREE pan-India express shipping. Orders below ₹2,000 carry a nominal flat delivery fee of ₹99."
      },
      {
        id: "ship-3",
        question: "How can I track my shipment?",
        answer: "Once dispatched, you will receive an SMS and email with a live tracking link. You can also monitor real-time shipment status on our Track Order page."
      }
    ]
  },
  {
    id: "returns",
    name: "Returns & Refunds",
    description: "7-day return policy, defective item replacements, and refund schedules.",
    faqs: [
      {
        id: "ret-1",
        question: "What is PRC Hardware's Return Policy?",
        answer: "We offer a 7-day hassle-free replacement/return policy for damaged, defective, or incorrect items. Simply raise a request under your Account or contact support."
      },
      {
        id: "ret-2",
        question: "How long does a refund take to process?",
        answer: "Once the returned item passes quality inspection at our fulfillment center, refunds are processed to your original payment account within 3 to 5 business days."
      }
    ]
  },
  {
    id: "b2b",
    name: "B2B & Bulk Orders",
    description: "Contractor pricing, custom quotes, and large commercial supply.",
    faqs: [
      {
        id: "b2b-1",
        question: "How do I request B2B wholesale contractor rates?",
        answer: "Submit a bulk inquiry via our 'Request Quote' page or verify your B2B account with a valid GSTIN to unlock tiered volume discounts on hardware items."
      },
      {
        id: "b2b-2",
        question: "Can you manufacture custom finishes or sizes?",
        answer: "Yes, for commercial projects exceeding 500 units, we offer custom PVD finishes (Matt Black, Antique Brass, Satin Nickel) and custom handle dimensions."
      }
    ]
  },
  {
    id: "quality",
    name: "Materials & Quality Guarantee",
    description: "Stainless steel grades, brass purity, and anti-corrosion warranties.",
    faqs: [
      {
        id: "qual-1",
        question: "What metal grades do you use for door handles and hinges?",
        answer: "We use 304 and 316 marine-grade solid stainless steel, virgin solid forged brass, and high-tensile zinc alloys tested for over 200,000 opening cycles."
      },
      {
        id: "qual-2",
        question: "What warranty do PRC Hardware products come with?",
        answer: "All architectural hardware carries a 2-Year Limited Manufacturer Guarantee against manufacturing defects, tarnishing, and mechanical failure."
      }
    ]
  }
];

export function FaqPage() {
  const [categories, setCategories] = useState<FaqCategory[]>(DEFAULT_FAQ_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(["gen-1", "ship-1"]));

  // Fetch dynamic FAQs from Backend CMS API
  useEffect(() => {
    setLoading(true);
    fetchApi<FaqCategory[]>("/cms/faqs")
      .then((res) => {
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
        } else {
          setCategories(DEFAULT_FAQ_CATEGORIES);
        }
      })
      .catch(() => setCategories(DEFAULT_FAQ_CATEGORIES))
      .finally(() => setLoading(false));
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter Categories & FAQs based on Search & Category Pills
  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        if (activeCategory !== "ALL" && cat.id !== activeCategory && cat.name !== activeCategory) {
          return null;
        }

        const filteredFaqs = cat.faqs.filter((faq) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
        });

        if (filteredFaqs.length === 0) return null;
        return { ...cat, faqs: filteredFaqs };
      })
      .filter(Boolean) as FaqCategory[];
  }, [categories, activeCategory, searchQuery]);

  const totalFaqsCount = useMemo(() => {
    return categories.reduce((acc, cat) => acc + cat.faqs.length, 0);
  }, [categories]);

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ HERO HEADER & SEARCH ═══════════════ */}
      {/* ═══════════════ HERO SEARCH HEADER ═══════════════ */}
      <section className="bg-gradient-to-r from-[#34150F] via-[#5c2415] to-[#85431E] py-6 sm:py-16 px-3 sm:px-6 md:px-8 lg:px-16 text-[#EACEAA] relative overflow-hidden shadow-md">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#D39858]/20 border border-[#D39858]/40 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-2.5 sm:mb-4 shadow-xs">
            <HelpCircle size={13} className="text-[#D39858]" />
            <span className="text-[10px] sm:text-xs font-black text-[#D39858] uppercase tracking-wider">
              Help &amp; Knowledge Base
            </span>
          </div>

          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-black text-[#EACEAA] mb-2 sm:mb-4 tracking-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Frequently Asked Questions
          </h1>

          <p className="text-xs sm:text-sm text-[#EACEAA]/80 max-w-xl mx-auto mb-4 sm:mb-8 leading-relaxed font-medium">
            Have questions about architectural fittings, GST invoices, or pan-India shipping? We&apos;ve got clear answers for you.
          </p>

          {/* Search Input */}
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search answers (e.g. GST invoice, shipping, return)..."
              className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/60 pl-9 sm:pl-11 pr-9 sm:pr-10 py-2.5 sm:py-3.5 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl text-xs sm:text-sm font-bold border-2 border-[#D39858] focus:outline-none shadow-md"
            />
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85431E]" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85431E] hover:text-[#34150F]"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT AREA ═══════════════ */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-12 pb-20 sm:pb-12">

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x pb-2 mb-4 sm:mb-8">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
              activeCategory === "ALL"
                ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-xs"
                : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
            }`}
          >
            All ({totalFaqsCount})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
                activeCategory === cat.id
                  ? "bg-[#34150F] text-[#EACEAA] border-transparent shadow-xs"
                  : "bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]"
              }`}
            >
              {cat.name} ({cat.faqs.length})
            </button>
          ))}
        </div>

        {/* Accordion List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-5 animate-pulse space-y-2">
                <div className="h-5 bg-[#34150F]/10 rounded w-3/4" />
                <div className="h-4 bg-[#34150F]/10 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-12 text-center border border-[rgba(52,21,15,0.08)] shadow-sm">
            <HelpCircle size={44} className="text-[#85431E]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#34150F] mb-1">No matching questions found</h3>
            <p className="text-xs text-[#85431E] mb-4">Try clearing your search term or select another category.</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setActiveCategory("ALL"); }}
              className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 md:p-8 border border-[rgba(52,21,15,0.08)] shadow-sm">
                <div className="mb-6 pb-3 border-b border-[rgba(52,21,15,0.1)]">
                  <h2
                    className="text-xl font-black text-[#34150F]"
                    style={{ fontFamily: "'Gilda Display', serif" }}
                  >
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-xs text-[#85431E] mt-0.5">{cat.description}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {cat.faqs.map((faq) => {
                    const isOpen = openItems.has(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-tr-2xl rounded-bl-2xl border transition-all duration-200 overflow-hidden ${
                          isOpen
                            ? "bg-white border-[#D39858] shadow-md"
                            : "bg-[#EACEAA]/30 border-[rgba(52,21,15,0.08)] hover:border-[#D39858]/50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(faq.id)}
                          className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#34150F] focus:outline-none"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle size={16} className="text-[#D39858] flex-shrink-0" />
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp size={16} className="text-[#34150F] flex-shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-[#85431E]/60 flex-shrink-0" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#85431E] leading-relaxed border-t border-[rgba(52,21,15,0.06)] animate-in fade-in duration-200">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ STILL HAVE QUESTIONS CALLOUT ═══════════════ */}
        <div className="mt-12 bg-gradient-to-r from-[#34150F] to-[#5c2415] rounded-tr-3xl rounded-bl-3xl p-8 text-center text-[#EACEAA] border border-[#D39858]/30 shadow-lg">
          <MessageSquare size={36} className="text-[#D39858] mx-auto mb-3" />
          <h3
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Still Have Questions?
          </h3>
          <p className="text-xs sm:text-sm text-[#EACEAA]/80 max-w-md mx-auto mb-6">
            Our architectural hardware team is ready to help you with technical specifications, volume quotes, or custom finishes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="bg-[#D39858] text-[#34150F] font-black text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Mail size={15} /> Contact Support
            </Link>
            <Link
              to="/request-quote"
              className="bg-[#EACEAA]/15 text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/25 transition-all border border-[#EACEAA]/30 flex items-center gap-2"
            >
              <Building2 size={15} /> Request Wholesale Quote
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
