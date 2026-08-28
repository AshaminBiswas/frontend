import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText, Plus, Search, Eye, CheckCircle2,
  Clock, AlertCircle, RefreshCw, ArrowRight, Building2,
  ShieldCheck, ExternalLink, QrCode, LocateFixed
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { isB2BUser } from "../../utils/pricing";
import { quotationService, TrackedQuotationSummary } from "../../services/quotationService";
import { QuotationTrackingModal } from "./QuotationTrackingModal";

interface B2BQuotationManagerProps {
  onGoToProfileEdit?: () => void;
}

export function B2BQuotationManager({ onGoToProfileEdit }: B2BQuotationManagerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isB2B = isB2BUser(user);

  const [quotes, setQuotes] = useState<TrackedQuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Tracking Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingInitialQuery, setTrackingInitialQuery] = useState("");

  const handleOpenTracking = (refQuery = "") => {
    setTrackingInitialQuery(refQuery);
    setIsTrackingModalOpen(true);
  };

  // Load user's quotes via email or GSTIN
  const fetchMyQuotes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const identifier = user.email || user.gstin || user.phone || "";
      if (!identifier) {
        setQuotes([]);
        setLoading(false);
        return;
      }

      const res = await quotationService.trackQuotes(identifier);
      if (res.success && Array.isArray(res.data)) {
        setQuotes(res.data);
      } else {
        setQuotes([]);
      }
    } catch {
      setErrorMsg("Failed to load quotations. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyQuotes();
  }, [user]);

  // Filtered list
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesStatus = selectedStatus === "ALL" || q.status === selectedStatus;
      const qLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !qLower ||
        q.referenceNo?.toLowerCase().includes(qLower) ||
        q.projectName?.toLowerCase().includes(qLower) ||
        q.companyName?.toLowerCase().includes(qLower);
      return matchesStatus && matchesSearch;
    });
  }, [quotes, selectedStatus, searchQuery]);

  // If user is not B2B
  if (!isB2B) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl p-8 border border-[#34150F]/10 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-[#34150F]/10 text-[#34150F] rounded-2xl flex items-center justify-center mx-auto">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold font-serif text-[#34150F]">Commercial Project Quotations</h3>
          <p className="text-xs text-[#85431E] max-w-md mx-auto leading-relaxed">
            Custom bulk quotation requests and volume pricing are available for commercial and trade partners. You can also track an existing RFQ anytime.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenTracking()}
              className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow flex items-center gap-2"
            >
              <Clock size={14} />
              <span>Track Existing Quotation</span>
            </button>
            <button
              type="button"
              onClick={onGoToProfileEdit}
              className="bg-[#EACEAA]/30 text-[#34150F] font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#EACEAA]/60 transition-all border border-[#34150F]/15"
            >
              Update Profile to B2B Account
            </button>
          </div>
        </div>

        <QuotationTrackingModal
          isOpen={isTrackingModalOpen}
          onClose={() => setIsTrackingModalOpen(false)}
          initialQuery={trackingInitialQuery}
          userQuotes={quotes}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Top Banner & Quick RFQ / Tracking Action Buttons */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-[#34150F]/10 shadow-2xs flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#D39858] uppercase tracking-wider">
            <ShieldCheck size={13} />
            <span>Verified B2B Account</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-[#34150F] mt-0.5" style={{ fontFamily: "'Gilda Display', serif" }}>
            Commercial Project Quotations
          </h2>
          <p className="text-[11px] sm:text-xs text-[#85431E] mt-0.5">
            Manage your requests for quotation (RFQ), live tracking, estimates, and project scope approvals.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Quotation Tracking Button */}
          <button
            type="button"
            onClick={() => handleOpenTracking()}
            className="bg-[#EACEAA]/40 hover:bg-[#D39858]/25 text-[#34150F] border border-[#34150F]/20 font-bold text-[11px] sm:text-xs px-3.5 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Track Quotation Status"
          >
            <Clock size={13} className="text-[#85431E]" />
            <span>Track Quotation</span>
          </button>

          {/* Create New RFQ */}
          <Link
            to="/request-quote"
            className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-[11px] sm:text-xs px-3.5 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Create New RFQ</span>
          </Link>

          <button
            type="button"
            onClick={fetchMyQuotes}
            className="p-2 sm:p-3 bg-[#EACEAA]/20 hover:bg-[#EACEAA]/40 text-[#34150F] rounded-lg sm:rounded-xl transition-colors"
            title="Refresh Quotes"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#34150F]/10 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#85431E]">Total RFQs</span>
          <p className="text-base sm:text-xl font-black text-[#34150F] mt-0.5">{quotes.length}</p>
        </div>
        <div
          onClick={() => setSelectedStatus("PENDING")}
          className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#34150F]/10 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-700">Pending Review</span>
          <p className="text-base sm:text-xl font-black text-amber-700 mt-0.5">
            {quotes.filter((q) => q.status === "PENDING" || q.status === "UNDER_REVIEW").length}
          </p>
        </div>
        <div
          onClick={() => setSelectedStatus("APPROVED")}
          className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#34150F]/10 shadow-2xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-700">Approved</span>
          <p className="text-base sm:text-xl font-black text-emerald-700 mt-0.5">
            {quotes.filter((q) => q.status === "APPROVED").length}
          </p>
        </div>
        <div
          onClick={() => setSelectedStatus("REJECTED")}
          className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#34150F]/10 shadow-2xs cursor-pointer hover:border-rose-400 transition-colors"
        >
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-rose-700">Declined</span>
          <p className="text-base sm:text-xl font-black text-rose-700 mt-0.5">
            {quotes.filter((q) => q.status === "REJECTED").length}
          </p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-[#34150F]/10 shadow-2xs space-y-2 sm:space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 bg-[#EACEAA]/20 p-1 rounded-lg sm:rounded-xl overflow-x-auto no-scrollbar">
            {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg transition-all ${
                  selectedStatus === status
                    ? "bg-[#34150F] text-[#EACEAA] shadow-2xs"
                    : "text-[#85431E] hover:text-[#34150F]"
                }`}
              >
                {status === "ALL" ? "All" : status.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[150px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quotes by reference or project..."
              className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-[#EACEAA]/10 border border-[#34150F]/15 rounded-lg sm:rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F]"
            />
          </div>
        </div>
      </div>

      {/* Quotes Cards List */}
      {loading ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-[#34150F]/10">
          <RefreshCw size={20} className="animate-spin text-[#34150F] mx-auto mb-2" />
          <p className="text-xs font-bold text-[#34150F]">Loading quotations...</p>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-[#34150F]/10 space-y-2 sm:space-y-3">
          <FileText size={30} className="mx-auto text-[#85431E]/30" />
          <h4 className="text-sm sm:text-base font-bold text-[#34150F]">No Quotations Found</h4>
          <p className="text-[11px] sm:text-xs text-[#85431E] max-w-sm mx-auto">
            You haven't submitted any RFQs yet, or no quotes match your active filter.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleOpenTracking()}
              className="inline-flex items-center gap-1.5 bg-[#EACEAA]/30 text-[#34150F] font-bold text-xs px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl hover:bg-[#EACEAA]/60 transition-all border border-[#34150F]/15"
            >
              <Clock size={13} /> Track with Reference No
            </button>
            <Link
              to="/request-quote"
              className="inline-flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold text-xs px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-2xs"
            >
              <Plus size={13} /> Submit New Quotation
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-4">
          {filteredQuotes.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl sm:rounded-3xl p-3.5 sm:p-6 border border-[#34150F]/10 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5 sm:space-y-4"
            >
              {/* Quotation Header */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#34150F]/10 pb-2">
                <div>
                  <span className="font-mono font-black text-xs text-[#34150F]">{q.referenceNo}</span>
                  <p className="text-[11px] font-bold text-[#85431E]">{q.projectName}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    q.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : q.status === "REJECTED"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : q.status === "UNDER_REVIEW"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    {q.status.replace("_", " ")}
                  </span>
                  {q.hasDigitalSignature && (
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-0.5">
                      <QrCode size={11} /> Signed
                    </span>
                  )}
                </div>
              </div>

              {/* Items & Values Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] sm:text-xs">
                <div>
                  <span className="text-[9.5px] text-[#85431E]/70 uppercase font-semibold">Scope / Items</span>
                  <p className="font-bold text-[#34150F]">{q.itemCount} Hardware Item(s)</p>
                </div>
                <div>
                  <span className="text-[9.5px] text-[#85431E]/70 uppercase font-semibold">Date Submitted</span>
                  <p className="font-bold text-[#34150F]">
                    {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <span className="text-[9.5px] text-[#85431E]/70 uppercase font-semibold">Basic Price</span>
                  <p className="font-bold text-[#34150F]">₹{q.basicPrice.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <span className="text-[9.5px] text-[#85431E]/70 uppercase font-semibold">Grand Total</span>
                  <p className="font-extrabold text-[#85431E] text-xs sm:text-sm">₹{q.grandTotal.toLocaleString("en-IN")}</p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#34150F]/5">
                <div className="text-[10.5px] sm:text-[11px] text-[#85431E]">
                  {q.status === "APPROVED" ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Finalized with B2B volume rates
                    </span>
                  ) : q.status === "UNDER_REVIEW" ? (
                    <span className="text-blue-700 font-bold flex items-center gap-1">
                      <Clock size={12} /> Estimator actively verifying custom pricing
                    </span>
                  ) : q.statusReason ? (
                    <span className="text-amber-800 italic">Note: {q.statusReason}</span>
                  ) : (
                    <span>Awaiting estimator review.</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Track Status Button triggers live tracking modal */}
                  <button
                    type="button"
                    onClick={() => handleOpenTracking(q.referenceNo)}
                    className="bg-[#EACEAA]/30 hover:bg-[#EACEAA]/60 text-[#34150F] font-bold text-[10.5px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Clock size={12} />
                    <span>Track Status</span>
                  </button>

                  {q.status === "APPROVED" && q.accessToken && (
                    <Link
                      to={`/quote/${q.accessToken}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] sm:text-xs px-3 sm:px-4 py-1.5 rounded-lg sm:rounded-xl transition-all shadow-2xs flex items-center gap-1"
                    >
                      <Eye size={12} />
                      <span>View & Accept</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reusable Universal Quotation Tracking Modal */}
      <QuotationTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        initialQuery={trackingInitialQuery}
        userQuotes={quotes}
      />
    </div>
  );
}
