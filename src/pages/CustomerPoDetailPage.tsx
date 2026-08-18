import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCustomerPurchaseOrderByIdApi,
  uploadPaymentReceiptApi,
  downloadPoPdf,
  downloadPackingListPdf,
  downloadPoInvoicePdf,
  downloadPaymentReceiptFile,
  CustomerPurchaseOrder,
} from '../services/poService';
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
  Building,
  Truck,
  FileCheck,
  Receipt,
  Eye,
} from 'lucide-react';

export function CustomerPoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [po, setPo] = useState<CustomerPurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadPo();
  }, [id]);

  async function loadPo() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomerPurchaseOrderByIdApi(id);
      setPo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Purchase Order');
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Allowed file types: PDF, JPEG, JPG, PNG');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('File size exceeds the 2 MB maximum limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadReceipt = async () => {
    if (!po || !selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await uploadPaymentReceiptApi(po.id, selectedFile);
      setUploadSuccess('Payment receipt submitted successfully! Finance team notified.');
      setSelectedFile(null);
      await loadPo();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload payment receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPo = async () => {
    if (!po) return;
    try {
      await downloadPoPdf(po.id, po.poNumber);
    } catch (err: any) {
      alert(err.message || 'Failed to download Purchase Order PDF');
    }
  };

  const handleDownloadPackingList = async () => {
    if (!po) return;
    try {
      await downloadPackingListPdf(po.id, po.poNumber);
    } catch (err: any) {
      alert(err.message || 'Failed to download packing list');
    }
  };

  const handleDownloadInvoice = async () => {
    if (!po) return;
    try {
      const invNum = po.invoice?.invoiceNumber || `INV-${po.poNumber}`;
      await downloadPoInvoicePdf(po.id, invNum);
    } catch (err: any) {
      alert(err.message || 'Failed to download Tax Invoice');
    }
  };

  const handleViewReceipt = async () => {
    if (!po) return;
    try {
      await downloadPaymentReceiptFile(po.id, po.poNumber, true);
    } catch (err: any) {
      alert(err.message || 'Failed to view payment receipt');
    }
  };

  const handleDownloadReceipt = async () => {
    if (!po) return;
    try {
      await downloadPaymentReceiptFile(po.id, po.poNumber, false);
    } catch (err: any) {
      alert(err.message || 'Failed to download payment receipt file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EACEAA] py-16 px-4 flex items-center justify-center">
        <div className="bg-[#f5e8d4] p-8 rounded-3xl border border-[rgba(52,21,15,0.12)] shadow-xl flex items-center space-x-4">
          <div className="w-8 h-8 border-4 border-[#34150F] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-[#34150F]">Loading Purchase Order Details...</span>
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="min-h-screen bg-[#EACEAA] py-16 px-4">
        <div className="max-w-md mx-auto bg-[#f5e8d4] p-8 rounded-3xl border border-[rgba(52,21,15,0.15)] shadow-xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-700 mx-auto" />
          <h2 className="text-xl font-bold text-[#34150F]">Purchase Order Not Found</h2>
          <p className="text-xs text-[#85431E]">{error || 'Unable to find the requested purchase order.'}</p>
          <button
            onClick={() => navigate('/profile')}
            className="bg-[#34150F] text-[#EACEAA] text-xs font-bold px-6 py-2.5 rounded-xl"
          >
            Go to My Profile
          </button>
        </div>
      </div>
    );
  }

  const activeReceipt = po.receipts && po.receipts[0];
  const isVerified = ['PAYMENT_VERIFIED', 'PACKING_LIST_GENERATED', 'DISPATCHED', 'INVOICED'].includes(po.status);
  const hasPackingList = !!po.packingList || ['PACKING_LIST_GENERATED', 'DISPATCHED', 'INVOICED'].includes(po.status);
  const isInvoiced = po.status === 'INVOICED' || !!po.invoice;
  const isDispatched = ['DISPATCHED', 'INVOICED'].includes(po.status) || !!po.dispatch;

  // Status step index (0 to 5)
  const steps = [
    { title: 'Submitted', key: 'SUBMITTED' },
    { title: 'Awaiting Advance', key: 'AWAITING_ADVANCE_PAYMENT' },
    { title: 'Receipt Uploaded', key: 'PAYMENT_RECEIPT_SUBMITTED' },
    { title: 'Verified / Packing List', key: 'PACKING_LIST_GENERATED' },
    { title: 'Dispatched', key: 'DISPATCHED' },
    { title: 'Invoiced', key: 'INVOICED' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 0;
      case 'AWAITING_ADVANCE_PAYMENT': return 1;
      case 'PAYMENT_RECEIPT_SUBMITTED': return 2;
      case 'PAYMENT_ACKNOWLEDGED': return 2;
      case 'PAYMENT_VERIFIED':
      case 'PACKING_LIST_GENERATED': return 3;
      case 'DISPATCHED':
      case 'INVOICE_GENERATION_FAILED': return 4;
      case 'INVOICED': return 5;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(po.status);

  return (
    <div className="min-h-screen bg-[#EACEAA] py-10 px-4 sm:px-6 lg:px-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Nav & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-xs font-bold text-[#85431E] hover:text-[#34150F] mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                Purchase Order {po.poNumber}
              </h1>
              <span className="bg-[#34150F] text-[#EACEAA] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {po.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-[#85431E]">
              Linked Quotation: <strong>{po.quotationNumber}</strong> &bull; Submitted on {new Date(po.submittedAt).toLocaleDateString('en-IN')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPo}
              className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md flex items-center space-x-2"
            >
              <Download className="w-4 h-4 text-[#D39858]" />
              <span>Download Purchase Order (PDF)</span>
            </button>

            {hasPackingList && (
              <button
                onClick={handleDownloadPackingList}
                className="bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-800 transition-all shadow-md flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Packing List (PDF)</span>
              </button>
            )}
            {isInvoiced && (
              <button
                onClick={handleDownloadInvoice}
                className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md flex items-center space-x-2"
              >
                <Receipt className="w-4 h-4" />
                <span>Download Tax Invoice</span>
              </button>
            )}
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 relative">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step.key} className="text-center space-y-2">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                      isCompleted
                        ? 'bg-[#34150F] text-[#EACEAA]'
                        : 'bg-[#FAF5EE] text-[#85431E]/40 border border-[rgba(52,21,15,0.15)]'
                    } ${isCurrent ? 'ring-4 ring-[#D39858]/50' : ''}`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <p className={`text-[10px] font-bold ${isCompleted ? 'text-[#34150F]' : 'text-[#85431E]/60'}`}>
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Bank Details & Receipt Upload */}
          <div className="lg:col-span-2 space-y-6">

            {/* Advance Payment Bank Transfer Details */}
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-[#85431E]" />
                  <h3 className="font-extrabold text-[#34150F] text-sm">Official Bank Account for Advance Transfer</h3>
                </div>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                  Required: ₹{Number(po.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({po.advancePercentage}%)
                </span>
              </div>

              {po.bankDetails ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF5EE] p-4 rounded-xl border border-[rgba(52,21,15,0.08)]">
                  <div>
                    <span className="text-[10px] text-[#85431E] block">Account Holder Name</span>
                    <span className="font-bold text-[#34150F]">{po.bankDetails.accountHolderName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#85431E] block">Bank Name</span>
                    <span className="font-bold text-[#34150F]">{po.bankDetails.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#85431E] block">Account Number</span>
                      <span className="font-mono font-bold text-[#34150F]">{po.bankDetails.accountNumber}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(po.bankDetails!.accountNumber, 'acc')}
                      className="text-[10px] text-[#85431E] hover:text-[#34150F] p-1"
                    >
                      {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#85431E] block">IFSC / Routing Code</span>
                      <span className="font-mono font-bold text-[#34150F]">{po.bankDetails.ifscOrRoutingNumber}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(po.bankDetails!.ifscOrRoutingNumber, 'ifsc')}
                      className="text-[10px] text-[#85431E] hover:text-[#34150F] p-1"
                    >
                      {copiedField === 'ifsc' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {po.bankDetails.branch && (
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-[#85431E] block">Branch</span>
                      <span className="font-medium text-[#34150F]">{po.bankDetails.branch}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Payment Receipt Upload & History */}
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-3">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-[#85431E]" />
                  <h3 className="font-extrabold text-[#34150F] text-sm">Upload Advance Payment Receipt</h3>
                </div>
                {activeReceipt && (
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase ${
                      activeReceipt.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeReceipt.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-100 text-blue-800'
                        : activeReceipt.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Receipt {activeReceipt.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {uploadError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-xs text-red-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              {!isVerified && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-[rgba(52,21,15,0.2)] rounded-xl p-6 text-center bg-[#FAF5EE] hover:border-[#D39858] transition-colors">
                    <input
                      type="file"
                      id="receiptFile"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="receiptFile" className="cursor-pointer block space-y-2">
                      <div className="w-10 h-10 bg-[#D39858]/20 text-[#85431E] rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-[#34150F]">
                        {selectedFile ? selectedFile.name : 'Click to select receipt file (or drag & drop)'}
                      </p>
                      <p className="text-[10px] text-[#85431E]">
                        Supported: PDF, JPEG, PNG &bull; Max size: 2 MB
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleUploadReceipt}
                      disabled={uploading}
                      className="w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-3 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {uploading ? (
                        <span>Uploading & Calculating SHA-256 Hash...</span>
                      ) : (
                        <span>{activeReceipt ? 'Update / Replace Receipt' : 'Submit Receipt for Verification'}</span>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Active Receipt Metadata */}
              {activeReceipt && (
                <div className="bg-[#FAF5EE] rounded-xl p-4 border border-[rgba(52,21,15,0.08)] space-y-3 text-xs">
                  <div className="flex justify-between items-center text-[#85431E]">
                    <span>Current Active Receipt (v{activeReceipt.version}):</span>
                    <span className="font-bold text-[#34150F]">{activeReceipt.originalFileName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#85431E]">
                    <span>File Size:</span>
                    <span>{(activeReceipt.fileSizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between items-center text-[#85431E]">
                    <span>Tamper-Proof SHA-256:</span>
                    <span className="font-mono text-[10px] text-[#34150F]">{activeReceipt.fileHash?.slice(0, 24)}...</span>
                  </div>
                  {activeReceipt.paymentReference && (
                    <div className="flex justify-between items-center text-[#85431E]">
                      <span>Acknowledged Payment UTR:</span>
                      <span className="font-mono font-bold text-emerald-800">{activeReceipt.paymentReference}</span>
                    </div>
                  )}
                  {activeReceipt.rejectionReason && (
                    <div className="bg-red-50 p-2 rounded text-red-800 text-[11px] mt-2">
                      <strong>Rejection Note:</strong> {activeReceipt.rejectionReason}
                    </div>
                  )}

                  {/* Customer Receipt View & Download Actions */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-[rgba(52,21,15,0.08)]">
                    <button
                      type="button"
                      onClick={handleViewReceipt}
                      className="bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-xs transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadReceipt}
                      className="bg-[#FAF5EE] hover:bg-[#EACEAA] text-[#34150F] border border-[rgba(52,21,15,0.2)] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dispatch & Logistics Information Card */}
            {po.dispatch && (
                <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-3">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-emerald-800" />
                      <h3 className="font-extrabold text-[#34150F] text-sm">Shipment Dispatched</h3>
                    </div>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md">
                      IN TRANSIT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#FAF5EE] p-4 rounded-xl border border-[rgba(52,21,15,0.08)]">
                    <div>
                      <span className="text-[10px] text-[#85431E] block">Carrier Name</span>
                      <span className="font-bold text-[#34150F]">{po.dispatch.carrierName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#85431E] block">Tracking / AWB Number</span>
                      <span className="font-mono font-bold text-amber-900">{po.dispatch.trackingNumber || 'Pending AWB Assignment'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#85431E] block">Dispatched Date</span>
                      <span className="font-medium text-[#34150F]">{new Date(po.dispatch.dispatchedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    {po.dispatch.dispatchNotes && (
                      <div className="sm:col-span-3 text-[11px] text-[#85431E] pt-1">
                        <strong>Dispatch Notes:</strong> {po.dispatch.dispatchNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tax Invoice Details Card */}
              {po.invoice && (
                <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-3">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-5 h-5 text-[#34150F]" />
                      <h3 className="font-extrabold text-[#34150F] text-sm">Commercial Tax Invoice</h3>
                    </div>
                    <button
                      onClick={handleDownloadInvoice}
                      className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#FAF5EE] p-4 rounded-xl border border-[rgba(52,21,15,0.08)]">
                    <div>
                      <span className="text-[10px] text-[#85431E] block">Invoice Number</span>
                      <span className="font-bold text-[#34150F]">{po.invoice.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#85431E] block">Amount Invoiced</span>
                      <span className="font-mono font-bold text-[#34150F]">₹{Number(po.invoice.amountInvoiced).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 block">Advance Credited</span>
                      <span className="font-mono font-bold text-emerald-700">(-) ₹{Number(po.invoice.amountPaidAdvance).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-900 block">Balance Payable</span>
                      <span className="font-mono font-bold text-amber-900">₹{Number(po.invoice.balanceDue).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Snapshot Table */}
              <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">
                <h3 className="font-extrabold text-[#34150F] text-sm border-b border-[rgba(52,21,15,0.08)] pb-3">
                  Purchase Order Line Items Snapshot
                </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[rgba(52,21,15,0.1)] text-[#85431E]">
                      <th className="py-2">SL</th>
                      <th className="py-2">Item Description</th>
                      <th className="py-2">SKU</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Rate</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(52,21,15,0.05)]">
                    {po.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 font-mono text-[#85431E]">{item.slNo}</td>
                        <td className="py-2 font-bold text-[#34150F]">{item.productName}</td>
                        <td className="py-2 text-[#85431E] font-mono">{item.sku || 'PRC-HW'}</td>
                        <td className="py-2 text-center font-bold">{item.quantity} {item.unit}</td>
                        <td className="py-2 text-right font-mono">₹{Number(item.rate).toLocaleString('en-IN')}</td>
                        <td className="py-2 text-right font-mono font-bold text-[#34150F]">₹{Number(item.total || item.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Address & Total Summary */}
          <div className="space-y-6">
            
            {/* Total Financial Summary */}
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.15)] shadow-md space-y-4">
              <h3 className="font-extrabold text-[#34150F] text-base border-b border-[rgba(52,21,15,0.1)] pb-3" style={{ fontFamily: "'Gilda Display', serif" }}>
                Financial Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#85431E]">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-[#34150F]">₹{Number(po.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[#85431E]">
                  <span>GST / Tax Total:</span>
                  <span className="font-mono font-bold text-[#34150F]">₹{Number(po.taxTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {Number(po.shippingCost) > 0 && (
                  <div className="flex justify-between text-[#85431E]">
                    <span>Shipping:</span>
                    <span className="font-mono font-bold text-[#34150F]">₹{Number(po.shippingCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                
                <div className="border-t border-[rgba(52,21,15,0.1)] pt-2 flex justify-between text-sm font-extrabold text-[#34150F]">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{Number(po.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="bg-[#FAF5EE] rounded-xl p-3 border border-[#D39858] space-y-1.5 mt-2">
                  <div className="flex justify-between text-xs font-bold text-[#85431E]">
                    <span>Advance ({po.advancePercentage}%):</span>
                    <span className="font-mono text-[#34150F]">₹{Number(po.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#85431E]">
                    <span>Balance Due:</span>
                    <span className="font-mono text-[#34150F]">₹{Number(po.balanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Snapshots */}
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4 text-xs">
              <h3 className="font-extrabold text-[#34150F] text-sm border-b border-[rgba(52,21,15,0.08)] pb-2">
                Addresses
              </h3>
              
              <div>
                <span className="font-bold text-[#85431E] block mb-1">Billing Address:</span>
                <p className="text-[#34150F] font-bold">{po.billingAddress?.attentionTo}</p>
                {po.billingAddress?.companyName && <p className="text-[#85431E]">{po.billingAddress.companyName}</p>}
                <p className="text-[#34150F]">{po.billingAddress?.addressLine1}</p>
                <p className="text-[#34150F]">{po.billingAddress?.city}, {po.billingAddress?.state} - {po.billingAddress?.postalCode}</p>
                <p className="text-[#85431E]">Phone: {po.billingAddress?.phone}</p>
              </div>

              <div className="border-t border-[rgba(52,21,15,0.08)] pt-3">
                <span className="font-bold text-[#85431E] block mb-1">Delivery Destination:</span>
                <p className="text-[#34150F] font-bold">{po.deliveryAddress?.attentionTo}</p>
                {po.deliveryAddress?.companyName && <p className="text-[#85431E]">{po.deliveryAddress.companyName}</p>}
                <p className="text-[#34150F]">{po.deliveryAddress?.addressLine1}</p>
                <p className="text-[#34150F]">{po.deliveryAddress?.city}, {po.deliveryAddress?.state} - {po.deliveryAddress?.postalCode}</p>
                {po.deliveryInstructions && (
                  <p className="text-amber-900 bg-amber-50 p-2 rounded mt-2">
                    <strong>Instructions:</strong> {po.deliveryInstructions}
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
