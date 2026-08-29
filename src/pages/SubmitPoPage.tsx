import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Building2,
  FileText,
  Upload,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  Paperclip,
  Clock,
  ShieldCheck,
  Send,
  Sparkles,
  RefreshCw,
  X,
  FileUp,
  HelpCircle,
  Calendar,
  CreditCard,
  Truck,
  MapPin,
  Mail,
  Phone,
  User,
  Check,
  DollarSign,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  poSubmissionService,
  CustomerPoItem,
  CustomerPoSubmissionPayload,
} from "../services/poSubmissionService";
import { quotationService, QuotationDetail } from "../services/quotationService";

export type PoSubmissionMode = "QUOTATION" | "PO_FORM" | "CUSTOM_PDF_UPLOAD";

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

export function SubmitPoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse URL query params (e.g. ?quoteNumber=...&quoteId=...&mode=QUOTATION)
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialQuoteNumber = queryParams.get("quoteNumber") || "";
  const initialQuoteId = queryParams.get("quoteId") || "";
  const initialMode = (queryParams.get("mode") as PoSubmissionMode) || (initialQuoteNumber ? "QUOTATION" : "PO_FORM");

  // Active Submission Mode Tab
  const [activeMode, setActiveMode] = useState<PoSubmissionMode>(initialMode);

  // Common Contact & Company Details
  const [customerName, setCustomerName] = useState(
    user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : ""
  );
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState(cleanIndianPhone(user?.phone || ""));
  const [gstin, setGstin] = useState(user?.gstin || "");
  const [customerPoNumber, setCustomerPoNumber] = useState("");
  const [deliveryTimeline, setDeliveryTimeline] = useState("Immediate (Within 7-10 Working Days)");
  const [paymentTerms, setPaymentTerms] = useState("Advance against Proforma Invoice");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");

  // Option 1: Quotation Linked PO State
  const [quoteNumberInput, setQuoteNumberInput] = useState(initialQuoteNumber);
  const [quoteIdInput, setQuoteIdInput] = useState(initialQuoteId);
  const [linkedQuote, setLinkedQuote] = useState<QuotationDetail | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteSearchError, setQuoteSearchError] = useState("");

  // Option 2: Custom PO Line Items State
  const [lineItems, setLineItems] = useState<CustomerPoItem[]>([
    {
      productName: "",
      sku: "",
      quantity: 10,
      unit: "PCS",
      targetRate: 0,
      totalPrice: 0,
      specifications: "",
    },
  ]);

  // Option 3 / General Attached Files State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState<{
    poSubmissionId: string;
    id: string;
    message: string;
  } | null>(null);

  // Sync user profile changes
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
      if (!companyName && user.companyName) setCompanyName(user.companyName);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(cleanIndianPhone(user.phone));
      if (!gstin && user.gstin) setGstin(user.gstin);
    }
  }, [user]);

  // Load quote automatically if quoteNumber query exists
  useEffect(() => {
    if (initialQuoteNumber) {
      handleLookupQuote(initialQuoteNumber);
    }
  }, [initialQuoteNumber]);

  // Handle Lookup Quote
  const handleLookupQuote = async (queryToSearch: string) => {
    const q = (queryToSearch || quoteNumberInput).trim();
    if (!q) {
      setQuoteSearchError("Please enter a valid Quotation Reference Number (e.g. PRC-QT-2026-0001)");
      return;
    }
    setLoadingQuote(true);
    setQuoteSearchError("");
    try {
      const res = await quotationService.trackQuotes(q);
      if (res.success && res.data && res.data.length > 0) {
        const found = res.data[0];
        // If we have access token or id, fetch full details
        const detailRes = await quotationService.getQuoteByToken(found.accessToken || found.id);
        if (detailRes.success && detailRes.data) {
          setLinkedQuote(detailRes.data);
          setQuoteNumberInput(detailRes.data.referenceNo || detailRes.data.quoteNumber);
          setQuoteIdInput(detailRes.data.id);
          if (detailRes.data.companyName && !companyName) setCompanyName(detailRes.data.companyName);
          if (detailRes.data.firstName && !customerName) {
            setCustomerName(`${detailRes.data.firstName} ${detailRes.data.lastName || ""}`.trim());
          }
          if (detailRes.data.email && !customerEmail) setCustomerEmail(detailRes.data.email);
          if (detailRes.data.phone && !customerPhone) setCustomerPhone(cleanIndianPhone(detailRes.data.phone));
          if (detailRes.data.gstNo && !gstin) setGstin(detailRes.data.gstNo);
        } else {
          setQuoteSearchError("Quotation found, but could not load detailed items.");
        }
      } else {
        setQuoteSearchError("No quotation found matching this reference number. You can also submit via Custom Form or Document Upload.");
      }
    } catch (err: any) {
      setQuoteSearchError(err.message || "Failed to lookup quotation.");
    } finally {
      setLoadingQuote(false);
    }
  };

  // Line item helpers
  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        productName: "",
        sku: "",
        quantity: 1,
        unit: "PCS",
        targetRate: 0,
        totalPrice: 0,
        specifications: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CustomerPoItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      if (field === "quantity" || field === "targetRate") {
        const qty = field === "quantity" ? Number(value) || 0 : current.quantity;
        const rate = field === "targetRate" ? Number(value) || 0 : current.targetRate;
        current.totalPrice = Math.round(qty * rate);
      }

      updated[index] = current;
      return updated;
    });
  };

  // Financial calculations for Custom PO Form
  const estimatedSubtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [lineItems]);

  const estimatedGst = useMemo(() => {
    return Math.round(estimatedSubtotal * 0.18);
  }, [estimatedSubtotal]);

  const estimatedGrandTotal = useMemo(() => {
    return estimatedSubtotal + estimatedGst;
  }, [estimatedSubtotal, estimatedGst]);

  // File Upload Handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    for (const f of newFiles) {
      if (f.size > 25 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds maximum allowed size of 25MB.`);
        continue;
      }
      validFiles.push(f);
    }
    setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmitPo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Basic Validations
    if (!customerName.trim()) {
      setSubmitError("Please provide contact person full name.");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setSubmitError("Please provide a valid email address for order notifications.");
      return;
    }
    if (customerPhone && !PHONE_REGEX.test(cleanIndianPhone(customerPhone))) {
      setSubmitError("Please provide a valid 10-digit Indian mobile number.");
      return;
    }
    if (gstin && !GSTIN_REGEX.test(gstin.toUpperCase().trim())) {
      setSubmitError("Please enter a valid 15-character GSTIN format (e.g. 07AAAAA0000A1Z5) or leave blank.");
      return;
    }

    // Specific Mode Validations
    if (activeMode === "QUOTATION" && !quoteNumberInput.trim() && !linkedQuote) {
      setSubmitError("Please enter and verify your Quotation Reference Number before submitting.");
      return;
    }

    if (activeMode === "CUSTOM_PO_FORM") {
      const validItems = lineItems.filter((it) => it.productName.trim().length > 0);
      if (validItems.length === 0) {
        setSubmitError("Please add at least one line item with product name and quantity.");
        return;
      }
    }

    if (activeMode === "CUSTOM_PDF_UPLOAD" && uploadedFiles.length === 0) {
      setSubmitError("Please attach at least one signed Purchase Order document (PDF, Scanned copy, or Excel).");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CustomerPoSubmissionPayload = {
        source: activeMode,
        customerName: customerName.trim(),
        companyName: companyName.trim() || undefined,
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone ? cleanIndianPhone(customerPhone) : undefined,
        customerPoNumber: customerPoNumber.trim() || undefined,
        quoteId: quoteIdInput || linkedQuote?.id || undefined,
        quoteNumber: quoteNumberInput.trim() || linkedQuote?.referenceNo || undefined,
        subject: `[${activeMode === "QUOTATION" ? "Quote PO" : activeMode === "CUSTOM_PDF_UPLOAD" ? "Direct Upload PO" : "Form PO"}] Order from ${companyName || customerName}`,
        notes: notes.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        shippingAddress: (sameAsBilling ? billingAddress : shippingAddress).trim() || undefined,
        gstin: gstin ? gstin.toUpperCase().trim() : undefined,
        deliveryTimeline,
        paymentTerms,
        priority,
        lineItems: activeMode === "PO_FORM" ? lineItems.filter((i) => i.productName.trim().length > 0) : undefined,
        files: uploadedFiles,
      };

      const result = await poSubmissionService.submitCustomerPo(payload);
      setSubmitSuccess({
        poSubmissionId: result.poSubmissionId,
        id: result.id,
        message: result.message,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit Purchase Order. Please try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EACEAA]/30 py-6 sm:py-10 px-3 sm:px-6 lg:px-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#85431E]/80 bg-[#34150F]/5 px-2.5 py-1 rounded-full font-semibold border border-[#34150F]/10">
              PRC Commercial Hub • ISO 9001 Certified
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#34150F] to-[#4A2016] text-[#EACEAA] p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-[#D39858]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-[#D39858]/20 border border-[#D39858]/30 px-3 py-1 rounded-full text-xs font-extrabold text-[#D39858]">
              <Sparkles size={13} /> Official B2B Order Placement
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Gilda Display', serif" }}>
              Purchase Order (PO) Submission
            </h1>
            <p className="text-xs sm:text-sm text-[#EACEAA]/80 leading-relaxed">
              Submit your formal Purchase Order for immediate commercial validation, warehouse allocation, and Proforma Invoice issuance. Select your preferred submission method below.
            </p>
          </div>
        </div>

        {/* SUCCESS STATE MODAL / BANNER */}
        {submitSuccess ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-[#34150F]/15 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={42} className="animate-bounce" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
                Submission Confirmed
              </span>
              <h2 className="text-2xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                Purchase Order Received Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-[#85431E] leading-relaxed">
                Your Purchase Order has been registered in our commercial enterprise system. Our fulfillment and technical team has been notified.
              </p>
            </div>

            {/* Tracking ID Badge */}
            <div className="bg-[#EACEAA]/20 border border-[#34150F]/15 p-4 sm:p-5 rounded-2xl max-w-md mx-auto space-y-2">
              <span className="text-[11px] font-bold text-[#85431E] block">Internal PO Tracking Reference</span>
              <div className="font-mono text-xl sm:text-2xl font-black text-[#34150F] tracking-wide">
                {submitSuccess.poSubmissionId}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#85431E]/70">
                A confirmation email with order details has been dispatched to <strong>{customerEmail}</strong>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSubmitSuccess(null);
                  setUploadedFiles([]);
                  setCustomerPoNumber("");
                  setNotes("");
                }}
                className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={15} /> Submit Another PO
              </button>

              <Link
                to="/"
                className="bg-[#EACEAA]/40 hover:bg-[#D39858]/30 text-[#34150F] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all border border-[#34150F]/15"
              >
                Back to Storefront
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitPo} className="space-y-6">
            
            {/* ─── 3 SUBMISSION CHANNEL TABS ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Option 1: Quotation-linked PO */}
              <button
                type="button"
                onClick={() => setActiveMode("QUOTATION")}
                className={`p-4 sm:p-5 rounded-2xl text-left border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  activeMode === "QUOTATION"
                    ? "bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-lg ring-2 ring-[#D39858]"
                    : "bg-white text-[#34150F] border-[#34150F]/15 hover:border-[#34150F]/40 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2.5 rounded-xl ${activeMode === "QUOTATION" ? "bg-[#D39858]/20 text-[#D39858]" : "bg-[#EACEAA]/40 text-[#85431E]"}`}>
                    <FileText size={20} />
                  </div>
                  {activeMode === "QUOTATION" && (
                    <span className="bg-[#D39858] text-[#34150F] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Active Mode
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Option 1: PO from Quotation</h3>
                  <p className={`text-[11px] mt-1 leading-snug ${activeMode === "QUOTATION" ? "text-[#EACEAA]/80" : "text-[#85431E]"}`}>
                    Execute an approved quotation with pre-negotiated rates and project line items.
                  </p>
                </div>
              </button>

              {/* Option 2: Custom PO Form Builder */}
              <button
                type="button"
                onClick={() => setActiveMode("PO_FORM")}
                className={`p-4 sm:p-5 rounded-2xl text-left border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  activeMode === "PO_FORM"
                    ? "bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-lg ring-2 ring-[#D39858]"
                    : "bg-white text-[#34150F] border-[#34150F]/15 hover:border-[#34150F]/40 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2.5 rounded-xl ${activeMode === "PO_FORM" ? "bg-[#D39858]/20 text-[#D39858]" : "bg-[#EACEAA]/40 text-[#85431E]"}`}>
                    <Layers size={20} />
                  </div>
                  {activeMode === "PO_FORM" && (
                    <span className="bg-[#D39858] text-[#34150F] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Active Mode
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Option 2: Custom PO Form</h3>
                  <p className={`text-[11px] mt-1 leading-snug ${activeMode === "PO_FORM" ? "text-[#EACEAA]/80" : "text-[#85431E]"}`}>
                    Interactive line-item composer with custom SKUs, quantities, and expected rates.
                  </p>
                </div>
              </button>

              {/* Option 3: Direct PO Document Upload */}
              <button
                type="button"
                onClick={() => setActiveMode("CUSTOM_PDF_UPLOAD")}
                className={`p-4 sm:p-5 rounded-2xl text-left border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  activeMode === "CUSTOM_PDF_UPLOAD"
                    ? "bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-lg ring-2 ring-[#D39858]"
                    : "bg-white text-[#34150F] border-[#34150F]/15 hover:border-[#34150F]/40 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2.5 rounded-xl ${activeMode === "CUSTOM_PDF_UPLOAD" ? "bg-[#D39858]/20 text-[#D39858]" : "bg-[#EACEAA]/40 text-[#85431E]"}`}>
                    <Upload size={20} />
                  </div>
                  {activeMode === "CUSTOM_PDF_UPLOAD" && (
                    <span className="bg-[#D39858] text-[#34150F] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Active Mode
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Option 3: Upload Your PO</h3>
                  <p className={`text-[11px] mt-1 leading-snug ${activeMode === "CUSTOM_PDF_UPLOAD" ? "text-[#EACEAA]/80" : "text-[#85431E]"}`}>
                    Direct upload of your signed company PO document (PDF, Excel, Word, or Scans).
                  </p>
                </div>
              </button>

            </div>

            {/* ─── TAB-SPECIFIC INPUT SECTIONS ───────────────────────────────── */}

            {/* OPTION 1: LINKED QUOTATION SELECTOR */}
            {activeMode === "QUOTATION" && (
              <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#34150F]/15 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                      <FileText size={18} className="text-[#85431E]" /> Link Existing Quotation
                    </h3>
                    <p className="text-xs text-[#85431E]">
                      Enter your quotation reference number to auto-attach pre-approved project pricing and terms.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85431E]/50" />
                    <input
                      type="text"
                      value={quoteNumberInput}
                      onChange={(e) => setQuoteNumberInput(e.target.value)}
                      placeholder="Enter Quotation Ref (e.g. PRC-QT-2026-0001 or QT-9281)"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#EACEAA]/15 border border-[#34150F]/20 rounded-xl text-xs sm:text-sm text-[#34150F] focus:outline-none focus:border-[#34150F]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={loadingQuote || !quoteNumberInput.trim()}
                    onClick={() => handleLookupQuote(quoteNumberInput)}
                    className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingQuote ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                    <span>Lookup Quote</span>
                  </button>
                </div>

                {quoteSearchError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-rose-600" />
                    <span>{quoteSearchError}</span>
                  </div>
                )}

                {linkedQuote && (
                  <div className="bg-[#EACEAA]/20 p-4 sm:p-5 rounded-2xl border border-[#34150F]/15 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#34150F]/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-[#34150F]">
                          {linkedQuote.referenceNo || linkedQuote.quoteNumber}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {linkedQuote.status}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#34150F]">
                        Total Value: ₹{Number(linkedQuote.grandTotal || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[#85431E]/70 text-[10px] block">Project Name</span>
                        <span className="font-bold text-[#34150F]">{linkedQuote.projectName || "Standard Project"}</span>
                      </div>
                      <div>
                        <span className="text-[#85431E]/70 text-[10px] block">Advance Required</span>
                        <span className="font-bold text-[#34150F]">{linkedQuote.advancePercentage || 30}%</span>
                      </div>
                      <div>
                        <span className="text-[#85431E]/70 text-[10px] block">Basic Subtotal</span>
                        <span className="font-bold text-[#34150F]">₹{Number(linkedQuote.basicPrice || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-[#85431E]/70 text-[10px] block">GST Tax</span>
                        <span className="font-bold text-[#34150F]">₹{Number(linkedQuote.gstAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 2: CUSTOM LINE ITEMS BUILDER */}
            {activeMode === "PO_FORM" && (
              <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#34150F]/15 shadow-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                      <Layers size={18} className="text-[#85431E]" /> Custom PO Line Items ({lineItems.length})
                    </h3>
                    <p className="text-xs text-[#85431E]">
                      Add the specific hardware fittings, quantities, and target prices for your order.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>

                {/* Line items list / table */}
                <div className="space-y-3 overflow-x-auto">
                  {lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 bg-[#EACEAA]/10 rounded-xl sm:rounded-2xl border border-[#34150F]/10 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between text-xs font-extrabold text-[#85431E]">
                        <span>Item #{index + 1}</span>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-rose-600 hover:text-rose-800 p-1 transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[10.5px] font-bold text-[#34150F]">Product Name / Description *</label>
                          <input
                            type="text"
                            required
                            value={item.productName}
                            onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                            placeholder="e.g. SS304 Privacy Indicator Bolt Lock"
                            className="w-full px-3 py-2 bg-white border border-[#34150F]/15 rounded-lg text-xs text-[#34150F] focus:outline-none focus:border-[#34150F]"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10.5px] font-bold text-[#34150F]">SKU / Model</label>
                          <input
                            type="text"
                            value={item.sku || ""}
                            onChange={(e) => handleItemChange(index, "sku", e.target.value)}
                            placeholder="PRC-CB-304"
                            className="w-full px-3 py-2 bg-white border border-[#34150F]/15 rounded-lg text-xs font-mono text-[#34150F] focus:outline-none focus:border-[#34150F]"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10.5px] font-bold text-[#34150F]">Quantity *</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="w-full px-2.5 py-2 bg-white border border-[#34150F]/15 rounded-lg text-xs font-bold text-[#34150F] focus:outline-none focus:border-[#34150F]"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                              className="px-1.5 py-2 bg-white border border-[#34150F]/15 rounded-lg text-[11px] font-bold text-[#34150F] focus:outline-none focus:border-[#34150F]"
                            >
                              <option value="PCS">PCS</option>
                              <option value="SETS">SETS</option>
                              <option value="METERS">MTR</option>
                              <option value="BOXES">BOX</option>
                              <option value="KGS">KGS</option>
                            </select>
                          </div>
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10.5px] font-bold text-[#34150F]">Target Rate (₹)</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={item.targetRate || ""}
                              onChange={(e) => handleItemChange(index, "targetRate", e.target.value)}
                              placeholder="₹ Rate"
                              className="w-full px-2.5 py-2 bg-white border border-[#34150F]/15 rounded-lg text-xs font-bold text-[#34150F] focus:outline-none focus:border-[#34150F]"
                            />
                            <span className="text-[11px] font-extrabold text-[#34150F] shrink-0 font-mono">
                              = ₹{(item.totalPrice || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-[#85431E]">Specifications / Finish / Notes</label>
                        <input
                          type="text"
                          value={item.specifications || ""}
                          onChange={(e) => handleItemChange(index, "specifications", e.target.value)}
                          placeholder="e.g. Satin Matt Finish, 12mm Board Compatibility, Anti-Corrosion Grade"
                          className="w-full px-3 py-1.5 bg-white/80 border border-[#34150F]/10 rounded-lg text-[11px] text-[#34150F] focus:outline-none focus:border-[#34150F]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Summary Footer */}
                <div className="p-4 bg-[#34150F]/5 rounded-2xl border border-[#34150F]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-[#85431E] font-bold">Estimated Order Amount</span>
                    <div className="text-[10px] text-[#85431E]/70">
                      Subtotal: ₹{estimatedSubtotal.toLocaleString("en-IN")} + GST (18%): ₹{estimatedGst.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#85431E] block uppercase tracking-wider font-extrabold">Estimated Total</span>
                    <span className="text-base sm:text-lg font-black text-[#34150F] font-mono">
                      ₹{estimatedGrandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── COMMON COMPANY & CUSTOMER DETAILS CARD ────────────────────── */}
            <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#34150F]/15 shadow-xs space-y-5">
              <div className="border-b border-[#34150F]/10 pb-3">
                <h3 className="font-extrabold text-base text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                  <Building2 size={18} className="text-[#85431E]" /> Customer & Commercial Information
                </h3>
                <p className="text-xs text-[#85431E]">
                  Billing entity, delivery destination, and purchase order identifiers for invoice generation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                
                {/* Contact Person */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <User size={12} className="text-[#85431E]" /> Contact Person Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-[#34150F] focus:outline-none focus:border-[#34150F]"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <Building2 size={12} className="text-[#85431E]" /> Company / Organization Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Infrastructure Pvt Ltd"
                    className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-[#34150F] focus:outline-none focus:border-[#34150F]"
                  />
                </div>

                {/* GSTIN */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <ShieldCheck size={12} className="text-[#85431E]" /> GSTIN (For Input Tax Credit)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl font-mono uppercase text-[#34150F] focus:outline-none focus:border-[#34150F]"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <Mail size={12} className="text-[#85431E]" /> Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="procurement@company.com"
                    className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-[#34150F] focus:outline-none focus:border-[#34150F]"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <Phone size={12} className="text-[#85431E]" /> Contact Mobile Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-[#34150F]/10 border border-r-0 border-[#34150F]/20 rounded-l-xl text-xs font-bold text-[#34150F]">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(cleanIndianPhone(e.target.value))}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-r-xl text-[#34150F] focus:outline-none focus:border-[#34150F]"
                    />
                  </div>
                </div>

                {/* Customer's Internal PO Number */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <FileText size={12} className="text-[#85431E]" /> Your Internal PO / Ref Number
                  </label>
                  <input
                    type="text"
                    value={customerPoNumber}
                    onChange={(e) => setCustomerPoNumber(e.target.value)}
                    placeholder="e.g. PO-APEX-2026-881"
                    className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl font-mono text-[#34150F] focus:outline-none focus:border-[#34150F]"
                  />
                </div>

                {/* Required Delivery Timeline */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <Truck size={12} className="text-[#85431E]" /> Required Delivery Timeline
                  </label>
                  <select
                    value={deliveryTimeline}
                    onChange={(e) => setDeliveryTimeline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-[#34150F] font-bold focus:outline-none focus:border-[#34150F]"
                  >
                    <option value="Urgent Dispatch (Within 2-4 Working Days)">Urgent Dispatch (Within 2-4 Working Days)</option>
                    <option value="Immediate (Within 7-10 Working Days)">Immediate (Within 7-10 Working Days)</option>
                    <option value="Standard Site Schedule (Within 15-20 Days)">Standard Site Schedule (Within 15-20 Days)</option>
                    <option value="Staggered Phase Delivery">Staggered Phase Delivery</option>
                  </select>
                </div>

                {/* Preferred Payment Terms */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <CreditCard size={12} className="text-[#85431E]" /> Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-[#34150F] font-bold focus:outline-none focus:border-[#34150F]"
                  >
                    <option value="Advance against Proforma Invoice">Advance against Proforma Invoice</option>
                    <option value="30% Advance + 70% against Dispatch Advice">30% Advance + 70% against Dispatch Advice</option>
                    <option value="50% Advance + 50% on Delivery">50% Advance + 50% on Delivery</option>
                    <option value="Letter of Credit / Bank Guarantee">Letter of Credit / Bank Guarantee</option>
                    <option value="Pre-approved 30-Day B2B Credit">Pre-approved 30-Day B2B Credit</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <Clock size={12} className="text-[#85431E]" /> Order Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-[#34150F] font-bold focus:outline-none focus:border-[#34150F]"
                  >
                    <option value="LOW">Normal Planning (Low)</option>
                    <option value="MEDIUM">Standard Commercial (Medium)</option>
                    <option value="HIGH">High Priority (Urgent Project)</option>
                    <option value="URGENT">Critical Expedited (Urgent)</option>
                  </select>
                </div>

              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-[#34150F] flex items-center gap-1">
                    <MapPin size={12} className="text-[#85431E]" /> Company Billing Address
                  </label>
                  <textarea
                    rows={2}
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Building name, street, city, state, pincode for GST tax invoice"
                    className="w-full px-3 py-2 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-xs text-[#34150F] focus:outline-none focus:border-[#34150F] resize-none"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#34150F] flex items-center gap-1">
                      <Truck size={12} className="text-[#85431E]" /> Shipping / Site Delivery Address
                    </label>
                    <label className="text-[11px] font-bold text-[#85431E] flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => setSameAsBilling(e.target.checked)}
                        className="rounded accent-[#34150F]"
                      />
                      Same as billing
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    disabled={sameAsBilling}
                    value={sameAsBilling ? billingAddress : shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Project site location, receiver contact person & phone at delivery gate"
                    className="w-full px-3 py-2 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-xs text-[#34150F] focus:outline-none focus:border-[#34150F] resize-none disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* ─── FILE ATTACHMENTS & DOCUMENT DROPZONE ─────────────────────── */}
            <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-[#34150F]/15 shadow-xs space-y-4">
              <div className="border-b border-[#34150F]/10 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                    <Paperclip size={18} className="text-[#85431E]" /> Attach Purchase Order & Technical Drawings
                  </h3>
                  <p className="text-xs text-[#85431E]">
                    Upload your signed company Purchase Order, BOQ spreadsheet, or architectural drawings (PDF, XLSX, DOCX, PNG, JPG up to 25MB).
                  </p>
                </div>
                {activeMode === "CUSTOM_PDF_UPLOAD" && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-300">
                    Mandatory for Option 3
                  </span>
                )}
              </div>

              {/* Drag & drop container */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? "border-[#34150F] bg-[#EACEAA]/30"
                    : "border-[#34150F]/25 bg-[#EACEAA]/10 hover:bg-[#EACEAA]/20 hover:border-[#34150F]/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                  className="hidden"
                />
                <div className="space-y-2 max-w-sm mx-auto">
                  <div className="w-12 h-12 bg-[#34150F]/10 text-[#34150F] rounded-full flex items-center justify-center mx-auto">
                    <FileUp size={24} />
                  </div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#34150F]">
                    Drag & Drop your PO files here, or <span className="text-[#85431E] underline">Browse</span>
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#85431E]/70">
                    Supports signed PO (PDF), Excel BOQ, Word, DWG or image files (Up to 10 files, max 25MB each)
                  </p>
                </div>
              </div>

              {/* Uploaded files preview list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-[#85431E] block">
                    Attached Files ({uploadedFiles.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-[#EACEAA]/20 rounded-xl border border-[#34150F]/15 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Paperclip size={14} className="text-[#85431E] shrink-0" />
                          <span className="font-bold text-[#34150F] truncate">{file.name}</span>
                          <span className="text-[10px] text-[#85431E]/70 shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1 transition-colors"
                          title="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes / Special Instructions */}
              <div className="space-y-1 text-xs pt-2">
                <label className="font-bold text-[#34150F]">Special Project Notes / Packing & Tagging Instructions</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify floor-wise packaging requirements, site delivery timings, contact gatekeeper name, or scope details..."
                  className="w-full px-3.5 py-2.5 bg-[#EACEAA]/10 border border-[#34150F]/20 rounded-xl text-xs text-[#34150F] focus:outline-none focus:border-[#34150F] resize-none"
                />
              </div>
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 shadow-xs">
                <AlertCircle size={18} className="shrink-0 text-rose-600" />
                <span className="font-bold">{submitError}</span>
              </div>
            )}

            {/* ─── SUBMISSION SUBMIT BUTTON BAR ──────────────────────────────── */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#34150F]/15 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span className="font-extrabold text-xs sm:text-sm text-[#34150F]">
                    Commercial Execution Guarantee
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#85431E]">
                  Your submission will be immediately routed to the PRC Hardware dispatch & inventory desk.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 min-w-[200px]"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Confirm & Submit PO</span>
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
export default SubmitPoPage;
