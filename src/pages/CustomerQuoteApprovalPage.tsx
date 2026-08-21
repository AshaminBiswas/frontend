import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Building2, CheckCircle2, XCircle, Printer, Download,
  Clock, AlertCircle, ArrowLeft, ShieldCheck, QrCode,
  FileText, Send, RefreshCw, Copy, Check, Edit3, Percent,
  History, X, HelpCircle, Sparkles
} from "lucide-react";
import { quotationService, QuotationDetail } from "../services/quotationService";
import { AsyncActionButton } from "../components/common/AsyncActionButton";

export function CustomerQuoteApprovalPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Customer Decision States
  const [decisionNotes, setDecisionNotes] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState("");
  const [decisionError, setDecisionError] = useState("");

  // Customer Advance % Negotiation / Edit States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAdvancePercent, setEditAdvancePercent] = useState<number>(30);
  const [editRemark, setEditRemark] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");

  // Copy signature hash state
  const [copiedSignature, setCopiedSignature] = useState(false);

  // PDF Download State
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const fetchQuote = async () => {
    if (!token) {
      setErrorMsg("Invalid quotation link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await quotationService.getQuoteByToken(token);
      if (res.success && res.data) {
        setQuote(res.data);
        if (res.data.advancePercentage !== undefined && res.data.advancePercentage !== null) {
          setEditAdvancePercent(res.data.advancePercentage);
        } else if (res.data.customerProposedAdvancePercent !== undefined && res.data.customerProposedAdvancePercent !== null) {
          setEditAdvancePercent(res.data.customerProposedAdvancePercent);
        }
      } else {
        setErrorMsg(res.error?.message || "Quotation not found or link has expired.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load quotation document.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [token]);

  // Handle Customer One-Time Edit Submit
  const handleCustomerEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !quote) return;

    if (editAdvancePercent < 0 || editAdvancePercent > 100 || isNaN(editAdvancePercent)) {
      setEditError("Please enter a valid advance payment percentage between 0% and 100%.");
      return;
    }

    if (!editRemark.trim() || editRemark.trim().length < 10) {
      setEditError("Please provide a mandatory reason/remark of at least 10 characters explaining your requested terms.");
      return;
    }

    setSubmittingEdit(true);
    setEditError("");
    try {
      const res = await quotationService.customerEditQuote(token, {
        advancePercentage: Number(editAdvancePercent),
        remark: editRemark.trim(),
        notes: editNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setQuote(res.data);
        setIsEditModalOpen(false);
        setEditSuccess("Your quotation revision request has been submitted to PRC Hardware estimating team.");
        setDecisionSuccess("");
      } else {
        setEditError(res.error?.message || "Failed to submit quotation revision.");
      }
    } catch (err: any) {
      setEditError(err?.message || "Network error while submitting revision. Please try again.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Accept or Decline
  const handleDecision = async (response: "accepted" | "declined") => {
    if (!token) return;
    setSubmittingDecision(true);
    setDecisionError("");
    try {
      const res = await quotationService.respondToQuote(token, response, decisionNotes.trim());
      if (res.success && res.data) {
        setQuote(res.data);
        setDecisionSuccess(`You have successfully ${response} this quotation.`);
      } else {
        setDecisionError(res.error?.message || "Failed to record response.");
      }
    } catch (err: any) {
      setDecisionError(err?.message || "Network error. Please try again.");
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!token || !quote) return;
    setDownloadingPdf(true);
    setDecisionError("");
    try {
      await quotationService.downloadQuotePdfByToken(token, quote.referenceNo || quote.quoteNumber);
    } catch (err: any) {
      setDecisionError(err?.message || "Failed to download quotation PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopySignature = () => {
    if (quote?.digitalSignature) {
      navigator.clipboard.writeText(quote.digitalSignature);
      setCopiedSignature(true);
      setTimeout(() => setCopiedSignature(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EACEAA]/20 flex items-center justify-center p-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="text-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-[#34150F] mx-auto" />
          <p className="text-xs font-bold text-[#34150F]">Loading Official Quotation Document...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !quote) {
    return (
      <div className="min-h-screen bg-[#EACEAA]/20 py-12 px-4 flex items-center justify-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-md bg-white rounded-3xl p-8 border border-[#34150F]/10 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Quotation Unavailable
          </h2>
          <p className="text-xs text-[#85431E] leading-relaxed">
            {errorMsg || "The quotation document you requested could not be found."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/request-quote")}
            className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow"
          >
            Go to Request Quote
          </button>
        </div>
      </div>
    );
  }

  const isResponded = quote.customerResponse && quote.customerResponse !== "pending";

  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-8 px-4 md:px-8 lg:px-16 print:bg-white print:p-0" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Action Header - Hidden during print */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#85431E] hover:text-[#34150F] font-bold text-xs transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-center gap-3">
            <AsyncActionButton
              mode="download"
              onAction={async () => {
                if (token && quote) {
                  await quotationService.downloadQuotePdfByToken(token, quote.referenceNo || quote.quoteNumber);
                }
              }}
              idleIcon={<Download size={14} />}
              idleLabel="Download Official PDF"
              loadingLabel="Generating PDF…"
              successLabel="Downloaded!"
              className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
              variant="custom"
            />

            <button
              type="button"
              onClick={handlePrint}
              className="bg-white border border-[#34150F]/15 hover:border-[#34150F] text-[#34150F] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Official Printable Quotation Document */}
        <div
          ref={printAreaRef}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#34150F]/10 shadow-xl space-y-8 print:border-none print:shadow-none print:p-4 print:rounded-none"
        >
          {/* Header & Company Brand */}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#34150F]/15 pb-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <img src="/logo.png" alt="PRC Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0" />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D39858] bg-[#D39858]/10 px-2.5 py-0.5 rounded border border-[#D39858]/20">
                  Official Commercial Quotation
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#34150F] mt-1" style={{ fontFamily: "'Gilda Display', serif" }}>
                  PRC Hardware
                </h1>
                <p className="text-xs text-[#85431E] mt-0.5 font-medium">
                  H -3, J.R. COMPLEX GATE NO 4, MELA RAM FARM, MANDOLI, DELHI 110093, INDIA
                </p>
                <p className="text-[11px] text-[#85431E]/70 mt-1 font-mono">
                  GSTIN: 27AABCP1234F1Z9 • support@pacifichardware.com • +91 98765 43210
                </p>
              </div>
            </div>

            {/* Document Metadata */}
            <div className="bg-[#EACEAA]/20 p-4 rounded-2xl border border-[#34150F]/10 text-right space-y-1 min-w-[200px]">
              <div>
                <span className="text-[10px] text-[#85431E] uppercase font-bold block">Quotation Ref No</span>
                <span className="font-mono font-black text-xs text-[#34150F]">{quote.referenceNo}</span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] text-[#85431E] uppercase font-bold block">Date of Issue</span>
                <span className="text-xs font-bold text-[#34150F]">
                  {new Date(quote.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] text-[#85431E] uppercase font-bold block">Status</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-block ${
                  quote.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {quote.status}
                </span>
              </div>
            </div>
          </div>

          {/* Client & Project Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#EACEAA]/10 p-5 rounded-2xl border border-[#34150F]/10 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#85431E] tracking-wider block">Billed To (Client)</span>
              <p className="font-extrabold text-sm text-[#34150F]">{quote.companyName}</p>
              <p className="text-[#34150F] font-semibold">Attn: {quote.firstName} {quote.lastName}</p>
              <p className="font-mono text-[#85431E]">GSTIN: {quote.gstNo}</p>
              <p className="text-[#85431E]">{quote.email} • {quote.phone}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] uppercase font-bold text-[#85431E] tracking-wider block">Project Scope</span>
              <p className="font-extrabold text-sm text-[#34150F]">{quote.projectName}</p>
              {quote.notes && (
                <p className="text-[#85431E] italic text-[11px] leading-relaxed pt-1">
                  "{quote.notes}"
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="overflow-x-auto border border-[#34150F]/10 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#34150F] text-[#EACEAA] font-bold">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">Sl.</th>
                    <th className="py-3 px-4">Hardware Item Description</th>
                    <th className="py-3 px-3 w-16 text-center">Unit</th>
                    <th className="py-3 px-3 w-20 text-center">Qty</th>
                    <th className="py-3 px-4 w-28 text-right">B2B Rate</th>
                    <th className="py-3 px-4 w-32 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#34150F]/10">
                  {quote.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-[#EACEAA]/10">
                      <td className="py-3 px-3 text-center font-bold text-[#85431E]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#34150F]">{item.productNameSnapshot}</p>
                        {item.product?.sku && (
                          <p className="text-[10px] font-mono text-[#85431E]/70">SKU: {item.product.sku}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-[#34150F]">{item.unit}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#34150F]">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#34150F]">
                        ₹{item.rate.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-[#85431E]">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Digital Signature Seal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Digital Signature & QR Verification Seal */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Cryptographic Digital Signature</span>
              </div>

              <div className="flex items-center gap-4">
                {quote.qrCodeData ? (
                  <img
                    src={quote.qrCodeData}
                    alt="Quotation Verification QR"
                    className="w-24 h-24 bg-white p-1 rounded-xl shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                    <QrCode size={36} />
                  </div>
                )}

                <div className="space-y-1 text-[11px] leading-tight">
                  <p className="text-slate-300">
                    <strong>Signed By:</strong> {quote.signedBy || "PRC Hardware Authority"}
                  </p>
                  <p className="text-slate-400">
                    <strong>Timestamp:</strong>{" "}
                    {quote.signedAt
                      ? new Date(quote.signedAt).toLocaleString("en-IN")
                      : new Date().toLocaleString("en-IN")}
                  </p>
                  <p className="text-emerald-400 font-semibold pt-1">
                    ✔ Authenticated & Encoded
                  </p>
                </div>
              </div>

              {quote.digitalSignature && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="truncate max-w-[180px]">SHA256: {quote.digitalSignature}</span>
                  <div className="flex items-center gap-2">
                    <AsyncActionButton
                      mode="copy"
                      onAction={() => {
                        if (quote?.digitalSignature) navigator.clipboard.writeText(quote.digitalSignature);
                      }}
                      idleIcon={<Copy size={12} />}
                      size="icon"
                      className="hover:text-white flex items-center gap-1 shrink-0 text-slate-400"
                      variant="custom"
                      title="Copy Signature Hash"
                    />
                    <AsyncActionButton
                      mode="download"
                      onAction={async () => {
                        if (token && quote) {
                          await quotationService.downloadQuotePdfByToken(token, quote.referenceNo || quote.quoteNumber);
                        }
                      }}
                      idleIcon={<Download size={11} />}
                      idleLabel="PDF"
                      loadingLabel="…"
                      successLabel="✓"
                      className="text-emerald-400 hover:text-emerald-300 font-sans font-bold text-[10px] flex items-center gap-1 ml-1"
                      variant="custom"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Price Calculations Card */}
            {/* Price Calculations Card */}
            <div className="p-5 bg-[#EACEAA]/25 rounded-2xl border border-[#34150F]/15 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#85431E] font-semibold">Basic Amount (Excl. GST)</span>
                <span className="font-mono font-bold text-[#34150F]">₹{quote.basicPrice.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#85431E] font-semibold">GST (18% Flat Rate)</span>
                <span className="font-mono font-bold text-[#34150F]">₹{quote.gstAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#85431E] font-semibold">Shipping & Logistics Cost</span>
                <span className="font-mono font-bold text-[#34150F]">
                  {quote.shippingCost !== null && quote.shippingCost !== undefined
                    ? `₹${quote.shippingCost.toLocaleString("en-IN")}`
                    : "At actual / Included"}
                </span>
              </div>

              <div className="flex items-center justify-between text-base font-extrabold text-[#34150F] pt-3 border-t border-[#34150F]/15">
                <span>Grand Total (INR)</span>
                <span className="font-mono text-lg text-[#85431E]">₹{quote.grandTotal.toLocaleString("en-IN")}</span>
              </div>

              {/* Advance Payment Requirement Display */}
              <div className="pt-2 border-t border-[#34150F]/15 bg-[#EACEAA]/30 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[#34150F] font-bold block flex items-center gap-1.5">
                    <Percent size={13} className="text-[#D39858]" />
                    <span>Advance Payment Terms</span>
                  </span>
                  <span className="text-[10px] text-[#85431E]">
                    {quote.advancePercentage !== null && quote.advancePercentage !== undefined
                      ? "Configured by PRC Estimating Team"
                      : "Standard B2B Commercial Terms"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-xs text-[#85431E] bg-white px-2 py-0.5 rounded border border-[#34150F]/15 inline-block">
                    {quote.advancePercentage !== null && quote.advancePercentage !== undefined
                      ? `${quote.advancePercentage}%`
                      : "30%"}
                  </span>
                  <span className="block font-mono font-bold text-[11px] text-[#34150F] mt-0.5">
                    ₹{Math.round(
                      quote.grandTotal *
                        ((quote.advancePercentage !== null && quote.advancePercentage !== undefined
                          ? quote.advancePercentage
                          : 30) /
                          100)
                    ).toLocaleString("en-IN")}{" "}
                    Deposit
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Footer */}
          <div className="text-[10px] text-[#85431E]/70 space-y-1 pt-4 border-t border-[#34150F]/10 leading-relaxed">
            <p className="font-bold text-[#34150F] uppercase">Commercial Terms & Conditions:</p>
            <p>1. Prices are valid for 30 days from date of issue.</p>
            <p>
              2. Payment terms:{" "}
              <strong>
                {quote.advancePercentage !== null && quote.advancePercentage !== undefined
                  ? `${quote.advancePercentage}%`
                  : "30%"}{" "}
                advance
              </strong>{" "}
              against proforma invoice before dispatch.
            </p>
            <p>3. Dispatch timelines commence after technical approval of dimensions.</p>
          </div>
        </div>

        {/* Customer Under Review Banner for Revisions */}
        {quote.status === "UNDER_REVIEW" && quote.customerProposedAdvancePercent !== null && quote.customerProposedAdvancePercent !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6 shadow-sm space-y-2 text-xs text-blue-950 print:hidden">
            <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
              <Clock size={18} className="text-blue-600 shrink-0" />
              <span>Quotation Revision Under Estimating Review</span>
            </div>
            <p className="text-blue-800 leading-relaxed">
              Your requested terms revision (Proposed Advance: <strong>{quote.customerProposedAdvancePercent}%</strong>) has been submitted for quotation <strong>{quote.referenceNo}</strong>. Our commercial hardware team is reviewing your requested terms. Quotation number remains unchanged.
            </p>
            {quote.customerEditRemark && (
              <div className="bg-white/80 p-3 rounded-xl border border-blue-100 text-blue-900 mt-2">
                <span className="font-bold text-[10px] uppercase text-blue-600 block">Your Stated Reason:</span>
                <p className="italic text-xs pt-0.5">"{quote.customerEditRemark}"</p>
              </div>
            )}
          </div>
        )}

        {/* Customer Approval / Negotiation Box - Hidden in Print */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#34150F]/10 shadow-lg space-y-5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#34150F]/10 pb-4">
            <h3 className="text-base font-bold text-[#34150F] flex items-center gap-2">
              <Send size={18} className="text-[#D39858]" />
              <span>Customer Response & Acceptance</span>
            </h3>

            {/* Advance % Negotiation Action Button */}
            {quote.status === "APPROVED" && (quote.canCustomerEdit || (!quote.customerEditCount && quote.customerResponse === "pending")) && (
              <button
                type="button"
                onClick={() => {
                  setEditError("");
                  setIsEditModalOpen(true);
                }}
                className="bg-[#EACEAA]/40 hover:bg-[#D39858] text-[#34150F] font-bold text-xs px-4 py-2 rounded-xl transition-all border border-[#34150F]/15 flex items-center gap-1.5 shadow-sm"
              >
                <Edit3 size={14} className="text-[#85431E]" />
                <span>Change Advance % / Propose Terms</span>
              </button>
            )}
          </div>

          {editSuccess && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
              <span>{editSuccess}</span>
            </div>
          )}

          {decisionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{decisionSuccess}</span>
            </div>
          )}

          {decisionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{decisionError}</span>
            </div>
          )}

          {isResponded ? (
            <div className="p-5 bg-[#EACEAA]/20 rounded-2xl border border-[#34150F]/10 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                {quote.customerResponse === "accepted" ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 font-extrabold text-sm">
                    <CheckCircle2 size={16} /> Quotation Accepted
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1.5 font-extrabold text-sm">
                    <XCircle size={16} /> Quotation Declined
                  </span>
                )}
                {quote.customerResponseAt && (
                  <span className="text-[11px] text-[#85431E]">
                    on {new Date(quote.customerResponseAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              {quote.customerResponseNotes && (
                <p className="text-xs text-[#34150F] bg-white p-3 rounded-xl border border-[#34150F]/10 italic">
                  "{quote.customerResponseNotes}"
                </p>
              )}

              {quote.customerResponse === "accepted" && (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/purchase-orders/create?quoteNumber=${encodeURIComponent(quote.referenceNo)}&quoteId=${encodeURIComponent(quote.id)}`}
                    className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    <FileText size={15} />
                    <span>Submit Official Purchase Order (PO) →</span>
                  </Link>
                  <Link
                    to="/purchase-orders"
                    className="bg-[#EACEAA]/40 hover:bg-[#D39858]/30 text-[#34150F] font-bold text-xs px-4 py-3 rounded-xl transition-all border border-[#34150F]/15 flex items-center gap-2"
                  >
                    <span>View All Purchase Orders</span>
                  </Link>
                </div>
              )}

              <p className="text-[11px] text-[#85431E]/80 pt-1">
                Your response is locked in our central order processing pipeline. For further scope revisions, you can adjust line items during PO submission or contact support@pacifichardware.com.
              </p>
            </div>
          ) : quote.status === "APPROVED" ? (
            <div className="space-y-4">
              {/* Advance Payment Notice Box */}
              <div className="p-4 bg-[#EACEAA]/20 rounded-2xl border border-[#34150F]/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#34150F] block">
                    Advance Payment Required:{" "}
                    <span className="text-[#85431E] font-extrabold text-sm">
                      {quote.advancePercentage !== null && quote.advancePercentage !== undefined
                        ? `${quote.advancePercentage}%`
                        : "30%"}
                    </span>
                  </span>
                  <span className="text-[11px] text-[#85431E]">
                    An advance deposit of ₹
                    {Math.round(
                      quote.grandTotal *
                        ((quote.advancePercentage !== null && quote.advancePercentage !== undefined
                          ? quote.advancePercentage
                          : 30) /
                          100)
                    ).toLocaleString("en-IN")}{" "}
                    is required against proforma invoice upon PO submission.
                  </span>
                </div>

                {quote.customerEditCount !== undefined && quote.customerEditCount > 0 && (
                  <span className="text-[10px] font-bold text-[#85431E] bg-[#EACEAA]/50 px-2.5 py-1 rounded-lg border border-[#34150F]/10">
                    One-time revision limit reached
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#34150F]">Optional Remarks / PO Number</label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Specify official PO number, delivery site contact, or notes for order execution..."
                  className="w-full px-4 py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F] resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecision("accepted")}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>Accept Quotation & Proceed</span>
                </button>

                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecision("declined")}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  <span>Decline Quotation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
              <Clock size={16} className="text-amber-600 shrink-0" />
              <span>
                This quotation is currently in <strong>{quote.status}</strong> status. Once finalized and digitally signed by our estimation department, you will be able to record your acceptance or negotiate terms here.
              </span>
            </div>
          )}
        </div>

        {/* ─── REVISION HISTORY & AUDIT TRAIL ─── */}
        {quote.revisions && quote.revisions.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#34150F]/10 shadow-lg space-y-4 print:hidden">
            <h3 className="text-base font-bold text-[#34150F] flex items-center gap-2">
              <History size={18} className="text-[#D39858]" />
              <span>Quotation Revision History</span>
            </h3>

            <div className="space-y-3">
              {quote.revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-[#EACEAA]/15 border border-[#34150F]/10 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#34150F]">
                      {rev.changedBy === "CUSTOMER" ? "Client Proposed Terms Revision" : "Admin Approved Terms"}
                    </span>
                    <span className="text-[11px] text-[#85431E]">
                      {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {rev.remark && (
                    <p className="text-xs text-[#34150F] bg-white p-2.5 rounded-xl border border-[#34150F]/10 italic">
                      "{rev.remark}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#85431E]">
                    {rev.previousValues?.advancePercentage !== undefined && (
                      <span>
                        Previous Advance: <strong>{rev.previousValues.advancePercentage}%</strong>
                      </span>
                    )}
                    {rev.newValues?.customerProposedAdvancePercent !== undefined && (
                      <span>
                        Proposed Advance:{" "}
                        <strong className="text-amber-800">
                          {rev.newValues.customerProposedAdvancePercent}%
                        </strong>
                      </span>
                    )}
                    {rev.newValues?.advancePercentage !== undefined && (
                      <span>
                        Final Advance:{" "}
                        <strong className="text-emerald-800">
                          {rev.newValues.advancePercentage}%
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: CUSTOMER ONE-TIME ADVANCE % NEGOTIATION ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#34150F]/15 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#34150F]/10 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D39858] bg-[#D39858]/10 px-2 py-0.5 rounded border border-[#D39858]/20">
                  One-Time Revision Request
                </span>
                <h3 className="text-lg font-black text-[#34150F] mt-1" style={{ fontFamily: "'Gilda Display', serif" }}>
                  Propose Advance % Terms
                </h3>
                <p className="text-xs text-[#85431E] font-mono">Ref: {quote.referenceNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-[#85431E] hover:text-[#34150F] hover:bg-[#EACEAA]/30 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                You are allowed <strong>exactly one revision</strong> for this quotation after admin approval. Your quotation number (<strong>{quote.referenceNo}</strong>) will remain unchanged.
              </p>
            </div>

            {editError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleCustomerEditSubmit} className="space-y-4 text-xs">
              {/* Advance Percentage Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#34150F] block">
                  Proposed Advance Payment Percentage (0% – 100%) <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      required
                      value={editAdvancePercent}
                      onChange={(e) => setEditAdvancePercent(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 20"
                      className="w-full px-4 py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl font-mono font-bold text-sm text-[#34150F] focus:outline-none focus:border-[#34150F]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#85431E]">%</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#EACEAA]/20 rounded-xl border border-[#34150F]/10 flex items-center justify-between text-[11px]">
                  <span className="text-[#85431E]">Estimated Initial Deposit:</span>
                  <span className="font-mono font-extrabold text-[#34150F]">
                    ₹{Math.round(quote.grandTotal * (editAdvancePercent / 100)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Mandatory Reason / Remark */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#34150F] block">
                  Mandatory Reason / Remark <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                  placeholder="Explain why you are requesting this advance percentage (min 10 characters)..."
                  className="w-full px-4 py-2.5 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F] resize-none"
                />
                <span className="text-[10px] text-[#85431E]/70 block text-right">
                  {editRemark.length}/10 chars minimum
                </span>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#34150F] block">Additional Notes (Optional)</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Preferred delivery site contact or project timeline..."
                  className="w-full px-4 py-2 bg-[#EACEAA]/15 border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#34150F]/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-[#EACEAA]/30 text-[#34150F] font-bold rounded-xl hover:bg-[#EACEAA]/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit || editRemark.trim().length < 10}
                  className="px-6 py-2.5 bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{submittingEdit ? "Submitting Revision..." : "Submit Revision"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
