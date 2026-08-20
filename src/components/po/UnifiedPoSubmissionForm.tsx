import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  Search,
  Layers,
  Check,
  ChevronDown,
  CreditCard,
  Receipt,
  ShieldCheck,
  Truck,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getEligibleQuotationsApi,
  getQuotationForPoApi,
  createPurchaseOrderApi,
  getSavedAddressesApi,
  PoAddress,
} from '../../services/poService';
import {
  createFormPoSubmissionApi,
  createPdfPoSubmissionApi,
  getNextSequentialPoNumberApi,
} from '../../services/poSubmissionsService';
import { quotationService } from '../../services/quotationService';
import { Product } from '../../types';
import { AsyncActionButton } from '../common/AsyncActionButton';

export type PoSubmissionMode = 'AGAINST_QUOTATION' | 'STANDARD_FORM' | 'PDF_UPLOAD';

export interface UnifiedPoSubmissionFormProps {
  defaultMode?: PoSubmissionMode;
  initialQuoteId?: string;
  initialQuoteNumber?: string;
}

export function generateFallbackPoNumber(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PRC-PO-${yyyy}${mm}${dd}-${rand}`;
}

export function UnifiedPoSubmissionForm({
  defaultMode = 'AGAINST_QUOTATION',
  initialQuoteId,
  initialQuoteNumber,
}: UnifiedPoSubmissionFormProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryQuoteId = searchParams.get('quoteId') || initialQuoteId;
  const queryQuoteNumber = searchParams.get('quoteNumber') || initialQuoteNumber;
  const queryMode = searchParams.get('mode') as PoSubmissionMode | null;

  // ── Mode Switcher State ──
  const [mode, setMode] = useState<PoSubmissionMode>(() => {
    if (queryMode === 'AGAINST_QUOTATION' || queryMode === 'STANDARD_FORM' || queryMode === 'PDF_UPLOAD') {
      return queryMode;
    }
    if (queryQuoteId || queryQuoteNumber) {
      return 'AGAINST_QUOTATION';
    }
    return defaultMode;
  });

  // ── General / Sequential PO Number ──
  const [customerPoNumber, setCustomerPoNumber] = useState<string>('');
  const [customerPoDate, setCustomerPoDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('Advance Deposit / As Agreed');
  const [fetchingPoNumber, setFetchingPoNumber] = useState<boolean>(false);

  // ── Address State ──
  const [sameAsBilling, setSameAsBilling] = useState<boolean>(true);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // MODE 1: AGAINST APPROVED QUOTATION
  // ─────────────────────────────────────────────────────────────────────────────
  const [eligibleQuotes, setEligibleQuotes] = useState<any[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(queryQuoteId || queryQuoteNumber || '');
  const [quoteDetail, setQuoteDetail] = useState<any | null>(null);
  const [quotePricingSummary, setQuotePricingSummary] = useState<any | null>(null);
  const [quoteAdvancePercentage, setQuoteAdvancePercentage] = useState<number>(30);
  const [loadingQuotes, setLoadingQuotes] = useState<boolean>(false);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState<string>('');

  // ─────────────────────────────────────────────────────────────────────────────
  // MODE 2: STANDARD PO FORM (SEARCH PRODUCTS FROM DB CATALOG)
  // ─────────────────────────────────────────────────────────────────────────────
  const [catalogLineItems, setCatalogLineItems] = useState<
    Array<{
      productId?: string;
      productName: string;
      sku: string;
      thumbnail?: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }>
  >([]);

  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState<boolean>(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemPrice, setNewItemPrice] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<string>('PCS');

  // Customer specific advance percentage from user profile or default 30%
  const customerAdvancePercentage = useMemo(() => {
    if (user?.b2bAdvancePercentage !== null && user?.b2bAdvancePercentage !== undefined) {
      return Number(user.b2bAdvancePercentage);
    }
    return 30;
  }, [user]);

  // ─────────────────────────────────────────────────────────────────────────────
  // MODE 3: PDF UPLOAD
  // ─────────────────────────────────────────────────────────────────────────────
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfStatedTotal, setPdfStatedTotal] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Feedback & Loading ──
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ id: string; submissionNumber: string } | null>(null);

  // ── Auto-generate sequential PO number ──
  const fetchSequentialPoNumber = useCallback(async () => {
    setFetchingPoNumber(true);
    try {
      const res = await getNextSequentialPoNumberApi();
      if (res.success && res.data?.poNumber) {
        setCustomerPoNumber(res.data.poNumber);
        return;
      }
    } catch (_) {
      // Fallback below
    } finally {
      setFetchingPoNumber(false);
    }
    setCustomerPoNumber(generateFallbackPoNumber());
  }, []);

  useEffect(() => {
    fetchSequentialPoNumber();
  }, [fetchSequentialPoNumber]);

  // ── Load Eligible Quotations & Saved Addresses ──
  useEffect(() => {
    let isMounted = true;
    async function loadQuotationsAndAddresses() {
      setLoadingQuotes(true);
      try {
        const [quotes, addresses] = await Promise.allSettled([
          getEligibleQuotationsApi(),
          getSavedAddressesApi(),
        ]);

        if (!isMounted) return;

        if (quotes.status === 'fulfilled' && Array.isArray(quotes.value)) {
          setEligibleQuotes(quotes.value);

          const targetId = queryQuoteId || queryQuoteNumber || (quotes.value.length > 0 ? quotes.value[0].id : '');
          if (targetId) {
            setSelectedQuoteId(targetId);
            loadQuotationDetail(targetId);
          }
        }

        if (addresses.status === 'fulfilled' && Array.isArray(addresses.value)) {
          setSavedAddresses(addresses.value);
        }
      } catch (err) {
        console.error('Failed to load eligible quotes:', err);
      } finally {
        if (isMounted) setLoadingQuotes(false);
      }
    }

    loadQuotationsAndAddresses();
    return () => {
      isMounted = false;
    };
  }, [queryQuoteId, queryQuoteNumber]);

  // ── Load selected quotation detail ──
  const loadQuotationDetail = async (quoteId: string) => {
    if (!quoteId) return;
    setError(null);
    try {
      const data = await getQuotationForPoApi(quoteId);
      if (data?.quote) {
        setQuoteDetail(data.quote);
        setQuotePricingSummary(data.pricingSummary);
        setSelectedQuoteId(data.quote.id);

        if (data.pricingSummary?.advancePercentage) {
          setQuoteAdvancePercentage(Number(data.pricingSummary.advancePercentage));
        } else if (data.quote.advancePercentage) {
          setQuoteAdvancePercentage(Number(data.quote.advancePercentage));
        }

        // Auto-fill billing address from quotation
        setBillToAddress((prev) => ({
          ...prev,
          attentionTo: `${data.quote.firstName || ''} ${data.quote.lastName || ''}`.trim() || prev.attentionTo,
          companyName: data.quote.companyName || prev.companyName,
          email: data.quote.email || prev.email,
          phone: data.quote.phone || prev.phone,
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load quotation details');
    }
  };

  // ── Live DB Product Search for Mode B ──
  useEffect(() => {
    if (!productSearchQuery.trim()) {
      setProductSearchResults([]);
      setIsSearchingProducts(false);
      return;
    }

    let active = true;
    setIsSearchingProducts(true);

    const timer = setTimeout(async () => {
      try {
        const results = await quotationService.searchLiveProducts(productSearchQuery.trim());
        if (active) {
          setProductSearchResults(results);
          setIsProductDropdownOpen(true);
        }
      } catch (err) {
        console.error('Product search error:', err);
      } finally {
        if (active) setIsSearchingProducts(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [productSearchQuery]);

  // Handle product selection from search
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setProductSearchQuery(prod.name);
    setNewItemPrice(String(prod.salePrice || prod.price || 0));
    setNewItemQty(1);
    setIsProductDropdownOpen(false);
  };

  // Add line item to catalog list
  const handleAddCatalogLineItem = () => {
    if (!selectedProduct && !productSearchQuery.trim()) {
      setError('Please select or specify a product');
      return;
    }

    const price = parseFloat(newItemPrice) || 0;
    const qty = Math.max(1, Number(newItemQty) || 1);
    const name = selectedProduct?.name || productSearchQuery.trim();
    const sku = selectedProduct?.sku || `SKU-${Date.now().toString().slice(-4)}`;
    const thumbnail = selectedProduct?.thumbnail || (selectedProduct?.images && selectedProduct.images[0]);

    setCatalogLineItems((prev) => [
      ...prev,
      {
        productId: selectedProduct?.id,
        productName: name,
        sku,
        thumbnail,
        unit: newItemUnit,
        quantity: qty,
        unitPrice: price,
        amount: Math.round(qty * price * 100) / 100,
      },
    ]);

    // Reset item picker
    setSelectedProduct(null);
    setProductSearchQuery('');
    setNewItemPrice('');
    setNewItemQty(1);
    setError(null);
  };

  const handleRemoveCatalogItem = (idx: number) => {
    setCatalogLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Computations for Mode B (Standard Form) ──
  const standardBasicPrice = useMemo(() => {
    return catalogLineItems.reduce((acc, item) => acc + item.amount, 0);
  }, [catalogLineItems]);

  const standardGstAmount = useMemo(() => {
    return Math.round(standardBasicPrice * 0.18 * 100) / 100;
  }, [standardBasicPrice]);

  const standardGrandTotal = useMemo(() => {
    return Math.round((standardBasicPrice + standardGstAmount) * 100) / 100;
  }, [standardBasicPrice, standardGstAmount]);

  const standardAdvanceDeposit = useMemo(() => {
    return Math.round(standardGrandTotal * (customerAdvancePercentage / 100) * 100) / 100;
  }, [standardGrandTotal, customerAdvancePercentage]);

  const standardBalancePayable = useMemo(() => {
    return Math.round((standardGrandTotal - standardAdvanceDeposit) * 100) / 100;
  }, [standardGrandTotal, standardAdvanceDeposit]);

  // ── Computations for Mode A (Against Quotation) ──
  const quoteAdvanceDeposit = useMemo(() => {
    const total = quotePricingSummary?.grandTotal || quoteDetail?.grandTotal || 0;
    return Math.round(Number(total) * (quoteAdvancePercentage / 100) * 100) / 100;
  }, [quotePricingSummary, quoteDetail, quoteAdvancePercentage]);

  const quoteBalancePayable = useMemo(() => {
    const total = quotePricingSummary?.grandTotal || quoteDetail?.grandTotal || 0;
    return Math.round((Number(total) - quoteAdvanceDeposit) * 100) / 100;
  }, [quotePricingSummary, quoteDetail, quoteAdvanceDeposit]);

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

  // Filter eligible quotations list by search term
  const filteredEligibleQuotes = useMemo(() => {
    if (!quoteSearchTerm.trim()) return eligibleQuotes;
    const q = quoteSearchTerm.toLowerCase().trim();
    return eligibleQuotes.filter(
      (qt) =>
        qt.referenceNo?.toLowerCase().includes(q) ||
        qt.quoteNumber?.toLowerCase().includes(q) ||
        qt.projectName?.toLowerCase().includes(q)
    );
  }, [eligibleQuotes, quoteSearchTerm]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SUBMISSION HANDLER
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateWarning(null);

    const effectivePoNumber = customerPoNumber.trim() || generateFallbackPoNumber();

    // ── CASE 1: SUBMIT PO AGAINST APPROVED QUOTATION ──
    if (mode === 'AGAINST_QUOTATION') {
      if (!selectedQuoteId || !quoteDetail) {
        setError('Please select an approved Quotation to submit your Purchase Order against');
        return;
      }

      if (!billToAddress.addressLine1.trim() || !billToAddress.city.trim() || !billToAddress.postalCode.trim()) {
        setError('Please complete the required billing address fields');
        return;
      }

      setSubmitting(true);
      try {
        const finalShipTo = sameAsBilling ? billToAddress : shipToAddress;
        const res = await createPurchaseOrderApi({
          quotationId: quoteDetail.id,
          customerPoReferenceNumber: effectivePoNumber,
          billingAddress: billToAddress,
          deliveryAddress: finalShipTo,
          deliveryInstructions: deliveryInstructions.trim() || undefined,
          requestedDeliveryDate: expectedDeliveryDate || undefined,
        });

        if (res?.id) {
          navigate(`/purchase-orders/${res.id}`);
        } else {
          setError('Failed to create purchase order from quotation');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to submit Purchase Order against quotation');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── CASE 2: FILL STANDARD PO FORM ──
    if (mode === 'STANDARD_FORM') {
      if (catalogLineItems.length === 0) {
        setError('Please search and add at least one line item from the catalog');
        return;
      }

      if (!billToAddress.addressLine1.trim() || !billToAddress.city.trim() || !billToAddress.postalCode.trim()) {
        setError('Please complete the required billing address fields');
        return;
      }

      setSubmitting(true);
      try {
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
          lineItems: catalogLineItems.map((item) => ({
            description: item.productName,
            sku: item.sku || undefined,
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
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── CASE 3: UPLOAD OFFICIAL PO DOCUMENT (PDF) ──
    if (mode === 'PDF_UPLOAD') {
      if (!pdfFile) {
        setError('Please upload your Purchase Order PDF document');
        return;
      }

      setSubmitting(true);
      try {
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
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Auth Prompt if not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-md w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-8 text-center shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EACEAA] text-[#34150F] flex items-center justify-center mx-auto shadow-inner">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Sign In Required
          </h2>
          <p className="text-xs text-[#85431E]">
            Please sign in to your B2B account to submit Purchase Orders, view approved quotations, and manage commercial order execution.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-3 rounded-tr-xl rounded-bl-xl shadow hover:bg-[#D39858] hover:text-[#34150F] transition-all"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* ─── Breadcrumb & Navigation ─── */}
      <div className="flex items-center justify-between">
        <Link
          to="/purchase-orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchase Orders</span>
        </Link>
        <Link
          to="/po-submissions"
          className="text-xs font-bold text-[#34150F] hover:underline"
        >
          View Submitted PO History →
        </Link>
      </div>

      {/* ─── Header Card ─── */}
      <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#34150F] text-[#EACEAA] flex items-center justify-center shrink-0 shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                  Submit Purchase Order (PO)
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#EACEAA] text-[#34150F] border border-[rgba(52,21,15,0.2)]">
                  B2B Commercial Gateway
                </span>
              </div>
              <p className="text-xs text-[#85431E] mt-1 leading-relaxed">
                Submit your official Purchase Order against an approved quotation, build a line-item order directly from our catalog, or upload a company-signed PDF.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Mode Switcher (3 Tabs) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Mode 1: Against Quotation */}
          <button
            type="button"
            onClick={() => setMode('AGAINST_QUOTATION')}
            className={`p-4 rounded-tr-2xl rounded-bl-2xl border text-left transition-all relative ${
              mode === 'AGAINST_QUOTATION'
                ? 'bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-md ring-2 ring-[#D39858]'
                : 'bg-white text-[#34150F] border-[rgba(52,21,15,0.15)] hover:border-[#D39858] hover:bg-[#FAF5EE]'
            }`}
          >
            {eligibleQuotes.length > 0 && (
              <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                mode === 'AGAINST_QUOTATION' ? 'bg-[#D39858] text-[#34150F]' : 'bg-[#EACEAA] text-[#34150F]'
              }`}>
                {eligibleQuotes.length} Ready
              </span>
            )}
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className={`w-4 h-4 ${mode === 'AGAINST_QUOTATION' ? 'text-[#D39858]' : 'text-[#85431E]'}`} />
              <span className="text-xs font-extrabold">Submit Against Quotation</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${mode === 'AGAINST_QUOTATION' ? 'text-[#EACEAA]/80' : 'text-[#85431E]'}`}>
              Select an approved estimate. Auto-populates line items, approved rates & advance details.
            </p>
          </button>

          {/* Mode 2: Standard Form (DB Search) */}
          <button
            type="button"
            onClick={() => setMode('STANDARD_FORM')}
            className={`p-4 rounded-tr-2xl rounded-bl-2xl border text-left transition-all ${
              mode === 'STANDARD_FORM'
                ? 'bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-md ring-2 ring-[#D39858]'
                : 'bg-white text-[#34150F] border-[rgba(52,21,15,0.15)] hover:border-[#D39858] hover:bg-[#FAF5EE]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Search className={`w-4 h-4 ${mode === 'STANDARD_FORM' ? 'text-[#D39858]' : 'text-[#85431E]'}`} />
              <span className="text-xs font-extrabold">Fill Standard PO Form</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${mode === 'STANDARD_FORM' ? 'text-[#EACEAA]/80' : 'text-[#85431E]'}`}>
              Build custom order. Search products directly from catalog with live pricing & advance calculation.
            </p>
          </button>

          {/* Mode 3: PDF Upload */}
          <button
            type="button"
            onClick={() => setMode('PDF_UPLOAD')}
            className={`p-4 rounded-tr-2xl rounded-bl-2xl border text-left transition-all ${
              mode === 'PDF_UPLOAD'
                ? 'bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-md ring-2 ring-[#D39858]'
                : 'bg-white text-[#34150F] border-[rgba(52,21,15,0.15)] hover:border-[#D39858] hover:bg-[#FAF5EE]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Upload className={`w-4 h-4 ${mode === 'PDF_UPLOAD' ? 'text-[#D39858]' : 'text-[#85431E]'}`} />
              <span className="text-xs font-extrabold">Upload PO Document (PDF)</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${mode === 'PDF_UPLOAD' ? 'text-[#EACEAA]/80' : 'text-[#85431E]'}`}>
              Directly upload company-signed PDF document (up to 10 MB). Verified by our intake desk.
            </p>
          </button>
        </div>
      </div>

      {/* ─── Feedback Alerts ─── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1 font-semibold">{error}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              A purchase order with number <strong>{customerPoNumber}</strong> was previously recorded as <strong>{duplicateWarning.submissionNumber}</strong>.
            </span>
          </div>
          <Link
            to={`/po-submissions/${duplicateWarning.id}`}
            className="text-amber-800 font-bold underline whitespace-nowrap ml-2"
          >
            View Existing Submission →
          </Link>
        </div>
      )}

      {/* ─── Form Container ─── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* MODE A: SUBMIT PO AGAINST APPROVED QUOTATION                       */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {mode === 'AGAINST_QUOTATION' && (
          <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[rgba(52,21,15,0.1)] pb-3">
              <h2 className="text-base font-bold text-[#34150F] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#D39858]" />
                <span>1. Select Approved Quotation</span>
              </h2>
              <p className="text-xs text-[#85431E] mt-0.5">
                Choose from your finalized quotations. Commercial details and rates are pre-loaded automatically.
              </p>
            </div>

            {loadingQuotes ? (
              <div className="py-8 text-center text-xs text-[#85431E] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#34150F]" />
                <span>Loading eligible approved quotations...</span>
              </div>
            ) : eligibleQuotes.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-[rgba(52,21,15,0.1)] text-center space-y-3">
                <Clock className="w-8 h-8 text-[#D39858] mx-auto opacity-70" />
                <h4 className="text-sm font-bold text-[#34150F]">No Approved Quotations Found</h4>
                <p className="text-xs text-[#85431E] max-w-md mx-auto">
                  You do not have any approved quotations awaiting Purchase Order submission at the moment. You can submit a new RFQ quotation request or use the Standard PO Form below.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    to="/request-quote"
                    className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all"
                  >
                    Request a Quotation →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode('STANDARD_FORM')}
                    className="bg-[#EACEAA] text-[#34150F] font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#D39858] transition-all"
                  >
                    Use Standard PO Form
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search / Filter Eligible Quotes */}
                {eligibleQuotes.length > 3 && (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#85431E]" />
                    <input
                      type="text"
                      placeholder="Search by quote reference, project name..."
                      value={quoteSearchTerm}
                      onChange={(e) => setQuoteSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/50 focus:outline-none focus:border-[#34150F]"
                    />
                  </div>
                )}

                {/* Quotations List / Radio Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {filteredEligibleQuotes.map((qt) => {
                    const isSelected = selectedQuoteId === qt.id || selectedQuoteId === qt.referenceNo;
                    return (
                      <div
                        key={qt.id}
                        onClick={() => {
                          setSelectedQuoteId(qt.id);
                          loadQuotationDetail(qt.id);
                        }}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-[#34150F] shadow-md ring-2 ring-[#D39858]'
                            : 'bg-white/60 border-[rgba(52,21,15,0.12)] hover:border-[#D39858] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-extrabold text-[#34150F] font-mono">
                            {qt.referenceNo || qt.quoteNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {qt.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#34150F] truncate">
                          {qt.projectName || 'Commercial Project'}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-[#85431E] mt-2 pt-2 border-t border-[rgba(52,21,15,0.08)]">
                          <span>{qt.items?.length || qt.itemCount || 1} Line Items</span>
                          <span className="font-extrabold text-[#34150F]">
                            ₹{Number(qt.grandTotal || qt.basicPrice || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Quotation Preview Box */}
                {quoteDetail && (
                  <div className="p-5 bg-white rounded-2xl border border-[rgba(52,21,15,0.12)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-[#34150F]">
                          Quotation Linked: <strong>{quoteDetail.referenceNo || quoteDetail.quoteNumber}</strong> ({quoteDetail.projectName})
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[#34150F]">
                        Total: ₹{Number(quotePricingSummary?.grandTotal || quoteDetail.grandTotal || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#FAF5EE] text-[#85431E] text-[10px] uppercase font-bold">
                          <tr>
                            <th className="py-2 px-3">Item</th>
                            <th className="py-2 px-2">SKU</th>
                            <th className="py-2 px-2 text-right">Qty</th>
                            <th className="py-2 px-2 text-right">Rate</th>
                            <th className="py-2 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(52,21,15,0.06)] text-[#34150F]">
                          {quoteDetail.items?.map((item: any, idx: number) => (
                            <tr key={item.id || idx}>
                              <td className="py-2 px-3 font-semibold">{item.productNameSnapshot || item.product?.name || item.name}</td>
                              <td className="py-2 px-2 font-mono text-[#85431E] text-[11px]">{item.product?.sku || item.sku || '-'}</td>
                              <td className="py-2 px-2 text-right font-mono">{item.quantity} {item.unit || 'PCS'}</td>
                              <td className="py-2 px-2 text-right font-mono">₹{Number(item.rate || 0).toLocaleString('en-IN')}</td>
                              <td className="py-2 px-3 text-right font-bold font-mono">₹{Number(item.amount || item.total || (item.quantity * item.rate)).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* MODE B: STANDARD PO FORM (SEARCH FROM DB CATALOG)                  */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {mode === 'STANDARD_FORM' && (
          <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[rgba(52,21,15,0.1)] pb-3">
              <h2 className="text-base font-bold text-[#34150F] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#D39858]" />
                <span>1. Order Line Items (Search Catalog DB)</span>
              </h2>
              <p className="text-xs text-[#85431E] mt-0.5">
                Search and select architectural hardware items from the database catalog, specify quantities, and build your Purchase Order item list.
              </p>
            </div>

            {/* Product Search & Selection Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[rgba(52,21,15,0.12)] space-y-3">
              <label className="text-xs font-bold text-[#34150F] block">Search Product from Database</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#85431E]" />
                <input
                  type="text"
                  placeholder="Type product name, model number, or SKU (e.g. Cubicle Hinge, SS-304 Lock)..."
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    if (selectedProduct && e.target.value !== selectedProduct.name) {
                      setSelectedProduct(null);
                    }
                  }}
                  onFocus={() => {
                    if (productSearchResults.length > 0) setIsProductDropdownOpen(true);
                  }}
                  className="w-full pl-9 pr-10 py-2.5 bg-[#FAF5EE]/50 border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/50 focus:outline-none focus:border-[#34150F]"
                />
                {isSearchingProducts && (
                  <RefreshCw className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#34150F]" />
                )}

                {/* Dropdown Results */}
                {isProductDropdownOpen && productSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[rgba(52,21,15,0.15)] rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-[rgba(52,21,15,0.06)]">
                    {productSearchResults.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        className="p-3 hover:bg-[#FAF5EE] cursor-pointer flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {prod.thumbnail || (prod.images && prod.images[0]) ? (
                            <img
                              src={prod.thumbnail || prod.images[0]}
                              alt={prod.name}
                              className="w-8 h-8 object-cover rounded-lg border border-[rgba(52,21,15,0.1)]"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-[#EACEAA] rounded-lg flex items-center justify-center text-[#34150F] text-[10px] font-bold">
                              PRC
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-[#34150F]">{prod.name}</p>
                            <p className="text-[10px] text-[#85431E] font-mono">SKU: {prod.sku || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-[#34150F]">
                            ₹{Number(prod.salePrice || prod.price || 0).toLocaleString('en-IN')}
                          </p>
                          <span className="text-[10px] text-emerald-700 font-semibold">Select +</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity, Unit Price & Add Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-[#85431E] block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-[#FAF5EE]/50 border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] font-mono focus:outline-none focus:border-[#34150F]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#85431E] block mb-1">Unit</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF5EE]/50 border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] focus:outline-none focus:border-[#34150F]"
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="SET">SET (Sets)</option>
                    <option value="BOX">BOX (Boxes)</option>
                    <option value="PAIR">PAIR (Pairs)</option>
                    <option value="MTR">MTR (Meters)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#85431E] block mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF5EE]/50 border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] font-mono focus:outline-none focus:border-[#34150F]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddCatalogLineItem}
                    className="w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-2 px-4 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to PO</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            {catalogLineItems.length > 0 ? (
              <div className="bg-white rounded-2xl border border-[rgba(52,21,15,0.12)] overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF5EE] text-[#85431E] text-[10px] uppercase font-bold border-b border-[rgba(52,21,15,0.1)]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-2">SKU</th>
                      <th className="py-2.5 px-2 text-right">Qty</th>
                      <th className="py-2.5 px-2 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(52,21,15,0.06)] text-[#34150F]">
                    {catalogLineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF5EE]/40">
                        <td className="py-2.5 px-3 font-mono text-[#85431E]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold">{item.productName}</td>
                        <td className="py-2.5 px-2 font-mono text-[#85431E] text-[11px]">{item.sku || '-'}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{item.quantity} {item.unit}</td>
                        <td className="py-2.5 px-2 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono">₹{item.amount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCatalogItem(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 bg-white rounded-2xl border border-dashed border-[rgba(52,21,15,0.2)] text-center text-xs text-[#85431E]">
                No items added yet. Use the product search bar above to select items from our architectural hardware database.
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* MODE C: PDF UPLOAD                                                 */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {mode === 'PDF_UPLOAD' && (
          <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[rgba(52,21,15,0.1)] pb-3">
              <h2 className="text-base font-bold text-[#34150F] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#D39858]" />
                <span>1. Upload Company Purchase Order Document</span>
              </h2>
              <p className="text-xs text-[#85431E] mt-0.5">
                Attach your signed Purchase Order document in PDF format (maximum size 10 MB).
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
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
              className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#34150F] bg-[#EACEAA]/40 scale-[0.99]'
                  : pdfFile
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-[rgba(52,21,15,0.2)] bg-white hover:border-[#D39858] hover:bg-[#FAF5EE]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {pdfFile ? (
                <div className="space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold text-[#34150F]">{pdfFile.name}</p>
                  <p className="text-xs text-emerald-700 font-mono">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Intake Verification
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPdfFile(null);
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline pt-1 inline-block"
                  >
                    Remove and upload different PDF
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EACEAA] text-[#34150F] flex items-center justify-center mx-auto shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#34150F]">
                      Drag and drop your signed PO PDF here, or <span className="text-[#85431E] underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-[#85431E] mt-1">
                      PDF format only (.pdf) • Maximum file size: 10 MB strict limit
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stated PO Total */}
            <div>
              <label className="text-xs font-bold text-[#34150F] block mb-1">
                Stated PO Total Amount (₹) <span className="text-gray-400 font-normal">(Optional, for intake cross-check)</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 150000.00"
                value={pdfStatedTotal}
                onChange={(e) => setPdfStatedTotal(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] font-mono focus:outline-none focus:border-[#34150F]"
              />
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* COMMON SECTION: PO IDENTIFIERS & SCHEDULE                           */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="border-b border-[rgba(52,21,15,0.1)] pb-3">
            <h2 className="text-base font-bold text-[#34150F] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D39858]" />
              <span>2. Purchase Order Reference & Execution Timeline</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sequential PO Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#34150F]">Purchase Order (PO) Number *</label>
                <button
                  type="button"
                  onClick={fetchSequentialPoNumber}
                  disabled={fetchingPoNumber}
                  className="text-[10px] text-[#85431E] hover:text-[#34150F] font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${fetchingPoNumber ? 'animate-spin' : ''}`} />
                  <span>Auto-Gen</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={customerPoNumber}
                onChange={(e) => setCustomerPoNumber(e.target.value)}
                placeholder="e.g. PRC-PO-2026-27/001"
                className="w-full px-4 py-2.5 bg-white border border-[rgba(52,21,15,0.15)] rounded-xl text-xs font-mono font-bold text-[#34150F] focus:outline-none focus:border-[#34150F]"
              />
            </div>

            {/* PO Date */}
            <div>
              <label className="text-xs font-bold text-[#34150F] block mb-1">PO Issue Date *</label>
              <input
                type="date"
                required
                value={customerPoDate}
                onChange={(e) => setCustomerPoDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] focus:outline-none focus:border-[#34150F]"
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="text-xs font-bold text-[#34150F] block mb-1">Requested Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] focus:outline-none focus:border-[#34150F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-[#34150F] block mb-1">Site Delivery Instructions</label>
              <textarea
                rows={2}
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Gate entry instructions, site supervisor contact, unloading requirements..."
                className="w-full px-4 py-2 bg-white border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F] resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#34150F] block mb-1">Order Notes / Commercial Terms</label>
              <textarea
                rows={2}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Specific GST tax invoice instructions, dispatch notes..."
                className="w-full px-4 py-2 bg-white border border-[rgba(52,21,15,0.15)] rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#34150F] resize-none"
              />
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* COMMON SECTION: BILLING & SHIPPING ADDRESSES                       */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {(mode === 'AGAINST_QUOTATION' || mode === 'STANDARD_FORM') && (
          <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="border-b border-[rgba(52,21,15,0.1)] pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#34150F] flex items-center gap-2">
                <Building className="w-4 h-4 text-[#D39858]" />
                <span>3. Billing & Dispatch Shipping Coordinates</span>
              </h2>
              {savedAddresses.length > 0 && (
                <span className="text-[10px] text-[#85431E] font-bold">
                  {savedAddresses.length} Saved Addresses Available
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Billing Address */}
              <div className="space-y-3 p-4 bg-white rounded-2xl border border-[rgba(52,21,15,0.1)]">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#34150F] border-b border-[rgba(52,21,15,0.06)] pb-1.5">
                  Official Billing Address
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#85431E] block">Attention To *</label>
                    <input
                      type="text"
                      required
                      value={billToAddress.attentionTo}
                      onChange={(e) => setBillToAddress({ ...billToAddress, attentionTo: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#85431E] block">Company Name</label>
                    <input
                      type="text"
                      value={billToAddress.companyName || ''}
                      onChange={(e) => setBillToAddress({ ...billToAddress, companyName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#85431E] block">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    placeholder="Plot / Street / Area"
                    value={billToAddress.addressLine1}
                    onChange={(e) => setBillToAddress({ ...billToAddress, addressLine1: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#85431E] block">City *</label>
                    <input
                      type="text"
                      required
                      value={billToAddress.city}
                      onChange={(e) => setBillToAddress({ ...billToAddress, city: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#85431E] block">State *</label>
                    <input
                      type="text"
                      required
                      value={billToAddress.state}
                      onChange={(e) => setBillToAddress({ ...billToAddress, state: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#85431E] block">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={billToAddress.postalCode}
                      onChange={(e) => setBillToAddress({ ...billToAddress, postalCode: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#85431E] block">Phone *</label>
                    <input
                      type="text"
                      required
                      value={billToAddress.phone}
                      onChange={(e) => setBillToAddress({ ...billToAddress, phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#85431E] block">Email</label>
                    <input
                      type="email"
                      value={billToAddress.email || ''}
                      onChange={(e) => setBillToAddress({ ...billToAddress, email: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3 p-4 bg-white rounded-2xl border border-[rgba(52,21,15,0.1)]">
                <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.06)] pb-1.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#34150F]">
                    Site Delivery Address
                  </h4>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-[#85431E]">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="rounded accent-[#34150F]"
                    />
                    <span>Same as Billing</span>
                  </label>
                </div>

                {sameAsBilling ? (
                  <div className="p-6 text-center text-xs text-[#85431E] bg-[#FAF5EE]/40 rounded-xl space-y-1">
                    <Truck className="w-6 h-6 text-[#D39858] mx-auto" />
                    <p className="font-bold text-[#34150F]">Dispatched to Billing Coordinates</p>
                    <p className="text-[11px]">Uncheck "Same as Billing" to specify a different project delivery site.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#85431E] block">Attention / Site Contact *</label>
                        <input
                          type="text"
                          required={!sameAsBilling}
                          value={shipToAddress.attentionTo}
                          onChange={(e) => setShipToAddress({ ...shipToAddress, attentionTo: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#85431E] block">Project / Site Name</label>
                        <input
                          type="text"
                          value={shipToAddress.companyName || ''}
                          onChange={(e) => setShipToAddress({ ...shipToAddress, companyName: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#85431E] block">Site Address Line 1 *</label>
                      <input
                        type="text"
                        required={!sameAsBilling}
                        value={shipToAddress.addressLine1}
                        onChange={(e) => setShipToAddress({ ...shipToAddress, addressLine1: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#85431E] block">City *</label>
                        <input
                          type="text"
                          required={!sameAsBilling}
                          value={shipToAddress.city}
                          onChange={(e) => setShipToAddress({ ...shipToAddress, city: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#85431E] block">State *</label>
                        <input
                          type="text"
                          required={!sameAsBilling}
                          value={shipToAddress.state}
                          onChange={(e) => setShipToAddress({ ...shipToAddress, state: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#85431E] block">PIN Code *</label>
                        <input
                          type="text"
                          required={!sameAsBilling}
                          value={shipToAddress.postalCode}
                          onChange={(e) => setShipToAddress({ ...shipToAddress, postalCode: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#FAF5EE]/40 border border-[rgba(52,21,15,0.15)] rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* COMMERCIAL SUMMARY & ADVANCE PAYMENT BREAKDOWN                      */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {(mode === 'AGAINST_QUOTATION' || mode === 'STANDARD_FORM') && (
          <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="border-b border-[rgba(52,21,15,0.1)] pb-3">
              <h2 className="text-base font-bold text-[#34150F] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#D39858]" />
                <span>4. Commercial Terms & Advance Deposit Calculation</span>
              </h2>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-5 rounded-2xl border border-[rgba(52,21,15,0.1)]">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#85431E]">Subtotal Basic</span>
                <p className="text-base font-extrabold text-[#34150F] font-mono">
                  ₹{mode === 'AGAINST_QUOTATION'
                    ? Number(quotePricingSummary?.subtotal || quoteDetail?.basicPrice || 0).toLocaleString('en-IN')
                    : standardBasicPrice.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#85431E]">GST Tax (18%)</span>
                <p className="text-base font-extrabold text-[#34150F] font-mono">
                  ₹{mode === 'AGAINST_QUOTATION'
                    ? Number(quotePricingSummary?.taxTotal || quoteDetail?.gstAmount || 0).toLocaleString('en-IN')
                    : standardGstAmount.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#85431E]">Total PO Value</span>
                <p className="text-base font-extrabold text-[#34150F] font-mono">
                  ₹{mode === 'AGAINST_QUOTATION'
                    ? Number(quotePricingSummary?.grandTotal || quoteDetail?.grandTotal || 0).toLocaleString('en-IN')
                    : standardGrandTotal.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-1 bg-[#EACEAA]/30 p-2.5 rounded-xl border border-[rgba(52,21,15,0.1)]">
                <span className="text-[10px] uppercase font-extrabold text-[#34150F]">
                  Required Advance ({mode === 'AGAINST_QUOTATION' ? quoteAdvancePercentage : customerAdvancePercentage}%)
                </span>
                <p className="text-base font-extrabold text-emerald-800 font-mono">
                  ₹{mode === 'AGAINST_QUOTATION'
                    ? quoteAdvanceDeposit.toLocaleString('en-IN')
                    : standardAdvanceDeposit.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Bank Coordinates Hub */}
            <div className="p-4 bg-white rounded-2xl border border-[rgba(52,21,15,0.12)] space-y-2">
              <h4 className="text-xs font-bold text-[#34150F] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#D39858]" />
                <span>PRC Official Bank Remittance Coordinates (NEFT / RTGS / IMPS)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#34150F] font-mono pt-1">
                <div>
                  <span className="text-[10px] text-[#85431E] block font-sans">Bank:</span>
                  <strong>HDFC Bank Ltd</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#85431E] block font-sans">Account No:</span>
                  <strong>50200088991122</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#85431E] block font-sans">IFSC Code:</span>
                  <strong>HDFC0001234</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#85431E] block font-sans">Account Holder:</span>
                  <strong>Pacific Hardware Enterprise</strong>
                </div>
              </div>
              <p className="text-[10px] text-[#85431E] pt-1">
                Upon PO submission, you can immediately upload your NEFT/RTGS/IMPS transaction receipt for expedited warehouse verification and packing list allocation.
              </p>
            </div>
          </div>
        )}

        {/* ─── Submit Action Bar ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            to="/purchase-orders"
            className="text-xs font-bold text-[#85431E] hover:text-[#34150F]"
          >
            Cancel & Return
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-8 py-3.5 rounded-tr-xl rounded-bl-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting Official Purchase Order...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {mode === 'AGAINST_QUOTATION'
                    ? 'Confirm & Submit PO Against Quotation →'
                    : mode === 'STANDARD_FORM'
                    ? 'Submit Standard Purchase Order →'
                    : 'Upload & Submit PO Document →'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
