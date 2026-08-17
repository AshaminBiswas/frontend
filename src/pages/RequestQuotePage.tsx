import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2, ArrowLeft, Search, Plus, Trash2, CheckCircle2,
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
  const [phone, setPhone] = useState(user?.phone || "");
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

  // Sync user profile data if user changes
  useEffect(() => {
    if (user) {
      if (user.firstName && !firstName) setFirstName(user.firstName);
      if (user.lastName && !lastName) setLastName(user.lastName);
      if (user.companyName && !companyName) setCompanyName(user.companyName);
      if (user.gstin && !gstNo) setGstNo(user.gstin);
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

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
      case "phone":
        if (!value || !PHONE_REGEX.test(value.trim())) {
          return "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
        }
        return "";
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

  // Update item quantity
  const handleQuantityChange = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setLineItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQty,
              amount: Math.round(newQty * Number(item.rate || 0) * 100) / 100,
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
        phone: phone.trim(),
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
      <div className="min-h-screen bg-[#EACEAA]/20 py-12 px-4 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#85431E] hover:text-[#34150F] font-bold text-xs transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {/* Navigation Sub-Tabs */}
          <div className="flex bg-white/80 p-1.5 rounded-2xl border border-[#34150F]/10 max-w-md mx-auto shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("rfq-form")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "rfq-form"
                  ? "bg-[#34150F] text-[#EACEAA] shadow"
                  : "text-[#85431E] hover:text-[#34150F]"
              }`}
            >
              Submit New RFQ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "tracking"
                  ? "bg-[#34150F] text-[#EACEAA] shadow"
                  : "text-[#85431E] hover:text-[#34150F]"
              }`}
            >
              Track Quotation Status
            </button>
          </div>

          {activeTab === "rfq-form" ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#34150F]/10 shadow-lg text-center space-y-6">
              <div className="w-20 h-20 bg-[#34150F]/10 text-[#34150F] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Building2 size={40} />
              </div>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D39858] bg-[#D39858]/10 px-3 py-1 rounded-full border border-[#D39858]/20">
                  B2B Corporate Wholesale Portal
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-[#34150F] mt-3" style={{ fontFamily: "'Gilda Display', serif" }}>
                  B2B Quotation (RFQ) Access Restricted
                </h1>
                <p className="text-xs md:text-sm text-[#85431E] max-w-lg mx-auto mt-2 leading-relaxed">
                  Direct contractor quotations, volume project estimation, and digitally-signed formal bids are reserved exclusively for registered business clients with valid GSTIN credentials.
                </p>
              </div>

              {user ? (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-left max-w-lg mx-auto space-y-3">
                  <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                    You are logged in as a retail account (<strong>{user.email}</strong>). Please upgrade your account with company & GSTIN information to activate instant RFQ submission.
                  </p>
                  <Link
                    to="/profile?tab=edit"
                    className="inline-flex items-center justify-center gap-2 w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-3 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow"
                  >
                    Add Company Details to Profile
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-2">
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-3.5 px-6 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow"
                  >
                    Sign In to B2B Account
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal("register")}
                    className="w-full bg-[#D39858] text-[#34150F] font-bold text-xs py-3.5 px-6 rounded-xl hover:bg-[#34150F] hover:text-[#EACEAA] transition-all shadow"
                  >
                    Register Business Account
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-[#34150F]/5 flex items-center justify-center gap-6 text-[11px] text-[#85431E]">
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> GST Compliant</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-600" /> Digital Signatures</span>
                <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-amber-600" /> Fast Turnaround</span>
              </div>
            </div>
          ) : (
            /* Universal Tracking Section */
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#34150F]/10 shadow-lg space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                  Track Quotation Status
                </h2>
                <p className="text-xs text-[#85431E] mt-1">
                  Search by your <strong>Quotation Reference No</strong> (e.g. PRC-QT-2026-27/001), <strong>Email</strong>, <strong>GSTIN</strong>, or <strong>Phone Number</strong>.
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                  <input
                    type="text"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    placeholder="Enter Reference No, Email, GSTIN, or Phone..."
                    className="w-full pl-10 pr-4 py-3 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/50 focus:outline-none focus:border-[#34150F]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isTracking || !trackingQuery.trim()}
                  className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isTracking ? <RefreshCw size={14} className="animate-spin" /> : "Track"}
                </button>
              </form>

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
                  <p className="text-[11px] text-[#85431E] mt-1">Please double-check the entered reference number or contact credentials.</p>
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
                        <div className="flex items-center gap-2">
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
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-[#85431E]/70 uppercase">Company</span>
                          <p className="font-bold text-[#34150F] truncate">{q.companyName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#85431E]/70 uppercase">Client</span>
                          <p className="font-bold text-[#34150F]">{q.clientName || q.emailMasked}</p>
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
                            <CheckCircle2 size={14} className="text-emerald-600" /> Approved & Digitally Signed
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadTrackingPdf(q.accessToken!, q.referenceNo)}
                              disabled={downloadingPdfToken === q.accessToken}
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-300 disabled:opacity-50"
                            >
                              {downloadingPdfToken === q.accessToken ? (
                                <RefreshCw size={13} className="animate-spin text-emerald-700" />
                              ) : (
                                <Download size={13} />
                              )}
                              <span>Download PDF</span>
                            </button>
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
          )}
        </div>
      </div>
    );
  }

  // ─── SUCCESS SCREEN: If RFQ submitted successfully ───
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#EACEAA]/20 py-12 px-4 md:px-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 md:p-12 border border-[#34150F]/10 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Quotation Request Submitted!
            </h1>
            <p className="text-xs text-[#85431E] mt-2">
              Your official B2B RFQ has been logged in Pacific Products & Solutions central registry.
            </p>
          </div>

          <div className="p-5 bg-[#EACEAA]/20 rounded-2xl border border-[#34150F]/10 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-2">
              <span className="text-[#85431E] font-semibold">Reference Number</span>
              <span className="font-mono font-black text-sm text-[#34150F]">{submitSuccess.referenceNo}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-2">
              <span className="text-[#85431E] font-semibold">Project Name</span>
              <span className="font-bold text-[#34150F]">{submitSuccess.projectName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-2">
              <span className="text-[#85431E] font-semibold">Client / Company</span>
              <span className="font-bold text-[#34150F]">{submitSuccess.companyName} ({submitSuccess.gstNo})</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-2">
              <span className="text-[#85431E] font-semibold">Estimated Basic Price</span>
              <span className="font-bold text-[#34150F]">₹{submitSuccess.basicPrice.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-2">
              <span className="text-[#85431E] font-semibold">GST (18%)</span>
              <span className="font-bold text-[#34150F]">₹{submitSuccess.gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[#85431E] font-bold">Estimated Grand Total</span>
              <span className="font-extrabold text-sm text-[#85431E]">₹{submitSuccess.grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <p className="text-xs text-[#85431E]/80">
            A confirmation email has been dispatched to <strong>{submitSuccess.email}</strong>. Our estimating team will review and digitally sign the final quotation with transport details.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                setSubmitSuccess(null);
                setLineItems([]);
                setProjectName("");
                setNotes("");
              }}
              className="bg-[#34150F] text-[#EACEAA] font-bold text-xs py-3 px-6 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow"
            >
              Submit Another Quote
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="bg-[#EACEAA]/40 text-[#34150F] font-bold text-xs py-3 px-6 rounded-xl hover:bg-[#EACEAA] transition-all border border-[#34150F]/10"
            >
              Return to Catalog
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

            <form onSubmit={handleTrackSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                <input
                  type="text"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder="Enter Reference No, Email, GSTIN, or Phone..."
                  className="w-full pl-10 pr-4 py-3 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/50 focus:outline-none focus:border-[#34150F]"
                />
              </div>
              <button
                type="submit"
                disabled={isTracking || !trackingQuery.trim()}
                className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isTracking ? <RefreshCw size={14} className="animate-spin" /> : "Track"}
              </button>
            </form>

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
                          <button
                            type="button"
                            onClick={() => handleDownloadTrackingPdf(q.accessToken!, q.referenceNo)}
                            disabled={downloadingPdfToken === q.accessToken}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-300 disabled:opacity-50"
                          >
                            {downloadingPdfToken === q.accessToken ? (
                              <RefreshCw size={13} className="animate-spin text-emerald-700" />
                            ) : (
                              <Download size={13} />
                            )}
                            <span>Download PDF</span>
                          </button>
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
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-10 border border-[#34150F]/10 shadow-lg space-y-8">
            {/* Header Banner */}
            <div className="border-b border-[#34150F]/10 pb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D39858] uppercase tracking-wider">
                <Building2 size={15} />
                <span>Pacific Products & Solutions • B2B Quotation Form</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#34150F] mt-1" style={{ fontFamily: "'Gilda Display', serif" }}>
                Request for Quotation (RFQ)
              </h1>
              <p className="text-xs text-[#85431E] mt-1">
                Configure your commercial hardware bill of quantities for architectural cubicles, lockers, and restroom hardware.
              </p>
            </div>

            {/* Reference Number Preview */}
            <div className="bg-[#EACEAA]/20 border border-[#34150F]/10 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-[#85431E] font-bold uppercase tracking-wider block">Reference No</span>
                <span className="font-mono font-bold text-xs text-[#34150F]">
                  PRC-QT-2026-27/--- <span className="text-[11px] text-[#85431E] font-normal">(Auto-generated upon submission)</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full uppercase">
                  Verified B2B Account
                </span>
              </div>
            </div>

            {/* Section 1: Project & Client Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#34150F] flex items-center gap-2 border-b border-[#34150F]/10 pb-2">
                <Layers size={16} className="text-[#D39858]" />
                <span>1. Project & Business Details</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#34150F]">
                    Project Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onBlur={() => handleBlur("projectName", projectName)}
                    placeholder="e.g. Prestige Tech Park Tower 4 Restroom Fitout"
                    className={`w-full px-4 py-2.5 bg-[#EACEAA]/15 border rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.projectName && errors.projectName ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.projectName && errors.projectName && (
                    <p className="text-[11px] text-rose-600 font-semibold">{errors.projectName}</p>
                  )}
                </div>

                {/* First Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#34150F]">
                    First Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => handleBlur("firstName", firstName)}
                    placeholder="e.g. Rajesh"
                    className={`w-full px-4 py-2.5 bg-[#EACEAA]/15 border rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.firstName && errors.firstName ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="text-[11px] text-rose-600 font-semibold">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#34150F]">
                    Last Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => handleBlur("lastName", lastName)}
                    placeholder="e.g. Sharma"
                    className={`w-full px-4 py-2.5 bg-[#EACEAA]/15 border rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.lastName && errors.lastName ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="text-[11px] text-rose-600 font-semibold">{errors.lastName}</p>
                  )}
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#34150F]">
                    Company Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onBlur={() => handleBlur("companyName", companyName)}
                    placeholder="e.g. Apex Infrastructure Solutions Pvt Ltd"
                    className={`w-full px-4 py-2.5 bg-[#EACEAA]/15 border rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.companyName && errors.companyName ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.companyName && errors.companyName && (
                    <p className="text-[11px] text-rose-600 font-semibold">{errors.companyName}</p>
                  )}
                </div>

                {/* GST No */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#34150F]">
                    GST No (GSTIN) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                    onBlur={() => handleBlur("gstNo", gstNo)}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className={`w-full px-4 py-2.5 bg-[#EACEAA]/15 border rounded-xl text-xs font-mono text-[#34150F] placeholder-[#85431E]/40 uppercase focus:outline-none ${
                      touched.gstNo && errors.gstNo ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.gstNo && errors.gstNo && (
                    <p className="text-[11px] text-rose-600 font-semibold">{errors.gstNo}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#34150F]">
                    Business Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur("email", email)}
                    placeholder="e.g. procurement@apexinfra.com"
                    className={`w-full px-4 py-2.5 bg-[#EACEAA]/15 border rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.email && errors.email ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-[11px] text-rose-600 font-semibold">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#34150F]">
                    Phone Number (10 Digits) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onBlur={() => handleBlur("phone", phone)}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-4 py-2.5 bg-[#EACEAA]/15 border rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none ${
                      touched.phone && errors.phone ? "border-rose-500 bg-rose-50/30" : "border-[#34150F]/15 focus:border-[#34150F]"
                    }`}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-[11px] text-rose-600 font-semibold">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Live Product Selection & Filter */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#34150F] flex items-center gap-2 border-b border-[#34150F]/10 pb-2">
                <Search size={16} className="text-[#D39858]" />
                <span>2. Select Hardware Products</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] font-bold focus:outline-none focus:border-[#34150F] appearance-none cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85431E] pointer-events-none" />
                </div>

                {/* Search Bar */}
                <div className="sm:col-span-2 relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search active catalog by name, SKU, or specification..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F]"
                  />

                  {/* Dropdown Results */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#34150F]/15 shadow-xl max-h-64 overflow-y-auto z-50 p-2 space-y-1">
                      {isSearching ? (
                        <div className="p-4 text-center text-xs text-[#85431E]">
                          <RefreshCw size={16} className="animate-spin mx-auto mb-1 text-[#D39858]" />
                          Searching database...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#85431E]">
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
                              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EACEAA]/20 text-left transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                {p.thumbnail ? (
                                  <img src={p.thumbnail} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-[#34150F]/10" />
                                ) : (
                                  <div className="w-10 h-10 bg-[#EACEAA]/30 rounded-lg flex items-center justify-center text-[#85431E]">
                                    <Building2 size={16} />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-[#34150F] group-hover:text-[#85431E]">{p.name}</p>
                                  <p className="text-[10px] text-[#85431E]/70 font-mono">SKU: {p.sku || "PRC-HARDWARE"}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-xs font-extrabold text-[#34150F]">₹{unitRate.toLocaleString("en-IN")}</span>
                                  {eff.isCustomB2BPrice ? (
                                    <span className="text-[9px] text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/30 px-1.5 py-0.5 rounded font-extrabold">Custom</span>
                                  ) : (
                                    <span className="text-[9px] text-[#D39858] bg-[#D39858]/10 border border-[#D39858]/30 px-1.5 py-0.5 rounded font-bold">B2B</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded mt-0.5 inline-block font-bold">Add +</span>
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
                <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>{errors.lineItems}</span>
                </p>
              )}

              {/* Line Items Table */}
              <div className="overflow-x-auto border border-[#34150F]/10 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EACEAA]/30 text-[#34150F] border-b border-[#34150F]/10 font-bold">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">Sl. No.</th>
                      <th className="py-3 px-4">Hardware Product</th>
                      <th className="py-3 px-3 w-20">Unit</th>
                      <th className="py-3 px-3 w-24 text-center">Quantity</th>
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
                                <p className="text-[10px] font-mono text-[#85431E]/70">{item.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-[11px] bg-[#EACEAA]/30 px-2 py-0.5 rounded text-[#34150F]">
                              {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 bg-white border border-[#34150F]/20 rounded-lg text-xs font-bold text-center text-[#34150F] focus:outline-none focus:border-[#34150F]"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#34150F]">
                            <div>₹{Number(item.rate || 0).toLocaleString("en-IN")}</div>
                            <span className="text-[9px] text-[#85431E]/70 block font-sans font-normal">B2B Rate</span>
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
            <div className="p-5 bg-[#EACEAA]/20 rounded-2xl border border-[#34150F]/10 max-w-md space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#34150F] border-b border-[#34150F]/10 pb-2">
                Cost Summary
              </h4>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#85431E] font-semibold">Shipping and Transport Cost</span>
                <span className="font-bold text-[#34150F] bg-white px-2 py-0.5 rounded border border-[#34150F]/10">
                  At actual
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#85431E] font-semibold">Basic Price (Excl. GST)</span>
                <span className="font-mono font-bold text-[#34150F]">₹{basicPrice.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#85431E] font-semibold">GST (18% Flat)</span>
                <span className="font-mono font-bold text-[#34150F]">₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between text-sm font-extrabold text-[#34150F] pt-2 border-t border-[#34150F]/10">
                <span>Grand Total</span>
                <span className="font-mono text-base text-[#85431E]">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>

              <p className="text-[10px] text-[#85431E]/70 leading-relaxed italic">
                * Note: Grand Total excludes shipping; final shipping cost will be confirmed upon admin review.
              </p>
            </div>

            {/* Section 4: Notes & Terms */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-[#34150F]">Project Notes / Custom Specifications</label>
                  <span className={`text-[10px] font-bold ${notes.length > 500 ? "text-rose-600" : "text-[#85431E]/70"}`}>
                    {notes.length} / 500
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={notes}
                  maxLength={500}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify custom finish (SS304/SS316, Matt Black, Antique Brass), delivery site logistics, or partition board thickness..."
                  className="w-full px-4 py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#34150F]">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setErrors((prev) => ({ ...prev, termsAccepted: "" }));
                    }}
                    className="mt-0.5 rounded border-[#34150F]/30 text-[#34150F] focus:ring-[#34150F]"
                  />
                  <span className="font-semibold">
                    I accept all the terms and conditions and confirm that this inquiry is on behalf of a commercial business entity. <span className="text-rose-600">*</span>
                  </span>
                </label>
                {touched.termsAccepted && errors.termsAccepted && (
                  <p className="text-[11px] text-rose-600 font-semibold">{errors.termsAccepted}</p>
                )}
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4 border-t border-[#34150F]/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-[#85431E]">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Protected by Pacific Digital Signing System</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || lineItems.length === 0 || !termsAccepted}
                className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs py-3.5 px-8 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Submitting Quotation...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
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
