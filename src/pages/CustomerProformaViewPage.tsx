import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2, CheckCircle2, XCircle, Printer, Download,
  Clock, AlertCircle, ArrowLeft, ShieldCheck, QrCode,
  FileText, Send, RefreshCw, Copy, Check, Sparkles,
  CreditCard, Landmark, Phone, Mail, MapPin, Calendar, HelpCircle,
  Upload, Image, Trash2, Paperclip
} from "lucide-react";
import {
  proformaInvoiceService,
  ProformaInvoiceDetail,
  ProformaFeedbackPayload,
} from "../services/proformaInvoiceService";
import { AsyncActionButton } from "../components/common/AsyncActionButton";

export function CustomerProformaViewPage() {
  const { token } = useParams<{ token: string }>();

  const [pi, setPi] = useState<ProformaInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Customer Feedback Form State
  const [feedbackAction, setFeedbackAction] = useState<
    'ACCEPT' | 'PAYMENT_SUBMITTED' | 'REQUEST_CHANGE' | 'QUERY'
  >('ACCEPT');
  const [advanceRef, setAdvanceRef] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [feedbackComments, setFeedbackComments] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  // Copy hash / verification ID state
  const [copiedHash, setCopiedHash] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchPI = async () => {
    if (!token) {
      setErrorMsg("Invalid or missing Proforma Invoice access link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await proformaInvoiceService.getByToken(token);
      if (res.success && res.data) {
        setPi(res.data);
        if (res.data.customerPhone) {
          setContactPhone(res.data.customerPhone);
        }
      } else {
        setErrorMsg(res.error?.message || "Proforma Invoice not found or access token has expired.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load Proforma Invoice document.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPI();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setFeedbackError("File size must be less than 10MB.");
      return;
    }

    // Validate type
    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();
    const isImageOrPdf =
      fileType.startsWith('image/') ||
      fileType === 'application/pdf' ||
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.webp');

    if (!isImageOrPdf) {
      setFeedbackError("Please upload an Image (PNG, JPG, WEBP) or a PDF receipt document.");
      return;
    }

    setFeedbackError("");
    setReceiptFile(file);

    if (fileType.startsWith('image/') && !fileName.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !pi) return;

    if (!feedbackComments.trim() || feedbackComments.trim().length < 3) {
      setFeedbackError("Please provide your comments or remarks (minimum 3 characters).");
      return;
    }

    if (feedbackAction === 'PAYMENT_SUBMITTED' && (!advanceRef || advanceRef.trim().length < 4)) {
      setFeedbackError("Please enter a valid Bank UTR / IMPS / RTGS Transaction Reference Number.");
      return;
    }

    setSubmittingFeedback(true);
    setFeedbackError("");
    setFeedbackSuccess("");

    try {
      let uploadedReceiptUrl: string | undefined = undefined;

      // Upload receipt file if attached
      if (receiptFile) {
        setUploadingReceipt(true);
        const uploadRes = await proformaInvoiceService.uploadPaymentReceipt(token, receiptFile);
        if (uploadRes.success && uploadRes.data?.receiptUrl) {
          uploadedReceiptUrl = uploadRes.data.receiptUrl;
        } else {
          throw new Error(uploadRes.error?.message || "Failed to upload payment receipt file. Please try again.");
        }
        setUploadingReceipt(false);
      }

      const payload: ProformaFeedbackPayload = {
        action: feedbackAction,
        feedbackComments: feedbackComments.trim(),
        advancePaymentRef: advanceRef.trim() || undefined,
        paymentReceiptUrl: uploadedReceiptUrl,
        contactPhone: contactPhone.trim() || undefined,
        customerName: pi.customerName,
      };

      const res = await proformaInvoiceService.submitFeedback(token, payload);
      if (res.success && res.data) {
        setPi(res.data);
        setFeedbackSuccess(res.message || "Feedback & advance payment details submitted successfully. PRC Hardware commercial desk has been notified.");
        setFeedbackComments("");
        setAdvanceRef("");
        setReceiptFile(null);
        setReceiptPreview(null);
      } else {
        setFeedbackError(res.error?.message || "Failed to submit response. Please try again.");
      }
    } catch (err: any) {
      setFeedbackError(err?.message || "Network error while submitting feedback. Please try again.");
    } finally {
      setUploadingReceipt(false);
      setSubmittingFeedback(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!token || !pi) return;
    setDownloadingPdf(true);
    setFeedbackError("");
    try {
      await proformaInvoiceService.downloadPdfByToken(token, pi.piNumber);
    } catch (err: any) {
      setFeedbackError(err?.message || "Failed to download Proforma Invoice PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyHash = () => {
    if (!pi?.documentHash) return;
    navigator.clipboard.writeText(pi.documentHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const formatINR = (val: number | null | undefined) => {
    const n = Number(val || 0);
    return `\u20B9${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EACEAA] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#f5e8d4] p-8 rounded-tr-3xl rounded-bl-3xl border border-[rgba(52,21,15,0.12)] max-w-md shadow-xl flex flex-col items-center space-y-4">
          <RefreshCw className="animate-spin text-[#85431E]" size={36} />
          <h2 className="text-xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Retrieving Commercial Proforma Invoice...
          </h2>
          <p className="text-xs text-[#85431E]">
            Verifying cryptographic authenticity signature and loading line items.
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg || !pi) {
    return (
      <div className="min-h-screen bg-[#EACEAA] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#f5e8d4] p-8 rounded-tr-3xl rounded-bl-3xl border border-red-300 max-w-md shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 border border-red-300 flex items-center justify-center mx-auto text-red-600">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Document Unavailable
          </h2>
          <p className="text-xs text-[#85431E] leading-relaxed">
            {errorMsg || "This Proforma Invoice does not exist or the verification token has expired."}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold text-xs px-5 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md"
            >
              <ArrowLeft size={14} /> Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isSigned = Boolean(pi.digitalSignature && pi.signedBy);
  const isInterstate = Number(pi.igst || 0) > 0;
  const bank = pi.bankDetails || {
    bankName: "HDFC Bank Ltd.",
    accountName: "PRC Hardware",
    accountNumber: "50200012345678",
    ifsc: "HDFC0001234",
    branch: "Mandoli Industrial Area, Delhi",
    upiId: "",
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "APPROVED":
        return { bg: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "Approved & Signed" };
      case "ACCEPTED":
        return { bg: "bg-blue-100 text-blue-800 border-blue-300", label: "Customer Accepted" };
      case "ADVANCE_RECEIVED":
        return { bg: "bg-purple-100 text-purple-800 border-purple-300", label: "Advance Remittance Received" };
      case "CONVERTED_TO_INVOICE":
        return { bg: "bg-teal-100 text-teal-800 border-teal-300", label: "Converted to Tax Invoice" };
      case "CANCELLED":
        return { bg: "bg-red-100 text-red-800 border-red-300", label: "Cancelled / Void" };
      default:
        return { bg: "bg-amber-100 text-amber-800 border-amber-300", label: "Issued & Awaiting Advance" };
    }
  };

  const statusBadge = getStatusBadge(pi.status);

  return (
    <div className="min-h-screen bg-[#EACEAA] py-8 px-4 sm:px-6 lg:px-8 text-[#34150F]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Top Notice: PI Issued by Administration ────────────────────── */}
        <div className="bg-[#fcf8f2] border-l-4 border-[#85431E] rounded-r-2xl p-4 shadow-sm flex items-start gap-3 text-xs text-[#85431E]">
          <HelpCircle size={18} className="shrink-0 text-[#85431E] mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#34150F]">
              Commercial Proforma Invoice (PI) Issued Exclusively by PRC Hardware Administration
            </p>
            <p className="leading-relaxed">
              This document is an advance commercial commitment and technical specification confirmation. You can review all line items, verify the cryptographic authenticity seal, download the official PDF, and submit your acceptance or advance payment transaction reference (UTR) below.
            </p>
          </div>
        </div>

        {/* ── Main Document Container ───────────────────────────────────── */}
        <div className="bg-[#f5e8d4] border border-[rgba(52,21,15,0.14)] rounded-tr-3xl rounded-bl-3xl shadow-xl overflow-hidden">

          {/* Header Banner */}
          <div className="bg-[#0f172a] text-white p-6 sm:p-8 border-b border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold tracking-widest text-xs uppercase">
                    PRC Hardware
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 text-xs">Pacific Products and Solutions</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1" style={{ fontFamily: "'Gilda Display', serif" }}>
                  PROFORMA INVOICE
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Advance Commercial Demand & Specification Confirmation
                </p>
              </div>

              {/* PI Number & Status Card */}
              <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700 flex flex-col items-start md:items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">PI No:</span>
                  <span className="text-sm font-mono font-bold text-amber-400">{pi.piNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Financial Year:</span>
                  <span className="text-xs font-semibold text-slate-200">{pi.financialYear}</span>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>

          {/* ── Cryptographic Authenticity Banner ──────────────────────────── */}
          <div className="bg-[#ffffff] p-4 sm:p-5 border-b border-[rgba(52,21,15,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {pi.qrCodeDataUrl ? (
                <img
                  src={pi.qrCodeDataUrl}
                  alt="PI Verification QR"
                  className="w-16 h-16 rounded-lg border border-slate-200 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <QrCode size={28} />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className={isSigned ? "text-emerald-600" : "text-amber-600"} />
                  <span className="text-xs font-bold text-[#34150F]">
                    {isSigned ? "Cryptographically Signed & Verified Document" : "Official Verification Record"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Verification ID: <span className="text-slate-700 font-semibold">{pi.verificationId}</span>
                </p>
                {pi.signedBy && (
                  <p className="text-[11px] text-slate-500">
                    Authorized Signatory: <span className="text-slate-800 font-medium">{pi.signedBy}</span> ({formatDate(pi.signedAt || pi.createdAt)})
                  </p>
                )}
              </div>
            </div>

            {/* Document Hash & Download Action */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyHash}
                title="Copy Canonical Document Hash"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
              >
                {copiedHash ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedHash ? "Hash Copied!" : `SHA: ${(pi.documentHash || "").slice(0, 10)}...`}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#34150F] hover:bg-[#85431E] text-[#EACEAA] px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-md shrink-0"
              >
                {downloadingPdf ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                <span>Download Official PDF</span>
              </button>

              <a
                href="#payment-receipt-upload"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#85431E] hover:bg-[#6b3517] text-[#EACEAA] px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload Payment Receipt</span>
              </a>
            </div>
          </div>

          {/* ── Metadata & Customer Dossier ────────────────────────────────── */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* 3-Col Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-[rgba(52,21,15,0.08)]">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-[#85431E]" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Issue Date</div>
                  <div className="text-xs font-bold text-[#34150F]">{formatDate(pi.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4 pt-2 sm:pt-0">
                <Clock size={18} className="text-[#85431E]" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Valid Until</div>
                  <div className="text-xs font-bold text-[#34150F]">{formatDate(pi.validUntil)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4 pt-2 sm:pt-0">
                <MapPin size={18} className="text-[#85431E]" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Place of Supply</div>
                  <div className="text-xs font-bold text-[#34150F]">{pi.placeOfSupply || "Karnataka"}</div>
                </div>
              </div>
            </div>

            {/* Billed To & Terms Dossier Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Buyer / Billed To */}
              <div className="bg-white p-5 rounded-2xl border border-[rgba(52,21,15,0.08)] shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#85431E] uppercase tracking-wider">
                  <Building2 size={15} /> Billed To (Buyer)
                </div>
                <div className="text-sm font-bold text-[#34150F]">
                  {pi.companyName || pi.customerName}
                </div>
                {pi.companyName && (
                  <div className="text-xs text-slate-600">Attn: {pi.customerName}</div>
                )}
                {pi.gstin && (
                  <div className="text-xs font-mono font-bold text-[#34150F]">
                    GSTIN: <span className="text-[#85431E]">{pi.gstin}</span>
                  </div>
                )}
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" /> {pi.customerEmail}
                </div>
                {pi.customerPhone && (
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <Phone size={13} className="text-slate-400" /> {pi.customerPhone}
                  </div>
                )}
                {pi.billingAddress && (
                  <div className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Billing Address:</span> {pi.billingAddress}
                  </div>
                )}
              </div>

              {/* Order Terms & Dispatch Schedule */}
              <div className="bg-white p-5 rounded-2xl border border-[rgba(52,21,15,0.08)] shadow-sm space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#85431E] uppercase tracking-wider">
                  <CreditCard size={15} /> Commercial Terms & Schedule
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Terms:</span>
                    <span className="font-bold text-[#85431E]">{Number(pi.advancePercentage)}% Advance, Balance at Dispatch</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery SLA:</span>
                    <span className="font-semibold text-slate-800">{pi.deliveryTimeline || "7-10 Working Days"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax Type:</span>
                    <span className="font-semibold text-slate-800">{isInterstate ? "Interstate IGST (18%)" : "Intrastate CGST (9%) + SGST (9%)"}</span>
                  </div>
                </div>
                {pi.shippingAddress && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Site Delivery:</span> {pi.shippingAddress}
                  </div>
                )}
              </div>
            </div>

            {/* ── Line Items Specification Table ───────────────────────────── */}
            <div className="bg-white rounded-2xl border border-[rgba(52,21,15,0.08)] overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Hardware Specifications & Commercial Line Items</span>
                <span className="text-[11px] text-slate-400 font-normal">{(pi.items || []).length} items listed</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                      <th className="py-3 px-3 text-center">#</th>
                      <th className="py-3 px-4">Item & Specification</th>
                      <th className="py-3 px-3 text-center">HSN</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Rate</th>
                      <th className="py-3 px-4 text-right">Taxable Value</th>
                      <th className="py-3 px-4 text-right">GST</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {(pi.items || []).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#34150F]">{item.productName}</div>
                          <div className="text-[11px] text-slate-500">
                            SKU: <span className="font-mono">{item.sku}</span>
                            {item.description ? ` | ${item.description}` : ""}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600">{item.hsnCode || "8302"}</td>
                        <td className="py-3 px-3 text-center font-bold">{item.quantity} {item.unit || "PCS"}</td>
                        <td className="py-3 px-4 text-right">{formatINR(item.unitRate)}</td>
                        <td className="py-3 px-4 text-right">{formatINR(item.taxableAmount)}</td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {formatINR(Number(item.cgstAmount || 0) + Number(item.sgstAmount || 0) + Number(item.igstAmount || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#34150F]">{formatINR(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Lower Grid: Bank Transfer Details + Financial Breakdown ──── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Official Bank Remittance Box */}
              <div className="bg-white p-5 rounded-2xl border border-[rgba(52,21,15,0.08)] shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#85431E] uppercase tracking-wider">
                  <Landmark size={15} /> Bank & RTGS / NEFT Remittance Details
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Bank Name:</span>
                    <span className="font-bold text-[#34150F]">{bank.bankName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Account Name:</span>
                    <span className="font-bold text-[#34150F]">{bank.accountName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Account Number:</span>
                    <span className="font-mono font-bold text-amber-700">{bank.accountNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">IFSC Code:</span>
                    <span className="font-mono font-bold text-[#34150F]">{bank.ifsc}</span>
                  </div>
                  {bank.upiId ? (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">UPI / VPA:</span>
                      <span className="font-mono font-medium text-slate-800">{bank.upiId}</span>
                    </div>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  💡 Kindly mention PI number <strong>{pi.piNumber}</strong> in the transfer remarks for expedited clearance.
                </p>
              </div>

              {/* Financial Calculation & Advance Schedule Card */}
              <div className="bg-white p-5 rounded-2xl border border-[rgba(52,21,15,0.08)] shadow-sm space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value (Basic):</span>
                    <span className="font-semibold text-slate-800">{formatINR(pi.taxableAmount || pi.subtotal)}</span>
                  </div>
                  {isInterstate ? (
                    <div className="flex justify-between text-slate-600">
                      <span>Integrated GST (IGST 18%):</span>
                      <span className="font-semibold text-slate-800">{formatINR(pi.igst)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Central GST (CGST 9%):</span>
                        <span className="font-semibold text-slate-800">{formatINR(pi.cgst)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>State GST (SGST 9%):</span>
                        <span className="font-semibold text-slate-800">{formatINR(pi.sgst)}</span>
                      </div>
                    </>
                  )}
                  {Number(pi.shippingCost || 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Logistics & Freight:</span>
                      <span className="font-semibold text-slate-800">{formatINR(pi.shippingCost)}</span>
                    </div>
                  )}
                  {Number(pi.roundOff || 0) !== 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Round Off:</span>
                      <span className="text-slate-800">{formatINR(pi.roundOff)}</span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-extrabold text-[#34150F]">
                    <span>Grand Total (INR):</span>
                    <span>{formatINR(pi.grandTotal)}</span>
                  </div>

                  {/* Advance Deposit Highlight */}
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-300 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-amber-900">
                      <span>Advance Payable ({Number(pi.advancePercentage)}%):</span>
                      <span className="text-sm text-[#85431E]">{formatINR(pi.advanceAmount)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-amber-200">
                      <span>Balance Due at Dispatch:</span>
                      <span className="font-semibold text-slate-800">{formatINR(pi.balanceDue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Customer Feedback & Acceptance Form ──────────────────────── */}
            <div id="payment-receipt-upload" className="bg-white p-6 sm:p-8 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-md space-y-5 scroll-mt-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                  <Send size={18} className="text-[#85431E]" />
                  Customer Feedback & Advance Remittance Confirmation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm your acceptance of this Proforma Invoice, submit your advance bank transaction reference (UTR), or send your questions to the estimating desk.
                </p>
              </div>

              {feedbackSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Submission Confirmed!</div>
                    <div>{feedbackSuccess}</div>
                  </div>
                </div>
              )}

              {feedbackError && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 text-xs flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Notice</div>
                    <div>{feedbackError}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                
                {/* Action Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Your Response Type:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFeedbackAction('ACCEPT')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                        feedbackAction === 'ACCEPT'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 size={16} className={feedbackAction === 'ACCEPT' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>Accept & Confirm Terms</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeedbackAction('PAYMENT_SUBMITTED')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                        feedbackAction === 'PAYMENT_SUBMITTED'
                          ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Landmark size={16} className={feedbackAction === 'PAYMENT_SUBMITTED' ? 'text-purple-600' : 'text-slate-400'} />
                      <span>Advance Payment Initiated</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeedbackAction('REQUEST_CHANGE')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                        feedbackAction === 'REQUEST_CHANGE'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <HelpCircle size={16} className={feedbackAction === 'REQUEST_CHANGE' ? 'text-amber-600' : 'text-slate-400'} />
                      <span>Questions / Request Change</span>
                    </button>
                  </div>
                </div>

                {/* Conditional UTR Reference & Receipt Upload Field */}
                {(feedbackAction === 'PAYMENT_SUBMITTED' || feedbackAction === 'ACCEPT') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Advance Payment Transaction Reference (UTR / IMPS / NEFT Ref No.) {feedbackAction === 'PAYMENT_SUBMITTED' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional if paid)</span>}
                      </label>
                      <input
                        type="text"
                        value={advanceRef}
                        onChange={(e) => setAdvanceRef(e.target.value)}
                        placeholder="e.g. HDFC123456789012 or UPI Ref 4123456789"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#85431E] bg-white font-mono"
                      />
                    </div>

                    {/* Payment Screenshot or PDF Receipt Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Upload Payment Screenshot or Bank Receipt (Image / PDF):
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Attach a screenshot of your bank / UPI transfer or bank payment receipt (PNG, JPG, WEBP, or PDF, max 10MB) for immediate clearance.
                      </p>

                      {!receiptFile ? (
                        <label className="border-2 border-dashed border-slate-300 hover:border-[#85431E] rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white transition-colors">
                          <Upload size={20} className="text-[#85431E]" />
                          <span className="text-xs font-bold text-slate-700">Click to Select Payment Screenshot / PDF Receipt</span>
                          <span className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP, PDF up to 10MB</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="bg-white p-3 rounded-xl border border-slate-300 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {receiptPreview ? (
                              <img
                                src={receiptPreview}
                                alt="Receipt Preview"
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                                <FileText size={20} />
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-slate-800 truncate">{receiptFile.name}</div>
                              <div className="text-[10px] text-slate-500">
                                {(receiptFile.size / 1024).toFixed(1)} KB • {receiptFile.type || 'Document'}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            title="Remove file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Phone & Comments */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Direct Contact Phone (Optional):
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#85431E] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Feedback / Remarks / Delivery Notes <span className="text-red-500">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="Enter your message, project site delivery instructions, or notes for the commercial team..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#85431E] bg-white"
                    required
                  />
                </div>

                {/* Submit Feedback Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="flex items-center gap-2 bg-[#34150F] hover:bg-[#85431E] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    {submittingFeedback ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Submit Feedback to PRC Hardware</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
