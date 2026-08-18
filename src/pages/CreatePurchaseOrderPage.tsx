import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getEligibleQuotationsApi,
  getQuotationForPoApi,
  createPurchaseOrderApi,
  getSavedAddressesApi,
  PoAddress,
} from '../services/poService';
import { useAuth } from '../context/AuthContext';
import { FileText, CheckCircle, ArrowRight, ShieldCheck, Truck, Building, AlertCircle, ArrowLeft } from 'lucide-react';

export function CreatePurchaseOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedQuoteId = searchParams.get('quoteId');
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eligibleQuotes, setEligibleQuotes] = useState<any[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(preselectedQuoteId || '');
  const [quoteDetail, setQuoteDetail] = useState<any | null>(null);
  const [pricingSummary, setPricingSummary] = useState<any | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Form state
  const [customerPoRef, setCustomerPoRef] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [saveBilling, setSaveBilling] = useState(false);
  const [saveDelivery, setSaveDelivery] = useState(false);

  const [billingAddress, setBillingAddress] = useState<PoAddress>({
    attentionTo: '',
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    phone: '',
    email: '',
  });

  const [deliveryAddress, setDeliveryAddress] = useState<PoAddress>({
    attentionTo: '',
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    phone: '',
    email: '',
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [quotes, addresses] = await Promise.all([
          getEligibleQuotationsApi(),
          getSavedAddressesApi(),
        ]);
        setEligibleQuotes(quotes);
        setSavedAddresses(addresses);

        if (quotes.length > 0 && !selectedQuoteId) {
          setSelectedQuoteId(quotes[0].id);
        }

        // Pre-fill user details if available
        if (user) {
          setBillingAddress((prev) => ({
            ...prev,
            attentionTo: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            companyName: user.companyName || '',
            email: user.email || '',
            phone: user.phone || '',
          }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load eligible quotations');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Load detailed quotation when selected
  useEffect(() => {
    if (!selectedQuoteId) return;
    async function fetchDetail() {
      try {
        setError(null);
        const data = await getQuotationForPoApi(selectedQuoteId);
        setQuoteDetail(data.quote);
        setPricingSummary(data.pricingSummary);

        // Pre-fill contact details from quote if available
        if (data.quote) {
          setBillingAddress((prev) => ({
            ...prev,
            attentionTo: prev.attentionTo || `${data.quote.firstName || ''} ${data.quote.lastName || ''}`.trim(),
            companyName: prev.companyName || data.quote.companyName || '',
            email: prev.email || data.quote.email || '',
            phone: prev.phone || data.quote.phone || '',
          }));
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    fetchDetail();
  }, [selectedQuoteId]);

  const handleApplySavedAddress = (addr: any, target: 'billing' | 'delivery') => {
    const formatted: PoAddress = {
      attentionTo: addr.attentionTo,
      companyName: addr.companyName || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'IN',
      phone: addr.phone,
      email: addr.email,
    };
    if (target === 'billing') setBillingAddress(formatted);
    else setDeliveryAddress(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteId) {
      setError('Please select an eligible approved quotation');
      return;
    }

    // Validation
    if (!billingAddress.attentionTo || !billingAddress.addressLine1 || !billingAddress.city || !billingAddress.state || !billingAddress.postalCode || !billingAddress.phone || !billingAddress.email) {
      setError('Please complete all required fields in the Billing Address');
      return;
    }

    if (!sameAsBilling) {
      if (!deliveryAddress.attentionTo || !deliveryAddress.addressLine1 || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.postalCode || !deliveryAddress.phone || !deliveryAddress.email) {
        setError('Please complete all required fields in the Delivery Address');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createPurchaseOrderApi({
        quotationId: selectedQuoteId,
        customerPoReferenceNumber: customerPoRef.trim() || undefined,
        billingAddress,
        deliveryAddress: sameAsBilling ? undefined : deliveryAddress,
        sameAsBilling,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        requestedDeliveryDate: requestedDeliveryDate || undefined,
        saveBillingAddress: saveBilling,
        saveDeliveryAddress: saveDelivery,
      });

      navigate(`/purchase-orders/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EACEAA] py-16 px-4 flex items-center justify-center">
        <div className="bg-[#f5e8d4] p-8 rounded-3xl border border-[rgba(52,21,15,0.12)] shadow-xl flex items-center space-x-4">
          <div className="w-8 h-8 border-4 border-[#34150F] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-[#34150F]">Loading Quotation & PO Form...</span>
        </div>
      </div>
    );
  }

  if (eligibleQuotes.length === 0 && !quoteDetail) {
    return (
      <div className="min-h-screen bg-[#EACEAA] py-16 px-4">
        <div className="max-w-2xl mx-auto bg-[#f5e8d4] p-10 rounded-3xl border border-[rgba(52,21,15,0.15)] shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-[#D39858]/20 text-[#85431E] rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            No Eligible Quotations Found
          </h2>
          <p className="text-xs text-[#85431E] max-w-md mx-auto leading-relaxed">
            Purchase Orders can only be generated against <strong>Approved</strong>, non-expired quotations that have not already been converted.
          </p>
          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => navigate('/request-quote')}
              className="bg-[#34150F] text-[#EACEAA] text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md"
            >
              Request a New Quote
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="bg-[#D39858]/30 text-[#34150F] text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#D39858]/50 transition-all border border-[#34150F]/20"
            >
              View My Quotes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EACEAA] py-10 px-4 sm:px-6 lg:px-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-xs font-bold text-[#85431E] hover:text-[#34150F] mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Generate Purchase Order (PO)
            </h1>
            <p className="text-xs text-[#85431E]">
              Submit formal PO against your approved quotation to receive bank transfer details and packing list.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-[#f5e8d4] px-4 py-2 rounded-xl border border-[rgba(52,21,15,0.12)]">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-[#34150F]">Commercial B2B Guarantee</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center space-x-3 text-red-800 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Select Quotation */}
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">
              <div className="flex items-center space-x-3 border-b border-[rgba(52,21,15,0.08)] pb-3">
                <span className="w-6 h-6 rounded-full bg-[#34150F] text-[#EACEAA] text-xs font-extrabold flex items-center justify-center">1</span>
                <h3 className="font-extrabold text-[#34150F] text-sm uppercase tracking-wide">Approved Quotation</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#34150F] mb-1">Select Active Quotation *</label>
                <select
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2.5 text-xs text-[#34150F] font-bold focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                >
                  {eligibleQuotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.referenceNo || q.quoteNumber} — {q.projectName || 'Commercial Project'} (₹{Number(q.grandTotal || q.basicPrice || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quotation Line Items Preview (Read Only) */}
              {quoteDetail && quoteDetail.items && (
                <div className="mt-4 bg-[#FAF5EE] rounded-xl p-4 border border-[rgba(52,21,15,0.1)] space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[#85431E]">
                    <span>Quotation Line Items (Read-Only)</span>
                    <span>{quoteDetail.items.length} Item(s)</span>
                  </div>
                  <div className="divide-y divide-[rgba(52,21,15,0.08)] max-h-52 overflow-y-auto pr-1">
                    {quoteDetail.items.map((item: any, idx: number) => (
                      <div key={item.id || idx} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex-1 pr-3">
                          <p className="font-bold text-[#34150F]">{item.productNameSnapshot || item.product?.name || 'Hardware Fitting'}</p>
                          <p className="text-[10px] text-[#85431E]">SKU: {item.product?.sku || 'PRC-HW'} &bull; Qty: {item.quantity} {item.unit || 'PCS'}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#34150F]">
                            ₹{Number(item.offeredPrice || item.rate || 0).toLocaleString('en-IN')} / {item.unit || 'PCS'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: PO Reference & Dates */}
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">
              <div className="flex items-center space-x-3 border-b border-[rgba(52,21,15,0.08)] pb-3">
                <span className="w-6 h-6 rounded-full bg-[#34150F] text-[#EACEAA] text-xs font-extrabold flex items-center justify-center">2</span>
                <h3 className="font-extrabold text-[#34150F] text-sm uppercase tracking-wide">Purchase Order References</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#34150F] mb-1">Customer Internal PO Reference No.</label>
                  <input
                    type="text"
                    placeholder="e.g. CUST-PO-2026-042"
                    value={customerPoRef}
                    onChange={(e) => setCustomerPoRef(e.target.value)}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                  />
                  <span className="text-[10px] text-[#85431E]">Optional internal billing identifier</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#34150F] mb-1">Requested Delivery Date</label>
                  <input
                    type="date"
                    value={requestedDeliveryDate}
                    onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#34150F] mb-1">Delivery / Packaging Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Gate 4 warehouse receiving (9am - 5pm), call site supervisor prior to dispatch"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F] focus:outline-none focus:ring-2 focus:ring-[#D39858]"
                />
              </div>
            </div>

            {/* Step 3: Billing Address */}
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-[#34150F] text-[#EACEAA] text-xs font-extrabold flex items-center justify-center">3</span>
                  <h3 className="font-extrabold text-[#34150F] text-sm uppercase tracking-wide">Billing Address</h3>
                </div>
                {savedAddresses.length > 0 && (
                  <select
                    onChange={(e) => {
                      const addr = savedAddresses.find((a) => a.id === e.target.value);
                      if (addr) handleApplySavedAddress(addr, 'billing');
                    }}
                    className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] text-[11px] font-bold text-[#34150F] rounded-lg px-2 py-1"
                  >
                    <option value="">Choose Saved Address...</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>{a.label || a.attentionTo} ({a.city})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">Attention / Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.attentionTo}
                    onChange={(e) => setBillingAddress({ ...billingAddress, attentionTo: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    value={billingAddress.companyName}
                    onChange={(e) => setBillingAddress({ ...billingAddress, companyName: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.addressLine1}
                    onChange={(e) => setBillingAddress({ ...billingAddress, addressLine1: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={billingAddress.addressLine2}
                    onChange={(e) => setBillingAddress({ ...billingAddress, addressLine2: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.city}
                    onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.state}
                    onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">Postal / ZIP Code *</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.postalCode}
                    onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.phone}
                    onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#34150F] mb-1">Billing Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={billingAddress.email}
                    onChange={(e) => setBillingAddress({ ...billingAddress, email: e.target.value })}
                    className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveBilling"
                  checked={saveBilling}
                  onChange={(e) => setSaveBilling(e.target.checked)}
                  className="rounded text-[#34150F]"
                />
                <label htmlFor="saveBilling" className="text-xs text-[#85431E]">Save billing address to address book</label>
              </div>
            </div>

            {/* Step 4: Delivery Address */}
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-[#34150F] text-[#EACEAA] text-xs font-extrabold flex items-center justify-center">4</span>
                  <h3 className="font-extrabold text-[#34150F] text-sm uppercase tracking-wide">Delivery / Shipping Destination</h3>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-[#FAF5EE] p-3 rounded-xl border border-[rgba(52,21,15,0.1)]">
                <input
                  type="checkbox"
                  id="sameAsBilling"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="rounded text-[#34150F]"
                />
                <label htmlFor="sameAsBilling" className="text-xs font-bold text-[#34150F] cursor-pointer">
                  Delivery address is identical to Billing address
                </label>
              </div>

              {!sameAsBilling && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#34150F] mb-1">Site / Receiver Name *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.attentionTo}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, attentionTo: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#34150F] mb-1">Site / Company Name</label>
                    <input
                      type="text"
                      value={deliveryAddress.companyName}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, companyName: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#34150F] mb-1">Delivery Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.addressLine1}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, addressLine1: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#34150F] mb-1">Delivery Address Line 2</label>
                    <input
                      type="text"
                      value={deliveryAddress.addressLine2}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, addressLine2: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#34150F] mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#34150F] mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#34150F] mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postalCode: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#34150F] mb-1">Site Phone *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                      className="w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl px-3 py-2 text-xs text-[#34150F]"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Order & Advance Summary Card */}
          <div className="space-y-6">
            <div className="bg-[#f5e8d4] p-6 rounded-2xl border border-[rgba(52,21,15,0.15)] shadow-md sticky top-24 space-y-4">
              <h3 className="font-extrabold text-[#34150F] text-base border-b border-[rgba(52,21,15,0.1)] pb-3" style={{ fontFamily: "'Gilda Display', serif" }}>
                Commercial PO Summary
              </h3>

              {pricingSummary ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-[#85431E]">
                    <span>Quotation Subtotal:</span>
                    <span className="font-mono font-bold text-[#34150F]">₹{pricingSummary.basicPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[#85431E]">
                    <span>GST (18% / Standard):</span>
                    <span className="font-mono font-bold text-[#34150F]">₹{pricingSummary.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {pricingSummary.shippingCost > 0 && (
                    <div className="flex justify-between text-[#85431E]">
                      <span>Logistics & Freight:</span>
                      <span className="font-mono font-bold text-[#34150F]">₹{pricingSummary.shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-[rgba(52,21,15,0.12)] pt-2 flex justify-between text-sm font-extrabold text-[#34150F]">
                    <span>Total PO Value:</span>
                    <span className="font-mono">₹{pricingSummary.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Advance Required Highlight */}
                  <div className="bg-[#FAF5EE] rounded-xl p-4 border-2 border-[#D39858] space-y-2 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#85431E]">Advance Required ({pricingSummary.advancePercentage}%):</span>
                      <span className="font-mono font-black text-[#34150F] text-base">
                        ₹{pricingSummary.advanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-[#85431E]">
                      <span>Balance on Dispatch:</span>
                      <span className="font-mono font-bold">₹{pricingSummary.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[10px] text-[#85431E] leading-tight pt-1">
                      * Upon PO submission, bank account details will be emailed to you for direct NEFT/RTGS transfer.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#85431E]">Select quotation to calculate advance breakdown.</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Validating & Generating PO...</span>
                ) : (
                  <>
                    <span>Submit Purchase Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-[10px] text-[#85431E]">
                  Tamper-evident verification & auto packing list generation included.
                </span>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
