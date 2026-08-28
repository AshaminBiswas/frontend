import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search, Clock, CheckCircle2, AlertCircle, X,
  Building2, FileText, Download, Eye, QrCode,
  ShieldCheck, RefreshCw, Copy, Check, ChevronRight,
  Package, ArrowRight, Layers
} from "lucide-react";
import { quotationService, TrackedQuotationSummary } from "../../services/quotationService";
import { useAuth } from "../../context/AuthContext";
import { AsyncActionButton } from "../common/AsyncActionButton";

interface QuotationTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  userQuotes?: TrackedQuotationSummary[];
}

const STAGES = [
  { key: "PENDING", label: "Submitted", desc: "RFQ Logged into System" },
  { key: "UNDER_REVIEW", label: "Under Review", desc: "Estimator Technical Verification" },
  { key: "APPROVED", label: "Approved & Signed", desc: "B2B Volume Rates Finalized" },
  { key: "CONVERTED", label: "Order Converted", desc: "Accepted & Production" },
];

function getStageIndex(status: string, customerResponse?: string): number {
  if (status === "REJECTED") return -1;
  if (customerResponse === "accepted" || status === "CONVERTED") return 3;
  if (status === "APPROVED") return 2;
  if (status === "UNDER_REVIEW") return 1;
  return 0; // PENDING
}

export function QuotationTrackingModal({
  isOpen,
  onClose,
  initialQuery = "",
  userQuotes = [],
}: QuotationTrackingModalProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [trackedQuotes, setTrackedQuotes] = useState<TrackedQuotationSummary[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<TrackedQuotationSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // In-progress quotes (PENDING & UNDER_REVIEW)
  const pendingAndUnderReviewQuotes = useMemo(() => {
    return userQuotes.filter(
      (q) => q.status === "PENDING" || q.status === "UNDER_REVIEW"
    );
  }, [userQuotes]);

  // Filtered auto-suggestions based on search input
  const suggestions = useMemo(() => {
    if (!query.trim()) {
      return pendingAndUnderReviewQuotes;
    }
    const qLower = query.toLowerCase().trim();
    return userQuotes.filter((q) => {
      return (
        q.referenceNo?.toLowerCase().includes(qLower) ||
        q.projectName?.toLowerCase().includes(qLower) ||
        q.companyName?.toLowerCase().includes(qLower) ||
        q.status?.toLowerCase().includes(qLower)
      );
    });
  }, [query, pendingAndUnderReviewQuotes, userQuotes]);

  // When modal opens with initialQuery, auto-run search
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
        runTracking(initialQuery);
      } else if (user) {
        const identifier = user.email || user.gstin || user.phone || "";
        if (identifier && userQuotes.length === 0) {
          runTracking(identifier, false);
        }
      }
    } else {
      setSelectedQuote(null);
      setSearchError("");
    }
  }, [isOpen, initialQuery]);

  // Handle click outside suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsInputFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const runTracking = async (searchTarget: string, autoSelectFirst = true) => {
    const target = searchTarget.trim();
    if (!target) return;

    setIsSearching(true);
    setSearchError("");
    setHasSearched(true);
    setIsInputFocused(false);

    try {
      const res = await quotationService.trackQuotes(target);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setTrackedQuotes(res.data);
        if (autoSelectFirst || res.data.length === 1) {
          setSelectedQuote(res.data[0]);
        }
      } else {
        setTrackedQuotes([]);
        setSelectedQuote(null);
        setSearchError("No quotations found matching your query. Please check your reference number.");
      }
    } catch {
      setTrackedQuotes([]);
      setSelectedQuote(null);
      setSearchError("Unable to reach quotation tracking server. Please check your connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (quote: TrackedQuotationSummary) => {
    setQuery(quote.referenceNo);
    setSelectedQuote(quote);
    setIsInputFocused(false);
    setHasSearched(true);
    setSearchError("");
    if (!trackedQuotes.some((q) => q.id === quote.id)) {
      setTrackedQuotes([quote, ...trackedQuotes]);
    }
  };

  const handleCopyRef = (refNo: string) => {
    navigator.clipboard.writeText(refNo);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-[#34150F]/15 w-full max-w-3xl max-h-[92vh] flex flex-col my-4 overflow-hidden animate-fadeIn"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        {/* ─── Modal Header ─── */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-[#34150F]/10 bg-[#34150F] text-[#EACEAA] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D39858]/20 flex items-center justify-center text-[#D39858]">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold" style={{ fontFamily: "'Gilda Display', serif" }}>
                Live Quotation Tracking
              </h3>
              <p className="text-[11px] text-[#EACEAA]/70">
                Track estimator review, B2B pricing finalization, and digital signatures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#EACEAA]/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Modal Body ─── */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Search Bar with Auto-Suggestions on Focus */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-[#85431E] uppercase tracking-wider mb-1.5">
              Enter Quotation Reference No, Email, Phone, or GSTIN
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runTracking(query);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsInputFocused(true);
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  placeholder="e.g. PRC-QT-2026-27/001 or click to see pending quotes..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/20 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/50 focus:outline-none focus:border-[#34150F] font-medium"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setIsInputFocused(true);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85431E]/50 hover:text-[#34150F]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shrink-0"
              >
                {isSearching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                <span>Track</span>
              </button>
            </form>

            {/* ─── Auto-Suggestions Dropdown on Focus / Click ─── */}
            {isInputFocused && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#34150F]/15 shadow-xl max-h-64 overflow-y-auto z-50 p-2 space-y-1 animate-fadeIn"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#85431E] uppercase tracking-wider border-b border-[#34150F]/5 flex items-center justify-between">
                  <span>
                    {!query.trim() ? "Active Quotations (Pending / Under Review)" : `Matching Quotations (${suggestions.length})`}
                  </span>
                  <span className="text-[9px] text-[#85431E]/60 font-normal">Click to track</span>
                </div>

                {suggestions.map((quote) => {
                  return (
                    <button
                      key={quote.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(quote)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EACEAA]/25 text-left transition-colors group"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#34150F] group-hover:text-[#85431E]">
                            {quote.referenceNo}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase ${
                              quote.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : quote.status === "UNDER_REVIEW"
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {quote.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-[#85431E] truncate">{quote.projectName}</p>
                        <p className="text-[10px] text-[#85431E]/60">
                          {quote.companyName} • {quote.itemCount || quote.items?.length || 0} items
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-[#34150F] block">
                          ₹{Number(quote.grandTotal || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] text-[#85431E]/60">
                          {new Date(quote.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0 text-rose-500" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Multiple Quotes Selector (if search returned multiple quotes by email/GSTIN) */}
          {trackedQuotes.length > 1 && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-[#85431E] uppercase tracking-wider">
                Select Quotation from Search Results ({trackedQuotes.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {trackedQuotes.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuote(q)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedQuote?.id === q.id
                        ? "bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-sm"
                        : "bg-white hover:bg-[#EACEAA]/20 border-[#34150F]/15 text-[#34150F]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs">{q.referenceNo}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase bg-white/20">
                        {q.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold truncate mt-0.5">{q.projectName}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">₹{q.grandTotal.toLocaleString("en-IN")}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Selected Quotation Full Live Tracking View ─── */}
          {selectedQuote && (
            <div className="space-y-5 animate-fadeIn">
              {/* Reference Banner */}
              <div className="p-4 rounded-2xl bg-[#EACEAA]/25 border border-[#34150F]/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#85431E] uppercase">Quotation Ref:</span>
                    <span className="font-mono font-extrabold text-sm text-[#34150F]">{selectedQuote.referenceNo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyRef(selectedQuote.referenceNo)}
                      className="p-1 rounded text-[#85431E] hover:text-[#34150F] hover:bg-white/50 transition-colors"
                      title="Copy Reference Number"
                    >
                      {copiedRef ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-[#34150F] mt-0.5">{selectedQuote.projectName}</h4>
                  <p className="text-[11px] text-[#85431E]">
                    {selectedQuote.companyName} • {selectedQuote.clientName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase shadow-xs ${
                      selectedQuote.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : selectedQuote.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : selectedQuote.status === "UNDER_REVIEW"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {selectedQuote.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* ─── 4-Stage Interactive Stepper ─── */}
              <div className="bg-[#EACEAA]/15 p-4 sm:p-5 rounded-2xl border border-[#34150F]/10">
                <div className="mb-3 text-[10px] font-bold text-[#85431E] uppercase tracking-wider flex items-center justify-between">
                  <span>Current Quotation Progress</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck size={12} /> Live Status
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {STAGES.map((stage, idx) => {
                    const currentIdx = getStageIndex(selectedQuote.status, selectedQuote.customerResponse);
                    const isDone = idx <= currentIdx && selectedQuote.status !== "REJECTED";
                    const isCurrent = idx === currentIdx && selectedQuote.status !== "REJECTED";

                    return (
                      <div
                        key={stage.key}
                        className={`p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-white border-[#34150F] shadow-sm ring-2 ring-[#D39858]/30"
                            : isDone
                            ? "bg-emerald-50/70 border-emerald-300"
                            : "bg-white/40 border-[#34150F]/10 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isDone
                                ? "bg-emerald-600 text-white"
                                : isCurrent
                                ? "bg-[#34150F] text-[#EACEAA]"
                                : "bg-[#85431E]/20 text-[#85431E]"
                            }`}
                          >
                            {isDone ? <Check size={10} /> : idx + 1}
                          </div>
                          <span className={`text-[11px] font-bold ${isCurrent ? "text-[#34150F]" : "text-[#85431E]"}`}>
                            {stage.label}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-[#85431E]/70 leading-snug">{stage.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Note / Estimator Notice */}
              {selectedQuote.status === "PENDING" && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                  <Clock size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">RFQ Queued for Technical Estimation</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Your bill of quantities is logged. An estimator will verify architectural fittings and apply wholesale volume rates within 24 business hours.
                    </p>
                  </div>
                </div>
              )}

              {selectedQuote.status === "UNDER_REVIEW" && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-2">
                  <Layers size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">Active Estimator Review in Progress</p>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      {selectedQuote.statusReason || "Our engineering team is actively evaluating custom dimensions, finish specifications, and project freight."}
                    </p>
                  </div>
                </div>
              )}

              {selectedQuote.status === "APPROVED" && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-xs">Quotation Approved &amp; Digitally Signed</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Your customized quotation has been finalized with verified wholesale rates. You can review the scope or download the official PDF.
                    </p>
                  </div>
                </div>
              )}

              {/* Items Summary Table */}
              {selectedQuote.items && selectedQuote.items.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#34150F]">
                    <span>Scope &amp; Bill of Quantities ({selectedQuote.items.length} Items)</span>
                    <span>Basic Total: ₹{selectedQuote.basicPrice.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="border border-[#34150F]/10 rounded-xl overflow-hidden bg-white">
                    <div className="max-h-48 overflow-y-auto divide-y divide-[#34150F]/5">
                      {selectedQuote.items.map((item, idx) => (
                        <div key={item.id || idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-[#EACEAA]/10 text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-[#34150F] truncate">{item.productNameSnapshot}</p>
                            <p className="text-[10px] text-[#85431E]/70 font-mono">
                              Qty: {item.quantity} {item.unit || "NOS"} @ ₹{Number(item.rate || 0).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-xs text-[#34150F] shrink-0">
                            ₹{Number(item.amount || item.total || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="p-3.5 bg-[#EACEAA]/20 rounded-xl border border-[#34150F]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[#85431E] block text-[10px]">Estimated Taxes (GST 18%)</span>
                  <span className="font-mono font-bold text-[#34150F]">₹{selectedQuote.gstAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#85431E] block text-[10px] font-bold uppercase">Estimated Grand Total</span>
                  <span className="font-mono font-extrabold text-sm sm:text-base text-[#85431E]">
                    ₹{selectedQuote.grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#34150F]/10 flex flex-wrap items-center justify-end gap-2.5">
                {selectedQuote.status === "APPROVED" && selectedQuote.accessToken ? (
                  <>
                    <AsyncActionButton
                      mode="download"
                      onAction={() => quotationService.downloadQuotePdfByToken(selectedQuote.accessToken!, selectedQuote.referenceNo)}
                      idleIcon={<Download size={13} />}
                      idleLabel="Download Signed PDF"
                      loadingLabel="Preparing PDF…"
                      successLabel="Downloaded!"
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors border border-emerald-300"
                      variant="custom"
                    />
                    <Link
                      to={`/quote/${selectedQuote.accessToken}`}
                      onClick={onClose}
                      className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Eye size={13} />
                      <span>View &amp; Accept Quotation</span>
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#34150F] text-[#EACEAA] font-bold text-xs rounded-xl hover:bg-[#85431E] transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuotationTrackingModal;
