import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2, ArrowLeft, Search, Plus, Minus, Trash2, CheckCircle2,
  Clock, AlertCircle, FileText, Send, ShieldCheck, HelpCircle,
  ChevronDown, Layers, Sparkles, RefreshCw, Eye, Check, Download
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isB2BUser, getEffectivePrice } from "../utils/pricing";
import {
  quotationService,
  CreateB2BQuotePayload,
  QuotationDetail,
  TrackedQuotationSummary
} from "../services/quotationService";
import { Product } from "../types";
import { useB2BPricing } from "../hooks/useB2BPricing";
import { AsyncActionButton } from "../components/common/AsyncActionButton";

interface SelectedLineItem {
  productId: string;
  name: string;
  sku: string;
  thumbnail?: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

const CATEGORY_OPTIONS = [
  { label: "All Hardware Categories", slug: "" },
  { label: "Cubicle Hardware", slug: "cubicle-hardware" },
  { label: "Locker Hardware", slug: "locker-hardware" },
  { label: "Urinal Hardware", slug: "urinal-hardware" },
];

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function cleanIndianPhone(val: string): string {
  if (!val) return "";
  let digits = val.replace(/\D/g, "");
  if (digits.length >= 11 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function RequestQuotePage() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const isB2B = isB2BUser(user);
  const b2bCache = useB2BPricing();

  // Active View Tab: 'rfq-form' | 'tracking'
  const [activeTab, setActiveTab] = useState<"rfq-form" | "tracking">("rfq-form");

  // Today's read-only date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  // Form State
  const [projectName, setProjectName] = useState("");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [gstNo, setGstNo] = useState(user?.gstin || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(cleanIndianPhone(user?.phone || ""));
  const [notes, setNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [lineItems, setLineItems] = useState<SelectedLineItem[]>([]);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Product Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<QuotationDetail | null>(null);
  const [submitError, setSubmitError] = useState("");

  // Tracking System
  const [trackingQuery, setTrackingQuery] = useState("");
  const [trackedQuotes, setTrackedQuotes] = useState<TrackedQuotationSummary[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingSearched, setTrackingSearched] = useState(false);
  const [downloadingPdfToken, setDownloadingPdfToken] = useState<string | null>(null);
  const [trackingError, setTrackingError] = useState("");

  // Auto-suggestions for pending & under review quotations
  const [userPendingQuotes, setUserPendingQuotes] = useState<TrackedQuotationSummary[]>([]);
  const [isTrackingDropdownOpen, setIsTrackingDropdownOpen] = useState(false);
  const trackingDropdownRef = useRef<HTMLDivElement>(null);
  const trackingInputRef = useRef<HTMLInputElement>(null);

  // Sync user profile data & fetch pending quotes for instant search suggestions
  useEffect(() => {
    if (user) {
      if (user.firstName && !firstName) setFirstName(user.firstName);
      if (user.lastName && !lastName) setLastName(user.lastName);
      if (user.companyName && !companyName) setCompanyName(user.companyName);
      if (user.gstin && !gstNo) setGstNo(user.gstin);
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(cleanIndianPhone(user.phone));

      const identifier = user.email || user.gstin || user.phone || "";
      if (identifier) {
        quotationService.trackQuotes(identifier).then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setUserPendingQuotes(res.data);
          }
        }).catch(() => {});
      }
    }
  }, [user]);

  // Click-outside listener for tracking suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        trackingDropdownRef.current &&
        !trackingDropdownRef.current.contains(e.target as Node) &&
        trackingInputRef.current &&
        !trackingInputRef.current.contains(e.target as Node)
      ) {
        setIsTrackingDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered suggestions for tracking search
  const trackingSuggestions = useMemo(() => {
    const pendingQuotes = userPendingQuotes.filter(
      (q) => q.status === "PENDING" || q.status === "UNDER_REVIEW"
    );
    if (!trackingQuery.trim()) {
      return pendingQuotes.length > 0 ? pendingQuotes : userPendingQuotes;
    }
    const qLower = trackingQuery.toLowerCase().trim();
    return userPendingQuotes.filter((q) =>
      q.referenceNo?.toLowerCase().includes(qLower) ||
      q.projectName?.toLowerCase().includes(qLower) ||
      q.companyName?.toLowerCase().includes(qLower) ||
      q.status?.toLowerCase().includes(qLower)
    );
  }, [trackingQuery, userPendingQuotes]);

  const handleSelectTrackingSuggestion = (quote: TrackedQuotationSummary) => {
    setTrackingQuery(quote.referenceNo);
    setIsTrackingDropdownOpen(false);
    setTrackedQuotes([quote]);
    setTrackingSearched(true);
    setTrackingError("");
  };

  // Live product search
  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setIsSearching(true);
      const results = await quotationService.searchLiveProducts(searchQuery, selectedCategory);
      if (active) {
        setSearchResults(results);
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  // Financial summary calculations
  const basicPrice = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + item.amount, 0);
  }, [lineItems]);

  const gstAmount = useMemo(() => {
    return Math.round(basicPrice * 0.18 * 100) / 100;
  }, [basicPrice]);

  const grandTotal = useMemo(() => {
    return Math.round((basicPrice + gstAmount) * 100) / 100;
  }, [basicPrice, gstAmount]);

  // Validate single field
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case "projectName":
        if (!value || value.trim().length < 2) return "Project name is required (min 2 chars)";
        if (value.trim().length > 150) return "Project name is too long";
        return "";
      case "firstName":
        if (!value || value.trim().length < 2) return "First name is required";
        return "";
      case "lastName":
        if (!value || value.trim().length < 1) return "Last name is required";
        return "";
      case "companyName":
        if (!value || value.trim().length < 2) return "Company name is required";
        return "";
      case "gstNo":
        if (!value || !GSTIN_REGEX.test(value.trim().toUpperCase())) {
          return "Enter a valid 15-character GSTIN (e.g. 27AAAAA0000A1Z5)";
        }
        return "";
      case "email":
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "Enter a valid business email address";
        }
        return "";
      case "phone": {
        const cleaned = cleanIndianPhone(value);
        if (!cleaned || !PHONE_REGEX.test(cleaned)) {
          return "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
        }
        return "";
      }
      case "notes":
        if (value && value.length > 500) return "Notes cannot exceed 500 characters";
        return "";
      case "termsAccepted":
        if (!value) return "You must accept the terms and conditions";
        return "";
      case "lineItems":
        if (!value || value.length === 0) return "Please add at least one hardware product to the quote";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string, value: any) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  // Add Product to Quotation Table
  const handleAddProduct = (product: Product) => {
    const existingIndex = lineItems.findIndex((i) => i.productId === product.id);
    const eff = getEffectivePrice(product, user, 1, b2bCache);
    const unitPrice = Number(eff.unitPrice || 0);

    if (existingIndex >= 0) {
      const updated = [...lineItems];
      const newQty = updated[existingIndex].quantity + 1;
      const rate = Number(updated[existingIndex].rate || 0);
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        amount: Math.round(newQty * rate * 100) / 100,
      };
      setLineItems(updated);
    } else {
      const newItem: SelectedLineItem = {
        productId: product.id,
        name: product.name,
        sku: product.sku || "PRC-SKU",
        thumbnail: product.thumbnail || product.images?.[0],
        unit: "PCS",
        quantity: 1,
        rate: unitPrice,
        amount: Math.round(1 * unitPrice * 100) / 100,
      };
      setLineItems((prev) => [...prev, newItem]);
    }

    setErrors((prev) => ({ ...prev, lineItems: "" }));
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  // Update item quantity (Increase/Decrease)
  const handleQuantityChange = (productId: string, newQty: number) => {
    const parsed = Number(newQty);
    const validQty = isNaN(parsed) || parsed < 1 ? 1 : Math.floor(parsed);
    setLineItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: validQty,
              amount: Math.round(validQty * Number(item.rate || 0) * 100) / 100,
            }
          : item
      )
    );
  };

  // Remove line item
  const handleRemoveItem = (productId: string) => {
    setLineItems((prev) => {
      const remaining = prev.filter((i) => i.productId !== productId);
      if (remaining.length === 0) {
        setErrors((e) => ({ ...e, lineItems: "Please add at least one hardware product" }));
      }
      return remaining;
    });
  };

  // Submit Quotation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const newErrors: Record<string, string> = {
      projectName: validateField("projectName", projectName),
      firstName: validateField("firstName", firstName),
      lastName: validateField("lastName", lastName),
      companyName: validateField("companyName", companyName),
      gstNo: validateField("gstNo", gstNo),
      email: validateField("email", email),
      phone: validateField("phone", phone),
      notes: validateField("notes", notes),
      termsAccepted: validateField("termsAccepted", termsAccepted),
      lineItems: validateField("lineItems", lineItems),
    };

    setErrors(newErrors);
    setTouched({
      projectName: true,
      firstName: true,
      lastName: true,
      companyName: true,
      gstNo: true,
      email: true,
      phone: true,
      termsAccepted: true,
      lineItems: true,
    });

    const hasError = Object.values(newErrors).some((err) => Boolean(err));
    if (hasError) {
      setSubmitError("Please correct the highlighted fields before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateB2BQuotePayload = {
        projectName: projectName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
        gstNo: gstNo.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        phone: cleanIndianPhone(phone),
        notes: notes.trim() || null,
        termsAccepted: true,
        items: lineItems.map((item) => ({
          productId: item.productId,
          productNameSnapshot: item.name,
          unit: item.unit,
          quantity: item.quantity,
          rate: item.rate,
        })),
      };

      const res = await quotationService.submitQuote(payload);
      if (res.success && res.data) {
        setSubmitSuccess(res.data);
      } else {
        setSubmitError(res.error?.message || "Failed to submit quotation. Please try again.");
      }
    } catch (err: any) {
      setSubmitError(err?.message || "A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform Tracking Search
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;

    setIsTracking(true);
    setTrackingError("");
    setTrackingSearched(true);
    try {
      const res = await quotationService.trackQuotes(trackingQuery.trim());
      if (res.success && res.data) {
        setTrackedQuotes(res.data);
      } else {
        setTrackedQuotes([]);
        setTrackingError(res.error?.message || "No matching quotations found.");
      }
    } catch (err: any) {
      setTrackedQuotes([]);
      setTrackingError(err?.message || "Failed to track quotations. Check your connection.");
    } finally {
      setIsTracking(false);
    }
  };

  const handleDownloadTrackingPdf = async (token: string, refNo: string) => {
    setDownloadingPdfToken(token);
    try {
      await quotationService.downloadQuotePdfByToken(token, refNo);
    } catch (err: any) {
      alert(err?.message || "Failed to download quotation PDF.");
    } finally {
      setDownloadingPdfToken(null);
    }
  };

  // ─── GATE: If not B2B authenticated, show clean corporate gate & tracking tab ───
  if (!isB2B) {
    return (
      <div className="min-h-screen bg-[#EACEAA]/20 py-4 sm:py-12 px-2.5 sm:px-6 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[#85431E] hover:text-[#34150F] font-bold text-xs transition-colors"
          >
            <ArrowLeft size={13} /> Back
          </button>

          {/* Navigation Sub-Tabs */}
          <div className="flex bg-white/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-[#34150F]/10 max-w-md mx-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("rfq-form")}
              className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all ${
                activeTab === "rfq-form"
                  ? "bg-[#34150F] text-[#EACEAA] shadow-2xs"
                  : "text-[#85431E] hover:text-[#34150F]"
              }`}
            >
              Submit New RFQ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all ${
                activeTab === "tracking"
                  ? "bg-[#34150F] text-[#EACEAA] shadow-2xs"
                  : "text-[#85431E] hover:text-[#34150F]"
              }`}
            >
              Track Quotation Status
            </button>
          </div>

          {activeTab === "rfq-form" ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 border border-[#34150F]/10 shadow-md text-center space-y-4 sm:space-y-6">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#34150F]/10 text-[#34150F] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Building2 size={28} className="sm:w-10 sm:h-10" />
              </div>

              <div>
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[#D39858] bg-[#D39858]/10 px-2.5 py-0.5 rounded-full border border-[#D39858]/20">
                  B2B Corporate Wholesale Portal
                </span>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#34150F] mt-2 sm:mt-3" style={{ fontFamily: "'Gilda Display', serif" }}>
                  B2B Quotation (RFQ) Access Restricted
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-[#85431E] max-w-lg mx-auto mt-1.5 leading-relaxed">
                  Direct contractor quotations, volume project estimation, and digitally-signed formal bids are reserved exclusively for registered business clients with valid GSTIN credentials.
                </p>
              </div>

              {user ? (
                <div className="bg-amber-50 border border-amber-200 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl text-left max-w-lg mx-auto space-y-2 sm:space-y-3">
                  <p className="text-[11.5px] sm:text-xs text-amber-900 leading-relaxed font-semibold">
                    You are logged in as a retail account (<strong>{user.email}</strong>). Please upgrade your account with company & GSTIN information to activate instant RFQ submission.
                  </p>
                  <Link
                    to="/profile?tab=edit"
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-2xs"
                  >
                    Add Company Details to Profile
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4 max-w-md mx-auto pt-1 sm:pt-2">
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-2xs"
                  >
                    Sign In to B2B Account
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal("register")}
                    className="w-full bg-[#D39858] text-[#34150F] font-bold text-xs py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:bg-[#34150F] hover:text-[#EACEAA] transition-all shadow-2xs"
                  >
                    Register Business Account
                  </button>
                </div>
              )}

              <div className="pt-3 border-t border-[#34150F]/5 flex items-center justify-center gap-3 sm:gap-6 text-[10px] sm:text-[11px] text-[#85431E] flex-wrap">
                <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-600" /> GST Compliant</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-blue-600" /> Digital Signatures</span>
                <span className="flex items-center gap-1"><Sparkles size={13} className="text-amber-600" /> Fast Turnaround</span>
              </div>
            </div>
          ) : (
            /* Universal Tracking Section */
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-[#34150F]/10 shadow-md space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                  Track Quotation Status
                </h2>
                <p className="text-[11px] sm:text-xs text-[#85431E] mt-0.5">
                  Search by your <strong>Quotation Reference No</strong> (e.g. PRC-QT-2026-27/001), <strong>Email</strong>, <strong>GSTIN</strong>, or <strong>Phone Number</strong>.
                </p>
              </div>

              <div className="relative">
                <form onSubmit={handleTrackSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                    <input
                      ref={trackingInputRef}
                      type="text"
                      value={trackingQuery}
                      onChange={(e) => {
                        setTrackingQuery(e.target.value);
                        setIsTrackingDropdownOpen(true);
                      }}
                      onFocus={() => setIsTrackingDropdownOpen(true)}
                      placeholder="Enter Reference No, Email, GSTIN, or Phone..."
                      className="w-full pl-9 pr-3 py-2 sm:py-3 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-lg sm:rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/50 focus:outline-none focus:border-[#34150F]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isTracking || !trackingQuery.trim()}
                    className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {isTracking ? <RefreshCw size={13} className="animate-spin" /> : "Track"}
                  </button>
                </form>

                {/* Auto-suggestions dropdown on click */}
                {isTrackingDropdownOpen && trackingSuggestions.length > 0 && (
                  <div
                    ref={trackingDropdownRef}
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#34150F]/15 shadow-xl max-h-60 overflow-y-auto z-50 p-2 space-y-1"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#85431E] uppercase tracking-wider border-b border-[#34150F]/5 flex items-center justify-between">
                      <span>{!trackingQuery.trim() ? "Active Quotations (Pending / Under Review)" : `Matching (${trackingSuggestions.length})`}</span>
                      <span className="text-[9px] text-[#85431E]/60 font-normal">Click to track</span>
                    </div>
                    {trackingSuggestions.map((quote) => (
                      <button
                        key={quote.id}
                        type="button"
                        onClick={() => handleSelectTrackingSuggestion(quote)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#EACEAA]/20 text-left transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#34150F] group-hover:text-[#85431E]">{quote.referenceNo}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              quote.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : quote.status === "UNDER_REVIEW"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {quote.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-[#85431E] truncate">{quote.projectName}</p>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#34150F] shrink-0">
                          ₹{Number(quote.grandTotal || 0).toLocaleString("en-IN")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {trackingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{trackingError}</span>
                </div>
              )}

              {trackingSearched && trackedQuotes.length === 0 && !trackingError && (
                <div className="p-6 text-center bg-[#EACEAA]/10 rounded-xl border border-[#34150F]/5">
                  <FileText size={28} className="mx-auto text-[#85431E]/40 mb-1.5" />
                  <p className="text-xs font-bold text-[#34150F]">No Quotations Found</p>
                </div>
              )}

              {trackedQuotes.length > 0 && (
                <div className="space-y-3">
                  {trackedQuotes.map((q) => (
                    <div key={q.id} className="p-3.5 sm:p-5 bg-[#EACEAA]/10 border border-[#34150F]/10 rounded-xl sm:rounded-2xl space-y-2.5 sm:space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#34150F]/10 pb-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-[#34150F]">{q.referenceNo}</span>
                          <p className="text-[11px] font-bold text-[#85431E]">{q.projectName}</p>
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          q.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : q.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}>
                          {q.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] sm:text-xs">
                        <div>
                          <span className="text-[9.5px] text-[#85431E]/70 uppercase">Company</span>
                          <p className="font-bold text-[#34150F] truncate">{q.companyName}</p>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-[#85431E]/70 uppercase">Items</span>
                          <p className="font-bold text-[#34150F]">{q.itemCount} Product(s)</p>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-[#85431E]/70 uppercase">Est. Total</span>
                          <p className="font-extrabold text-[#85431E]">₹{q.grandTotal.toLocaleString("en-IN")}</p>
                        </div>
                      </div>

                      {q.status === "APPROVED" && q.accessToken && (
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 bg-emerald-50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-emerald-200">
                          <span className="text-[11px] sm:text-xs font-bold text-emerald-900 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Approved & Digitally Signed
                          </span>
                          <div className="flex items-center gap-1.5">
                            <AsyncActionButton
                              mode="download"
                              onAction={() => quotationService.downloadQuotePdfByToken(q.accessToken!, q.referenceNo)}
                              idleIcon={<Download size={12} />}
                              idleLabel="Download PDF"
                              loadingLabel="…"
                              successLabel="✓"
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10.5px] px-2.5 py-1.5 rounded-md transition-colors border border-emerald-300"
                              variant="custom"
                            />
                            <Link
                              to={`/quote/${q.accessToken}`}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10.5px] px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                            >
                              <Eye size={12} /> View Quote
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── SUCCESS SCREEN: If RFQ submitted successfully ───
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#EACEAA]/20 py-6 sm:py-12 px-2.5 sm:px-6 md:px-8 flex items-center justify-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-xl w-full bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-[#34150F]/10 shadow-xl text-center space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={28} className="sm:w-9 sm:h-9" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D39858] bg-[#D39858]/10 px-3 py-1 rounded-full border border-[#D39858]/20">
              Quotation Successfully Submitted
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[#34150F] mt-2" style={{ fontFamily: "'Gilda Display', serif" }}>
              Quotation Request Received!
            </h1>
            <p className="text-xs text-[#85431E] mt-1.5 leading-relaxed">
              Your official commercial B2B quotation request has been registered in the PRC Hardware central system.
            </p>
          </div>

          <div className="p-5 bg-[#EACEAA]/20 rounded-2xl border border-[#34150F]/10 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-2">
              <span className="text-[#85431E] font-semibold">Quotation Number</span>
              <span className="font-mono font-black text-sm text-[#34150F] bg-white px-2.5 py-0.5 rounded border border-[#34150F]/15">
                {submitSuccess.referenceNo || submitSuccess.quoteNumber}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-2">
              <span className="text-[#85431E] font-semibold">Project Name</span>
              <span className="font-bold text-[#34150F]">{submitSuccess.projectName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-2">
              <span className="text-[#85431E] font-semibold">Client / Company</span>
              <span className="font-bold text-[#34150F]">{submitSuccess.companyName} ({submitSuccess.gstNo})</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#85431E] font-bold">Estimated Grand Total</span>
              <span className="font-extrabold text-sm text-[#85431E]">₹{submitSuccess.grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 text-left flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              A mandatory confirmation email containing Quotation Reference <strong>{submitSuccess.referenceNo}</strong> has been sent to <strong>{submitSuccess.email}</strong>.
            </p>
          </div>

          {/* EXACTLY TWO ACTIONS: Track Quotation and View Quotation */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                const ref = submitSuccess.referenceNo || submitSuccess.quoteNumber;
                setSubmitSuccess(null);
                setActiveTab("tracking");
                setTrackingQuery(ref);
                setTimeout(() => {
                  quotationService.trackQuotes(ref).then((res) => {
                    if (res.success && res.data) {
                      setTrackedQuotes(res.data);
                      setTrackingSearched(true);
                    }
                  });
                }, 100);
              }}
              className="flex-1 bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Clock size={16} />
              <span>Track Quotation</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (submitSuccess.accessToken) {
                  navigate(`/quote/${submitSuccess.accessToken}`);
                } else {
                  const ref = submitSuccess.referenceNo || submitSuccess.quoteNumber;
                  setSubmitSuccess(null);
                  setActiveTab("tracking");
                  setTrackingQuery(ref);
                  quotationService.trackQuotes(ref).then((res) => {
                    if (res.success && res.data) {
                      setTrackedQuotes(res.data);
                      setTrackingSearched(true);
                    }
                  });
                }
              }}
              className="flex-1 bg-[#D39858] hover:bg-[#34150F] text-[#34150F] hover:text-[#EACEAA] font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              <span>View Quotation</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN B2B RFQ FORM VIEW ───
  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-8 px-4 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#85431E] hover:text-[#34150F] font-bold text-xs transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-3">
            {/* Tab switch to tracking */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "rfq-form" ? "tracking" : "rfq-form")}
              className="bg-white/80 border border-[#34150F]/15 text-[#34150F] font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-white transition-all shadow-sm flex items-center gap-1.5"
            >
              <Clock size={13} />
              <span>{activeTab === "rfq-form" ? "Track Existing RFQ" : "Back to RFQ Form"}</span>
            </button>

            {/* Read-only today's date badge */}
            <div className="bg-white/90 border border-[#34150F]/15 px-3 py-1.5 rounded-xl text-right shadow-sm">
              <span className="text-[10px] text-[#85431E] uppercase font-bold block">Date</span>
              <span className="text-xs font-extrabold text-[#34150F]">{todayFormatted}</span>
            </div>
          </div>
        </div>

        {activeTab === "tracking" ? (
          /* Universal Tracking Section */
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#34150F]/10 shadow-lg space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                Track Quotation Status
              </h2>
              <p className="text-xs text-[#85431E] mt-1">
                Lookup by <strong>Quotation Reference No</strong>, <strong>Email</strong>, <strong>GSTIN</strong>, or <strong>Phone</strong>.
              </p>
            </div>

            <div className="relative">
              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                  <input
                    ref={trackingInputRef}
                    type="text"
                    value={trackingQuery}
                    onChange={(e) => {
                      setTrackingQuery(e.target.value);
                      setIsTrackingDropdownOpen(true);
                    }}
                    onFocus={() => setIsTrackingDropdownOpen(true)}
                    placeholder="Enter Reference No, Email, GSTIN, or Phone..."
                    className="w-full pl-10 pr-4 py-3 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/50 focus:outline-none focus:border-[#34150F]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTracking || !trackingQuery.trim()}
                  className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {isTracking ? <RefreshCw size={14} className="animate-spin" /> : "Track"}
                </button>
              </form>

              {/* Auto-suggestions dropdown on click */}
              {isTrackingDropdownOpen && trackingSuggestions.length > 0 && (
                <div
                  ref={trackingDropdownRef}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#34150F]/15 shadow-xl max-h-64 overflow-y-auto z-50 p-2 space-y-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#85431E] uppercase tracking-wider border-b border-[#34150F]/5 flex items-center justify-between">
                    <span>{!trackingQuery.trim() ? "Active Quotations (Pending / Under Review)" : `Matching (${trackingSuggestions.length})`}</span>
                    <span className="text-[9px] text-[#85431E]/60 font-normal">Click to track</span>
                  </div>
                  {trackingSuggestions.map((quote) => (
                    <button
                      key={quote.id}
                      type="button"
                      onClick={() => handleSelectTrackingSuggestion(quote)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EACEAA]/20 text-left transition-colors group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#34150F] group-hover:text-[#85431E]">{quote.referenceNo}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                            quote.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : quote.status === "UNDER_REVIEW"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {quote.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-[#85431E] truncate">{quote.projectName}</p>
                      </div>
                      <span className="font-mono font-bold text-xs text-[#34150F] shrink-0">
                        ₹{Number(quote.grandTotal || 0).toLocaleString("en-IN")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {trackingError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{trackingError}</span>
              </div>
            )}

            {trackingSearched && trackedQuotes.length === 0 && !trackingError && (
              <div className="p-8 text-center bg-[#EACEAA]/10 rounded-2xl border border-[#34150F]/5">
                <FileText size={32} className="mx-auto text-[#85431E]/40 mb-2" />
                <p className="text-xs font-bold text-[#34150F]">No Quotations Found</p>
              </div>
            )}

            {trackedQuotes.length > 0 && (
              <div className="space-y-4">
                {trackedQuotes.map((q) => (
                  <div key={q.id} className="p-5 bg-[#EACEAA]/10 border border-[#34150F]/10 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#34150F]/10 pb-3">
                      <div>
                        <span className="font-mono font-bold text-xs text-[#34150F]">{q.referenceNo}</span>
                        <p className="text-xs font-bold text-[#85431E]">{q.projectName}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        q.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : q.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}>
                        {q.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[#85431E]/70 uppercase">Company</span>
                        <p className="font-bold text-[#34150F] truncate">{q.companyName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#85431E]/70 uppercase">Items</span>
                        <p className="font-bold text-[#34150F]">{q.itemCount} Product(s)</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#85431E]/70 uppercase">Est. Total</span>
                        <p className="font-extrabold text-[#85431E]">₹{q.grandTotal.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {q.status === "APPROVED" && q.accessToken && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" /> Approved & Signed
                        </span>
                        <div className="flex items-center gap-2">
                          <AsyncActionButton
                            mode="download"
                            onAction={() => quotationService.downloadQuotePdfByToken(q.accessToken!, q.referenceNo)}
                            idleIcon={<Download size={13} />}
                            idleLabel="Download PDF"
                            loadingLabel="Preparing PDF…"
                            successLabel="Downloaded!"
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs px-3 py-2 rounded-lg transition-colors border border-emerald-300"
                            variant="custom"
                          />
                          <Link
                            to={`/quote/${q.accessToken}`}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow"
                          >
                            <Eye size={14} /> View Quote
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Main RFQ Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 border border-[#34150F]/10 shadow-md space-y-5 sm:space-y-8">
            {/* Header Banner */}
            <div className="border-b border-[#34150F]/10 pb-4 sm:pb-6">
              <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs font-bold text-[#D39858] uppercase tracking-wider">
                <Building2 size={13} />
                <span>PRC Hardware • B2B Quotation Form</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#34150F] mt-1" style={{ fontFamily: "'Gilda Display', serif" }}>
                Request for Quotation (RFQ)
              </h1>
              <p className="text-[11px] sm:text-xs text-[#85431E] mt-0.5">
                Configure your commercial hardware bill of quantities for architectural cubicles, lockers, and restroom hardware.
              </p>
            </div>

            {/* Reference Number Preview */}
            <div className="bg-[#EACEAA]/20 border border-[#34150F]/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-wrap items-center justify-between gap-1.5">
              <div>
                <span className="text-[9px] text-[#85431E] font-bold uppercase tracking-wider block">Reference No</span>
                <span className="font-mono font-bold text-[11px] sm:text-xs text-[#34150F]">
                  PRC-QT-2026-27/--- <span className="text-[10px] sm:text-[11px] text-[#85431E] font-normal">(Auto-generated upon submission)</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] sm:text-[10px] text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full uppercase">
                  Verified B2B Account
                </span>
              </div>
            </div>

            {/* Section 1: Project & Client Details */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-bold text-[#34150F] flex items-center gap-1.5 border-b border-[#34150F]/10 pb-1.5">
                <Layers size={14} className="text-[#D39858]" />
                <span>1. Project & Business Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Project Name */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-[#34150F]">
                    Project Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onBlur={() => handleBlur("projectName", projectName)}
                    placeholder="e.g. Prestige Tech Park Tower 4 Restroom Fitout"
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.projectName && errors.projectName ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.projectName && errors.projectName && (
                    <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold">{errors.projectName}</p>
                  )}
                </div>

                {/* First Name */}
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-[#34150F]">
                    First Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => handleBlur("firstName", firstName)}
                    placeholder="e.g. Rajesh"
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.firstName && errors.firstName ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-[#34150F]">
                    Last Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => handleBlur("lastName", lastName)}
                    placeholder="e.g. Sharma"
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.lastName && errors.lastName ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold">{errors.lastName}</p>
                  )}
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-[#34150F]">
                    Company Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onBlur={() => handleBlur("companyName", companyName)}
                    placeholder="e.g. Apex Infrastructure Solutions Pvt Ltd"
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.companyName && errors.companyName ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.companyName && errors.companyName && (
                    <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold">{errors.companyName}</p>
                  )}
                </div>

                {/* GST No */}
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-[#34150F]">
                    GST No (GSTIN) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("gstNo", gstNo)}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs font-mono text-[#34150F] placeholder-[#85431E]/40 uppercase focus:outline-none ${
                      touched.gstNo && errors.gstNo ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.gstNo && errors.gstNo && (
                    <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold">{errors.gstNo}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-[#34150F]">
                    Business Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur("email", email)}
                    placeholder="e.g. procurement@apexinfra.com"
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.email && errors.email ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] sm:text-xs font-bold text-[#34150F]">
                    Phone Number (10 Digits) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(cleanIndianPhone(e.target.value))}
                    onBlur={() => handleBlur("phone", phone)}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.phone && errors.phone ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Live Product Selection & Filter */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-bold text-[#34150F] flex items-center gap-1.5 border-b border-[#34150F]/10 pb-1.5">
                <Search size={14} className="text-[#D39858]" />
                <span>2. Select Hardware Products</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] font-bold focus:outline-none focus:border-[#34150F] appearance-none cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85431E] pointer-events-none" />
                </div>

                {/* Search Bar */}
                <div className="sm:col-span-2 relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search active catalog by name, SKU..."
                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F]"
                  />

                  {/* Dropdown Results */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl sm:rounded-2xl border border-[#34150F]/15 shadow-xl max-h-56 overflow-y-auto z-50 p-1.5 space-y-1">
                      {isSearching ? (
                        <div className="p-3 text-center text-xs text-[#85431E]">
                          <RefreshCw size={14} className="animate-spin mx-auto mb-1 text-[#D39858]" />
                          Searching database...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-3 text-center text-xs text-[#85431E]">
                          No products found matching query.
                        </div>
                      ) : (
                        searchResults.map((p) => {
                          const eff = getEffectivePrice(p, user, 1, b2bCache);
                          const unitRate = Number(eff.unitPrice || 0);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleAddProduct(p)}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#EACEAA]/20 text-left transition-colors group"
                            >
                              <div className="flex items-center gap-2">
                                {p.thumbnail ? (
                                  <img src={p.thumbnail} alt={p.name} className="w-8 h-8 object-cover rounded border border-[#34150F]/10" />
                                ) : (
                                  <div className="w-8 h-8 bg-[#EACEAA]/30 rounded flex items-center justify-center text-[#85431E]">
                                    <Building2 size={14} />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-[#34150F] group-hover:text-[#85431E] truncate max-w-[150px] sm:max-w-xs">{p.name}</p>
                                  <p className="text-[9px] text-[#85431E]/70 font-mono">SKU: {p.sku || "PRC-HARDWARE"}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-xs font-extrabold text-[#34150F]">₹{unitRate.toLocaleString("en-IN")}</span>
                                  {eff.isCustomB2BPrice ? (
                                    <span className="text-[8px] text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/30 px-1 py-0.2 rounded font-extrabold">Custom</span>
                                  ) : (
                                    <span className="text-[8px] text-[#D39858] bg-[#D39858]/10 border border-[#D39858]/30 px-1 py-0.2 rounded font-bold">B2B</span>
                                  )}
                                </div>
                                <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded mt-0.5 inline-block font-bold">Add +</span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {errors.lineItems && (
                <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  <span>{errors.lineItems}</span>
                </p>
              )}

              {/* Mobile Line Items Cards (Small screens) */}
              <div className="md:hidden space-y-2">
                {lineItems.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-[#85431E]/60 bg-[#EACEAA]/10 rounded-xl border border-[#34150F]/10">
                    No hardware items added yet. Search above to add items to quote.
                  </div>
                ) : (
                  lineItems.map((item) => (
                    <div key={item.productId} className="bg-white p-2.5 rounded-lg border border-[#34150F]/10 shadow-2xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.name} className="w-8 h-8 object-cover rounded border border-[#34150F]/10 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-[#EACEAA]/30 rounded flex items-center justify-center text-[#85431E] shrink-0">
                              <Building2 size={14} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[11.5px] font-bold text-[#34150F] leading-tight truncate">{item.name}</p>
                            <p className="text-[9px] text-[#85431E]/70 font-mono">SKU: {item.sku || "PRC-HD"}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded bg-rose-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-[#34150F]/6 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#85431E] font-bold">Qty:</span>
                          <div className="flex items-center border border-[#34150F]/20 rounded-lg overflow-hidden bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center font-bold text-[#34150F] hover:bg-[#EACEAA]/40 disabled:opacity-30 transition-colors"
                              title="Decrease quantity"
                            >
                              <Minus size={11} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                              className="w-9 text-center font-mono font-bold text-xs bg-transparent border-x border-[#34150F]/15 py-0.5 focus:outline-none text-[#34150F]"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center font-bold text-[#34150F] hover:bg-[#EACEAA]/40 transition-colors"
                              title="Increase quantity"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          <span className="text-[10px] text-[#85431E] uppercase font-bold">{item.unit || "NOS"}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-[#85431E] block">₹{Number(item.rate || 0).toLocaleString("en-IN")}/u</span>
                          <span className="font-mono font-black text-xs text-[#34150F]">₹{Number(item.amount || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Line Items Table */}
              <div className="hidden md:block overflow-x-auto border border-[#34150F]/10 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EACEAA]/30 text-[#34150F] border-b border-[#34150F]/10 font-bold">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">Sl. No.</th>
                      <th className="py-3 px-4">Hardware Product</th>
                      <th className="py-3 px-3 w-20">Unit</th>
                      <th className="py-3 px-3 w-36 text-center">Quantity</th>
                      <th className="py-3 px-4 w-28 text-right">B2B Rate</th>
                      <th className="py-3 px-4 w-32 text-right">Amount (₹)</th>
                      <th className="py-3 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#34150F]/5">
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-[#85431E]/60">
                          No hardware items added yet. Use the search bar above to append products to the quote.
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((item, idx) => (
                        <tr key={item.productId} className="hover:bg-[#EACEAA]/10 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-[#85431E]">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {item.thumbnail && (
                                <img src={item.thumbnail} alt={item.name} className="w-8 h-8 object-cover rounded border border-[#34150F]/10" />
                              )}
                              <div>
                                <p className="font-bold text-[#34150F]">{item.name}</p>
                                <p className="text-[10px] text-[#85431E]/70 font-mono">SKU: {item.sku || "PRC-HARDWARE"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-[#34150F] uppercase">{item.unit || "NOS"}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center border border-[#34150F]/20 rounded-xl overflow-hidden bg-[#EACEAA]/15 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#34150F] transition-all active:scale-95 cursor-pointer"
                                title="Decrease quantity"
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                                className="w-12 sm:w-14 text-center font-mono font-bold text-xs bg-white border-x border-[#34150F]/15 py-1 sm:py-1.5 focus:outline-none focus:bg-white text-[#34150F]"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-[#34150F] hover:bg-[#34150F] hover:text-[#EACEAA] transition-all active:scale-95 cursor-pointer"
                                title="Increase quantity"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#34150F]">
                            ₹{Number(item.rate || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-[#85431E]">
                            ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Cost Summary (Left-Aligned) */}
            <div className="p-3.5 sm:p-5 bg-[#EACEAA]/20 rounded-xl sm:rounded-2xl border border-[#34150F]/10 max-w-md space-y-2 sm:space-y-3">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#34150F] border-b border-[#34150F]/10 pb-1.5">
                Cost Summary
              </h4>

              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="text-[#85431E] font-semibold">Shipping / Transport</span>
                <span className="font-bold text-[#34150F] bg-white px-2 py-0.2 rounded border border-[#34150F]/10 text-[10px] sm:text-xs">
                  At actual
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="text-[#85431E] font-semibold">Basic Price (Excl. GST)</span>
                <span className="font-mono font-bold text-[#34150F]">₹{basicPrice.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] sm:text-xs">
                <span className="text-[#85431E] font-semibold">GST (18% Flat)</span>
                <span className="font-mono font-bold text-[#34150F]">₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#34150F] pt-1.5 border-t border-[#34150F]/10">
                <span>Grand Total</span>
                <span className="font-mono text-sm sm:text-base text-[#85431E]">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>

              <p className="text-[9px] sm:text-[10px] text-[#85431E]/70 leading-relaxed italic">
                * Note: Grand Total excludes shipping; final freight confirmed upon estimation.
              </p>
            </div>

            {/* Section 4: Notes & Terms */}
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <label className="font-bold text-[#34150F]">Project Notes / Custom Specs</label>
                  <span className={`text-[9px] sm:text-[10px] font-bold ${notes.length > 500 ? "text-rose-600" : "text-[#85431E]/70"}`}>
                    {notes.length} / 500
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify finish (SS304/SS316, Matt Black), site delivery address, partition thickness..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-lg sm:rounded-xl text-[11.5px] sm:text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-start gap-2 cursor-pointer text-[10.5px] sm:text-xs text-[#34150F]">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setErrors((prev) => ({ ...prev, termsAccepted: "" }));
                    }}
                    className="mt-0.5 rounded border-[#34150F]/30 text-[#34150F] focus:ring-[#34150F]"
                  />
                  <span className="font-semibold leading-snug">
                    I accept all the terms and conditions and confirm that this inquiry is on behalf of a commercial business entity. <span className="text-rose-600">*</span>
                  </span>
                </label>
                {touched.termsAccepted && errors.termsAccepted && (
                  <p className="text-[10px] sm:text-[11px] text-rose-600 font-semibold">{errors.termsAccepted}</p>
                )}
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3 border-t border-[#34150F]/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#85431E]">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Protected by PRC Digital Signing</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || lineItems.length === 0 || !termsAccepted}
                className="w-full sm:w-auto bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs py-2.5 sm:py-3.5 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Submitting Quotation...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Submit RFQ Quotation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
