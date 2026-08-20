import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Building,
  DollarSign,
  FileCheck,
  HelpCircle,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createFormPoSubmissionApi,
  createPdfPoSubmissionApi,
  getNextSequentialPoNumberApi,
  PoAddress,
} from '../services/poSubmissionsService';

type SubmissionMode = 'FORM' | 'PDF_UPLOAD';

export function generateAutoPoNumber(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PO-${yyyy}${mm}${dd}-${rand}`;
}

export function CreatePoSubmissionPage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Mode Selection: 'FORM' | 'PDF_UPLOAD'
  const [mode, setMode] = useState<SubmissionMode>('PDF_UPLOAD');

  // ── Form State: Common Fields ──
  const [customerPoNumber, setCustomerPoNumber] = useState<string>('');
  const [customerPoDate, setCustomerPoDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('100% Advance / As Agreed');
  const [fetchingPoNumber, setFetchingPoNumber] = useState(false);

  const fetchSequentialPoNumber = useCallback(async () => {
    setFetchingPoNumber(true);
    try {
      const res = await getNextSequentialPoNumberApi();
      if (res.success && res.data?.poNumber) {
        setCustomerPoNumber(res.data.poNumber);
        return;
      }
    } catch (_) {} finally {
      setFetchingPoNumber(false);
    }
    setCustomerPoNumber(generateAutoPoNumber());
  }, []);

  useEffect(() => {
    fetchSequentialPoNumber();
  }, [fetchSequentialPoNumber]);

  // ── Form State: Option B (PDF Upload) ──
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfStatedTotal, setPdfStatedTotal] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Form State: Option A (Structured Form) ──
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billToAddress, setBillToAddress] = useState<PoAddress>({
    attentionTo: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    companyName: user?.companyName || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const [shipToAddress, setShipToAddress] = useState<PoAddress>({
    attentionTo: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    companyName: user?.companyName || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const [lineItems, setLineItems] = useState<
    Array<{
      description: string;
      sku: string;
      unit: string;
      quantity: number;
      unitPrice: number;
    }>
  >([
    { description: '', sku: '', unit: 'PCS', quantity: 1, unitPrice: 0 },
  ]);

  // ── Submission Status & Feedback ──
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ id: string; submissionNumber: string } | null>(null);

  // ── PDF File Selection & 10MB Guardrail ──
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF document (.pdf only)');
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB strict limit
    if (file.size > MAX_SIZE) {
      setError('PDF file size exceeds the 10 MB maximum limit. Please optimize or compress your document.');
      return;
    }

    setError(null);
    setPdfFile(file);
  };

  // ── Line Items Helpers ──
  const addLineItem = () => {
    setLineItems((prev) => [...prev, { description: '', sku: '', unit: 'PCS', quantity: 1, unitPrice: 0 }]);
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const formGrandTotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  // ── Submit Handler ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateWarning(null);

    const effectivePoNumber = customerPoNumber.trim() || generateAutoPoNumber();
    if (!customerPoNumber.trim()) {
      setCustomerPoNumber(effectivePoNumber);
    }

    setSubmitting(true);
    try {
      if (mode === 'PDF_UPLOAD') {
        if (!pdfFile) {
          setError('Please upload your Purchase Order PDF document');
          setSubmitting(false);
          return;
        }

        const res = await createPdfPoSubmissionApi(pdfFile, {
          customerPoNumber: effectivePoNumber,
          customerPoDate: customerPoDate || undefined,
          statedTotal: pdfStatedTotal ? parseFloat(pdfStatedTotal) : undefined,
          currency,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          customerNote: customerNote.trim() || undefined,
        });

        if (res.success && res.data) {
          if (res.data.duplicateWarning && res.data.duplicateExistingSubmission) {
            setDuplicateWarning({
              id: res.data.duplicateExistingSubmission.id,
              submissionNumber: res.data.duplicateExistingSubmission.submissionNumber,
            });
          }
          navigate(`/po-submissions/${res.data.submission.id}`);
        } else {
          setError(res.error?.message || 'Failed to upload purchase order');
        }
      } else {
        // Option A: Structured Form PO
        const validItems = lineItems.filter((i) => i.description.trim() && i.quantity > 0);
        if (validItems.length === 0) {
          setError('Please enter at least one valid product line item');
          setSubmitting(false);
          return;
        }

        if (!billToAddress.addressLine1.trim() || !billToAddress.city.trim() || !billToAddress.postalCode.trim()) {
          setError('Please complete the required billing address fields');
          setSubmitting(false);
          return;
        }

        const finalShipTo = sameAsBilling ? billToAddress : shipToAddress;

        const res = await createFormPoSubmissionApi({
          customerPoNumber: effectivePoNumber,
          customerPoDate: customerPoDate || undefined,
          currency,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          paymentTerms: paymentTerms.trim() || undefined,
          customerNote: customerNote.trim() || undefined,
          billToAddress,
          shipToAddress: finalShipTo,
          lineItems: validItems.map((item) => ({
            description: item.description.trim(),
            sku: item.sku.trim() || undefined,
            unit: item.unit || 'PCS',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        });

        if (res.success && res.data) {
          navigate(`/po-submissions/${res.data.submission.id}`);
        } else {
          setError(res.error?.message || 'Failed to submit purchase order');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-md w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-8 text-center shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EACEAA] text-[#34150F] flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Sign In Required
          </h2>
          <p className="text-xs text-[#85431E] leading-relaxed">
            Please sign in to your PRC account to submit a purchase order.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] font-bold text-xs py-3 rounded-tr-xl rounded-bl-xl transition-all shadow-md"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* ─── Back Link ───────────────────────────────────────────────────────── */}
      <Link
        to="/po-submissions"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to PO Submissions</span>
      </Link>

      {/* ─── Page Title ──────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
          Submit Purchase Order
        </h1>
        <p className="text-xs sm:text-sm text-[#85431E]">
          Choose your preferred submission path. Upload your native ERP purchase order PDF or fill our structured commercial form.
        </p>
      </div>

      {/* ─── Mode Selection Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option B: Native PDF Upload */}
        <button
          type="button"
          onClick={() => setMode('PDF_UPLOAD')}
          className={`p-6 rounded-tr-2xl rounded-bl-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
            mode === 'PDF_UPLOAD'
              ? 'bg-[#FAF5EE] border-[#34150F] ring-2 ring-[#34150F] shadow-md'
              : 'bg-[#FAF5EE]/70 border-[rgba(52,21,15,0.12)] hover:border-[#D39858]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-[#EACEAA] text-[#34150F]">
              <Upload className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#7FB706]/20 text-[#34150F] font-extrabold text-[10px] uppercase">
              Fastest (Recommended)
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Upload PO PDF (Native Document)
            </h3>
            <p className="text-xs text-[#85431E] mt-1 leading-relaxed">
              Upload your existing purchase order from SAP, Tally, Zoho, Oracle, etc. No need to re-type line items — our engineering team maps SKUs during review.
            </p>
          </div>

          <div className="pt-2 text-xs font-bold text-[#34150F] flex items-center gap-1">
            <span>{mode === 'PDF_UPLOAD' ? '✓ Selected' : 'Select Option →'}</span>
          </div>
        </button>

        {/* Option A: Structured Form */}
        <button
          type="button"
          onClick={() => setMode('FORM')}
          className={`p-6 rounded-tr-2xl rounded-bl-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
            mode === 'FORM'
              ? 'bg-[#FAF5EE] border-[#34150F] ring-2 ring-[#34150F] shadow-md'
              : 'bg-[#FAF5EE]/70 border-[rgba(52,21,15,0.12)] hover:border-[#D39858]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-xl bg-[#EACEAA] text-[#34150F]">
              <FileText className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EACEAA] text-[#34150F] font-bold text-[10px] uppercase">
              Structured
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Fill Structured PO Form
            </h3>
            <p className="text-xs text-[#85431E] mt-1 leading-relaxed">
              Enter bill-to, ship-to, and line items manually into our commercial form for auto-validated instant catalog routing.
            </p>
          </div>

          <div className="pt-2 text-xs font-bold text-[#34150F] flex items-center gap-1">
            <span>{mode === 'FORM' ? '✓ Selected' : 'Select Option →'}</span>
          </div>
        </button>
      </div>

      {/* ─── Feedback & Errors ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start space-x-3 text-red-800 text-xs shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start space-x-3 text-amber-900 text-xs shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-1">
            <p className="font-bold">Duplicate PO Notice</p>
            <p>
              A purchase order with number <strong>{customerPoNumber}</strong> was already submitted earlier (Ref #{duplicateWarning.submissionNumber}).
            </p>
          </div>
        </div>
      )}

      {/* ─── Main Form ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Section 1: PO Reference & Commercial Metadata ── */}
        <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.12)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
            <FileSpreadsheet className="w-5 h-5 text-[#D39858]" />
            <span>1. Purchase Order Reference</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#34150F]">
                  Purchase Order (PO) Number *
                </label>
                <button
                  type="button"
                  onClick={fetchSequentialPoNumber}
                  disabled={fetchingPoNumber}
                  className="text-[10px] font-bold text-[#85431E] hover:text-[#34150F] inline-flex items-center gap-1 bg-[#EACEAA]/60 hover:bg-[#EACEAA] px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                  title="Generate the next sequential PO Reference Number"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${fetchingPoNumber ? 'animate-spin' : ''}`} />
                  <span>{fetchingPoNumber ? 'Generating...' : 'Auto-Generate'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. PO-20260820-4921 or ERP/PO/089"
                value={customerPoNumber}
                onChange={(e) => setCustomerPoNumber(e.target.value)}
                className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
              />
              <span className="text-[10px] text-[#85431E]/70 mt-1 block">
                Auto-generated by default. You can edit this to match your ERP/Tally/SAP PO #
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#34150F] mb-1">
                PO Issue Date
              </label>
              <input
                type="date"
                value={customerPoDate}
                onChange={(e) => setCustomerPoDate(e.target.value)}
                className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3.5 py-2.5 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#34150F] mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3.5 py-2.5 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Option B (PDF Upload Dropzone) ── */}
        {mode === 'PDF_UPLOAD' && (
          <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.12)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                <Upload className="w-5 h-5 text-[#D39858]" />
                <span>2. Upload Purchase Order Document</span>
              </h2>
              <p className="text-xs text-[#85431E]">
                Attach your official company Purchase Order as a PDF (max 10 MB).
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#34150F] bg-[#EACEAA]/50'
                  : pdfFile
                  ? 'border-[#7FB706] bg-emerald-50/50'
                  : 'border-[rgba(52,21,15,0.2)] bg-[#f5e8d4]/40 hover:bg-[#f5e8d4]/70 hover:border-[#D39858]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {pdfFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm text-[#34150F]">{pdfFile.name}</div>
                  <p className="text-xs text-[#85431E]">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to submit • Click to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EACEAA] text-[#34150F] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#34150F]">Click to upload or drag and drop</span>
                    <p className="text-xs text-[#85431E]/80 mt-0.5">PDF documents only (max 10 MB)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stated Total Reconcile Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#34150F] mb-1">
                  Stated PO Total Value (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#85431E]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 48500.00"
                    value={pdfStatedTotal}
                    onChange={(e) => setPdfStatedTotal(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                  />
                </div>
                <span className="text-[10px] text-[#85431E]/70 mt-1 block">
                  For reconciliation variance checks during engineering mapping
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#34150F] mb-1">
                  Note to Engineering Desk (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please verify finish SS-304 / urgent dispatch"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Section 3: Option A (Structured Line Items Builder) ── */}
        {mode === 'FORM' && (
          <>
            {/* Line Items Table */}
            <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.12)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#34150F] flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                  <FileText className="w-5 h-5 text-[#D39858]" />
                  <span>2. Order Line Items</span>
                </h2>

                <button
                  type="button"
                  onClick={addLineItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#34150F] bg-[#EACEAA] hover:bg-[#D39858] px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] font-bold text-[#85431E] uppercase border-b border-[rgba(52,21,15,0.12)]">
                    <tr>
                      <th className="py-2.5 px-2">Item Description *</th>
                      <th className="py-2.5 px-2 w-28">SKU (Optional)</th>
                      <th className="py-2.5 px-2 w-20 text-center">Unit</th>
                      <th className="py-2.5 px-2 w-20 text-center">Qty *</th>
                      <th className="py-2.5 px-2 w-28 text-right">Unit Rate (₹) *</th>
                      <th className="py-2.5 px-2 w-28 text-right">Total (₹)</th>
                      <th className="py-2.5 px-1 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(52,21,15,0.08)]">
                    {lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            required
                            placeholder="Product name / specification"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="w-full bg-[#f5e8d4]/50 border border-[rgba(52,21,15,0.15)] rounded-lg px-2.5 py-1.5 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            placeholder="e.g. PRC-101"
                            value={item.sku}
                            onChange={(e) => updateLineItem(index, 'sku', e.target.value)}
                            className="w-full bg-[#f5e8d4]/50 border border-[rgba(52,21,15,0.15)] rounded-lg px-2 py-1.5 text-xs font-mono text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <select
                            value={item.unit}
                            onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                            className="w-full bg-[#f5e8d4]/50 border border-[rgba(52,21,15,0.15)] rounded-lg px-1.5 py-1.5 text-xs text-[#34150F] text-center focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                          >
                            <option value="PCS">PCS</option>
                            <option value="SET">SET</option>
                            <option value="PAIR">PAIR</option>
                            <option value="MTR">MTR</option>
                            <option value="BOX">BOX</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-[#f5e8d4]/50 border border-[rgba(52,21,15,0.15)] rounded-lg px-2 py-1.5 text-xs text-[#34150F] text-center focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#f5e8d4]/50 border border-[rgba(52,21,15,0.15)] rounded-lg px-2 py-1.5 text-xs text-[#34150F] text-right focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-[#34150F]">
                          ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-1 text-center">
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-[rgba(52,21,15,0.12)] flex justify-between items-center text-sm font-bold text-[#34150F]">
                <span>Form Total Estimated Value:</span>
                <span className="text-base font-mono text-[#85431E]">
                  ₹{formGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Address Forms */}
            <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.12)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                3. Commercial Addresses
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bill To */}
                <div className="p-4 bg-[#f5e8d4]/50 rounded-2xl border border-[rgba(52,21,15,0.1)] space-y-3">
                  <h3 className="font-bold text-xs text-[#34150F] uppercase tracking-wider">Buyer / Bill-To Address *</h3>
                  <div className="space-y-2 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Contact Person / Attention To *"
                      value={billToAddress.attentionTo}
                      onChange={(e) => setBillToAddress({ ...billToAddress, attentionTo: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={billToAddress.companyName}
                      onChange={(e) => setBillToAddress({ ...billToAddress, companyName: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Address Line 1 *"
                      value={billToAddress.addressLine1}
                      onChange={(e) => setBillToAddress({ ...billToAddress, addressLine1: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="City *"
                        value={billToAddress.city}
                        onChange={(e) => setBillToAddress({ ...billToAddress, city: e.target.value })}
                        className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="State *"
                        value={billToAddress.state}
                        onChange={(e) => setBillToAddress({ ...billToAddress, state: e.target.value })}
                        className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="PIN Code *"
                        value={billToAddress.postalCode}
                        onChange={(e) => setBillToAddress({ ...billToAddress, postalCode: e.target.value })}
                        className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Phone *"
                        value={billToAddress.phone}
                        onChange={(e) => setBillToAddress({ ...billToAddress, phone: e.target.value })}
                        className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={billToAddress.email}
                        onChange={(e) => setBillToAddress({ ...billToAddress, email: e.target.value })}
                        className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                      />
                    </div>
                  </div>
                </div>

                {/* Ship To */}
                <div className="p-4 bg-[#f5e8d4]/50 rounded-2xl border border-[rgba(52,21,15,0.1)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#34150F] uppercase tracking-wider">Consignee / Ship-To Address</h3>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#85431E]">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => setSameAsBilling(e.target.checked)}
                        className="rounded text-[#34150F]"
                      />
                      <span>Same as billing</span>
                    </label>
                  </div>

                  {!sameAsBilling && (
                    <div className="space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="Attention To"
                        value={shipToAddress.attentionTo}
                        onChange={(e) => setShipToAddress({ ...shipToAddress, attentionTo: e.target.value })}
                        className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                      />
                      <input
                        type="text"
                        placeholder="Delivery Address Line 1"
                        value={shipToAddress.addressLine1}
                        onChange={(e) => setShipToAddress({ ...shipToAddress, addressLine1: e.target.value })}
                        className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="City"
                          value={shipToAddress.city}
                          onChange={(e) => setShipToAddress({ ...shipToAddress, city: e.target.value })}
                          className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={shipToAddress.state}
                          onChange={(e) => setShipToAddress({ ...shipToAddress, state: e.target.value })}
                          className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                        />
                        <input
                          type="text"
                          placeholder="PIN Code"
                          value={shipToAddress.postalCode}
                          onChange={(e) => setShipToAddress({ ...shipToAddress, postalCode: e.target.value })}
                          className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                        />
                      </div>
                    </div>
                  )}

                  {sameAsBilling && (
                    <div className="p-6 text-center text-xs text-[#85431E]/80 italic">
                      ✓ Ship-to address matches billing address
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Submit Button Bar ── */}
        <div className="flex items-center justify-between pt-4 border-t border-[rgba(52,21,15,0.12)]">
          <Link
            to="/po-submissions"
            className="text-xs font-bold text-[#85431E] hover:underline"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] font-bold text-xs px-8 py-3.5 rounded-tr-xl rounded-bl-xl shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span>Submitting Purchase Order...</span>
            ) : (
              <>
                <span>Submit Purchase Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
