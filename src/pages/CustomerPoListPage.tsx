import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCustomerPurchaseOrdersApi,
  downloadPoPdf,
  deletePurchaseOrderApi,
  CustomerPurchaseOrder,
} from '../services/poService';
import {
  FileText,
  Plus,
  ArrowRight,
  Download,
  Trash2,
  Search,
  X,
  Clock,
  CheckCircle2,
  Truck,
  Receipt,
  Building,
  DollarSign,
  Layers,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  Package,
  Calendar,
  ChevronRight,
  Filter,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List,
  AlertCircle,
  FileCheck,
  Box,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { AsyncActionButton } from '../components/common/AsyncActionButton';

/* ─── Skeleton Loading Body for Customer PO List ───────────────────────────── */

export function CustomerPoListPageSkeleton() {
  return (
    <div
      className="min-h-screen bg-[#FAF5EE] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 animate-pulse text-[#34150F]"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(52,21,15,0.08)] pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-64 bg-[#EACEAA]/50 rounded-xl"></div>
              <div className="h-5 w-28 bg-[#EACEAA]/40 rounded-full"></div>
            </div>
            <div className="h-4 w-96 bg-[#EACEAA]/35 rounded"></div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-36 bg-[#34150F]/20 rounded-xl"></div>
            <div className="h-10 w-28 bg-[#EACEAA]/40 rounded-xl"></div>
          </div>
        </div>

        {/* 4 KPI Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white border border-[rgba(52,21,15,0.08)] space-y-2.5 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-[#EACEAA]/40 rounded"></div>
                <div className="w-8 h-8 rounded-xl bg-[#EACEAA]/40"></div>
              </div>
              <div className="h-7 w-28 bg-[#EACEAA]/50 rounded"></div>
              <div className="h-2.5 w-32 bg-[#EACEAA]/35 rounded"></div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar Skeleton */}
        <div className="p-3.5 bg-white rounded-2xl border border-[rgba(52,21,15,0.08)] flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-28 bg-[#EACEAA]/40 rounded-xl"></div>
            ))}
          </div>
          <div className="h-9 w-64 bg-[#EACEAA]/40 rounded-xl"></div>
        </div>

        {/* PO Cards Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-[rgba(52,21,15,0.08)] space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="h-5 w-36 bg-[#EACEAA]/50 rounded"></div>
                  <div className="h-3 w-44 bg-[#EACEAA]/40 rounded"></div>
                </div>
                <div className="h-6 w-28 bg-[#EACEAA]/40 rounded-full"></div>
              </div>
              <div className="h-2.5 w-full bg-[#EACEAA]/30 rounded-full"></div>
              <div className="bg-[#FAF5EE] p-3.5 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-4 w-24 bg-[#EACEAA]/50 rounded"></div>
                  <div className="h-4 w-24 bg-[#EACEAA]/50 rounded"></div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[rgba(52,21,15,0.06)]">
                <div className="h-3 w-28 bg-[#EACEAA]/40 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-[#EACEAA]/40 rounded-lg"></div>
                  <div className="h-8 w-20 bg-[#EACEAA]/40 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Lifecycle Stage Mapping & Helpers ─────────────────────────────────────── */

interface LifecycleStage {
  step: number;
  label: string;
  isCurrent: boolean;
  isCompleted: boolean;
}

function getPoLifecycle(status: string): LifecycleStage[] {
  const STAGES = [
    { step: 1, label: 'PO Created', keys: ['DRAFT', 'SUBMITTED', 'AWAITING_ADVANCE_PAYMENT'] },
    { step: 2, label: 'Advance Payment', keys: ['PAYMENT_RECEIPT_SUBMITTED', 'PAYMENT_ACKNOWLEDGED'] },
    { step: 3, label: 'Payment Verified', keys: ['PAYMENT_VERIFIED'] },
    { step: 4, label: 'Packing & QC', keys: ['PACKING_LIST_GENERATED'] },
    { step: 5, label: 'Dispatched / Invoiced', keys: ['DISPATCHED', 'INVOICED'] },
  ];

  let currentStep = 1;
  if (['PAYMENT_RECEIPT_SUBMITTED', 'PAYMENT_ACKNOWLEDGED'].includes(status)) currentStep = 2;
  else if (status === 'PAYMENT_VERIFIED') currentStep = 3;
  else if (status === 'PACKING_LIST_GENERATED') currentStep = 4;
  else if (['DISPATCHED', 'INVOICED'].includes(status)) currentStep = 5;
  else if (['CANCELLED', 'REJECTED'].includes(status)) currentStep = 0;

  return STAGES.map((s) => ({
    step: s.step,
    label: s.label,
    isCurrent: s.step === currentStep,
    isCompleted: s.step < currentStep || currentStep === 5,
  }));
}

function getStatusBadgeDetails(status: string) {
  switch (status) {
    case 'INVOICED':
      return {
        label: 'Invoiced & Completed',
        className: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
        icon: <FileCheck className="w-3 h-3 text-purple-700" />,
      };
    case 'DISPATCHED':
      return {
        label: 'Dispatched in Transit',
        className: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
        icon: <Truck className="w-3 h-3 text-cyan-700" />,
      };
    case 'PACKING_LIST_GENERATED':
      return {
        label: 'Packing List Ready',
        className: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        icon: <Package className="w-3 h-3 text-emerald-700" />,
      };
    case 'PAYMENT_VERIFIED':
      return {
        label: 'Advance Verified',
        className: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-700" />,
      };
    case 'PAYMENT_ACKNOWLEDGED':
      return {
        label: 'Receipt Acknowledged',
        className: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
        icon: <CreditCard className="w-3 h-3 text-blue-700" />,
      };
    case 'PAYMENT_RECEIPT_SUBMITTED':
      return {
        label: 'Receipt Under Review',
        className: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
        icon: <Clock className="w-3 h-3 text-amber-700" />,
      };
    case 'AWAITING_ADVANCE_PAYMENT':
    case 'SUBMITTED':
      return {
        label: 'Awaiting Advance',
        className: 'bg-[#34150F] text-[#EACEAA] border-[#34150F] font-bold shadow-sm',
        icon: <AlertCircle className="w-3 h-3 text-[#EACEAA]" />,
      };
    case 'CANCELLED':
    case 'REJECTED':
      return {
        label: 'Cancelled',
        className: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
        icon: <X className="w-3 h-3 text-rose-700" />,
      };
    default:
      return {
        label: status.replace(/_/g, ' '),
        className: 'bg-stone-100 text-stone-800 border-stone-200 font-bold',
        icon: <FileText className="w-3 h-3 text-stone-600" />,
      };
  }
}

/* ─── Main Component: Customer Purchase Orders Hub ─────────────────────────── */

export function CustomerPoListPage() {
  const navigate = useNavigate();
  const [pos, setPos] = useState<CustomerPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Quick Inspector Modal State
  const [inspectingPo, setInspectingPo] = useState<CustomerPurchaseOrder | null>(null);

  const loadPOs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomerPurchaseOrdersApi({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setPos(res.items || []);
    } catch (err) {
      console.error('[Customer PO List Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPOs();
  }, [loadPOs]);

  // Handle PO Deletion with user confirmation
  const handleDeletePo = async (e: React.MouseEvent, poId: string, poNumber: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to cancel and delete Purchase Order "${poNumber}"?`)) {
      return;
    }
    try {
      await deletePurchaseOrderApi(poId);
      await loadPOs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete Purchase Order');
    }
  };

  // Compute live filter statistics & financial aggregations
  const metrics = useMemo(() => {
    const totalCount = pos.length;
    const totalValue = pos.reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);
    const awaitingAdvanceCount = pos.filter((p) =>
      ['AWAITING_ADVANCE_PAYMENT', 'SUBMITTED', 'DRAFT'].includes(p.status)
    ).length;
    const underReviewCount = pos.filter((p) =>
      ['PAYMENT_RECEIPT_SUBMITTED', 'PAYMENT_ACKNOWLEDGED'].includes(p.status)
    ).length;
    const verifiedReadyCount = pos.filter((p) =>
      ['PAYMENT_VERIFIED', 'PACKING_LIST_GENERATED', 'DISPATCHED', 'INVOICED'].includes(p.status)
    ).length;

    return { totalCount, totalValue, awaitingAdvanceCount, underReviewCount, verifiedReadyCount };
  }, [pos]);

  // Client-side search and multi-criteria sorting
  const processedPos = useMemo(() => {
    let list = [...pos];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((p) => {
        const poMatch = p.poNumber?.toLowerCase().includes(q);
        const quoteMatch = p.quotationNumber?.toLowerCase().includes(q);
        const refMatch = p.customerPoReferenceNumber?.toLowerCase().includes(q);
        const itemMatch = p.items?.some((i) =>
          i.productName.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q)
        );
        return poMatch || quoteMatch || refMatch || itemMatch;
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      if (sortBy === 'amount_desc') {
        return Number(b.totalAmount) - Number(a.totalAmount);
      }
      if (sortBy === 'amount_asc') {
        return Number(a.totalAmount) - Number(b.totalAmount);
      }
      return 0;
    });

    return list;
  }, [pos, search, sortBy]);

  // Export CSV Ledger
  const handleExportLedger = async () => {
    if (processedPos.length === 0) return;
    const headers = [
      'PO Number',
      'Quotation Ref',
      'Customer Ref',
      'Status',
      'Items Count',
      'Subtotal (INR)',
      'Tax Total (INR)',
      'Total Amount (INR)',
      'Advance Required (INR)',
      'Balance Due (INR)',
      'Submission Date',
    ];
    const rows = processedPos.map((p) => [
      `"${p.poNumber}"`,
      `"${p.quotationNumber}"`,
      `"${p.customerPoReferenceNumber || ''}"`,
      `"${p.status}"`,
      `"${p.items?.length || 0}"`,
      `"${p.subtotal}"`,
      `"${p.taxTotal}"`,
      `"${p.totalAmount}"`,
      `"${p.advanceAmount}"`,
      `"${p.balanceAmount}"`,
      `"${new Date(p.submittedAt).toISOString()}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PRC_Purchase_Orders_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && pos.length === 0) {
    return <CustomerPoListPageSkeleton />;
  }

  return (
    <div
      className="min-h-screen bg-[#FAF5EE] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-[#34150F] selection:bg-[#7FB706] selection:text-white"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* ─── Top Header & Primary Navigation ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[rgba(52,21,15,0.08)] pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#34150F] tracking-tight"
                style={{ fontFamily: "'Gilda Display', serif" }}
              >
                Purchase Orders (POs)
              </h1>
              <span className="text-[11px] font-black px-3 py-0.5 rounded-full bg-[#7FB706]/15 text-[#5B8304] border border-[#7FB706]/30 uppercase tracking-wider">
                B2B Procurement
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#85431E] leading-relaxed max-w-2xl">
              Track multi-stage industrial procurement contracts, upload RTGS/NEFT advance receipts, inspect package manifests, and download tax invoices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/purchase-orders/create')}
              className="bg-[#34150F] text-[#EACEAA] text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Generate New PO</span>
            </button>

            <AsyncActionButton
              mode="download"
              onAction={handleExportLedger}
              idleIcon={<Download className="w-3.5 h-3.5" />}
              idleLabel="Export Ledger"
              loadingLabel="Exporting…"
              successLabel="Exported!"
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF5EE] text-[#34150F] font-bold border border-[rgba(52,21,15,0.12)] flex items-center gap-1.5 transition-all text-xs shadow-sm hover:shadow"
              variant="custom"
              title="Export POs to CSV"
            />

            <button
              type="button"
              onClick={loadPOs}
              className="p-2.5 rounded-xl bg-white border border-[rgba(52,21,15,0.12)] text-[#85431E] hover:text-[#34150F] hover:bg-[#FAF5EE] transition-colors shadow-sm"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#7FB706]' : ''}`} />
            </button>
          </div>
        </div>

        {/* ─── 4 Executive KPI Metrics Cards (Interactive Filter Triggers) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all text-left space-y-1.5 group shadow-sm ${
              statusFilter === 'ALL'
                ? 'border-[#7FB706] ring-2 ring-[#7FB706]/20 bg-[#7FB706]/5'
                : 'border-[rgba(52,21,15,0.08)] hover:border-[#7FB706]/40 hover:shadow'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#85431E]">
                Total Orders
              </span>
              <div className="w-8 h-8 rounded-xl bg-[rgba(52,21,15,0.05)] flex items-center justify-center text-[#85431E] group-hover:text-[#34150F]">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-[#34150F]">
              {metrics.totalCount} <span className="text-xs text-[#85431E] font-normal">POs</span>
            </p>
            <span className="text-[11px] text-[#85431E]/80 block font-mono">
              ₹{metrics.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Value
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('AWAITING_ADVANCE_PAYMENT')}
            className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all text-left space-y-1.5 group shadow-sm ${
              statusFilter === 'AWAITING_ADVANCE_PAYMENT'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50'
                : 'border-[rgba(52,21,15,0.08)] hover:border-amber-500/40 hover:shadow'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800">
                Action Required
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-amber-800">
              {metrics.awaitingAdvanceCount} <span className="text-xs text-amber-700 font-normal">POs</span>
            </p>
            <span className="text-[11px] text-amber-800/80 block">Advance due to lock inventory</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PAYMENT_RECEIPT_SUBMITTED')}
            className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all text-left space-y-1.5 group shadow-sm ${
              statusFilter === 'PAYMENT_RECEIPT_SUBMITTED'
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50'
                : 'border-[rgba(52,21,15,0.08)] hover:border-blue-500/40 hover:shadow'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-800">
                Receipts Under Review
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-blue-800">
              {metrics.underReviewCount} <span className="text-xs text-blue-700 font-normal">POs</span>
            </p>
            <span className="text-[11px] text-blue-800/80 block">Finance audit in progress</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PACKING_LIST_GENERATED')}
            className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all text-left space-y-1.5 group shadow-sm ${
              statusFilter === 'PACKING_LIST_GENERATED'
                ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/50'
                : 'border-[rgba(52,21,15,0.08)] hover:border-emerald-500/40 hover:shadow'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800">
                Ready / Dispatched
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono text-emerald-800">
              {metrics.verifiedReadyCount} <span className="text-xs text-emerald-700 font-normal">POs</span>
            </p>
            <span className="text-[11px] text-emerald-800/80 block">Packing lists & invoices ready</span>
          </button>
        </div>

        {/* ─── Search, Status Tabs & View Toggle Bar ─── */}
        <div className="p-3.5 bg-white rounded-2xl border border-[rgba(52,21,15,0.08)] flex flex-wrap items-center justify-between gap-3 shadow-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold pb-1 sm:pb-0 scrollbar-thin">
            {[
              { id: 'ALL', label: `All (${pos.length})` },
              { id: 'AWAITING_ADVANCE_PAYMENT', label: `Awaiting Advance (${metrics.awaitingAdvanceCount})` },
              { id: 'PAYMENT_RECEIPT_SUBMITTED', label: `Under Review (${metrics.underReviewCount})` },
              { id: 'PACKING_LIST_GENERATED', label: `Packing Ready (${metrics.verifiedReadyCount})` },
              { id: 'DISPATCHED', label: 'Dispatched' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-[#34150F] text-[#EACEAA] shadow-sm'
                    : 'text-[#85431E] hover:bg-[#FAF5EE] hover:text-[#34150F]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Sort & View Mode */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-initial justify-end">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#85431E]/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PO, quote, SKU..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-[rgba(52,21,15,0.12)] text-xs text-[#34150F] placeholder-[#85431E]/40 focus:outline-none focus:border-[#7FB706] bg-[#FAF5EE]/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60 hover:text-[#34150F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FAF5EE]/60 border border-[rgba(52,21,15,0.12)] text-xs text-[#34150F] font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#7FB706]"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#FAF5EE] p-1 rounded-xl border border-[rgba(52,21,15,0.08)]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow text-[#34150F]' : 'text-[#85431E] hover:text-[#34150F]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow text-[#34150F]' : 'text-[#85431E] hover:text-[#34150F]'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── PO Records List / Grid ─── */}
        {processedPos.length === 0 ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl border border-[rgba(52,21,15,0.08)] shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-[#FAF5EE] text-[#85431E] rounded-2xl flex items-center justify-center mx-auto border border-[rgba(52,21,15,0.08)] shadow-inner">
              <FileText className="w-8 h-8 text-[#85431E]" />
            </div>
            <h3
              className="text-xl font-bold text-[#34150F]"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              No Purchase Orders Found
            </h3>
            <p className="text-xs sm:text-sm text-[#85431E] max-w-md mx-auto leading-relaxed">
              {search
                ? `No purchase orders matched your search "${search}". Try adjusting your keywords or clearing the filter.`
                : 'You have no purchase orders under this status. You can generate a new PO instantly from your approved bulk price quotations.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="px-4 py-2 rounded-xl bg-white border border-[rgba(52,21,15,0.12)] text-xs font-bold text-[#34150F] hover:bg-[#FAF5EE]"
                >
                  Clear Search
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/purchase-orders/create')}
                className="bg-[#34150F] text-[#EACEAA] text-xs font-bold px-6 py-2.5 rounded-xl shadow-md hover:bg-[#D39858] hover:text-[#34150F] transition-all"
              >
                Generate a Purchase Order
              </button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* ─── Table / Ledger View ─── */
          <div className="bg-white rounded-2xl border border-[rgba(52,21,15,0.08)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EE] text-[#85431E] border-b border-[rgba(52,21,15,0.08)] font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">PO Number & Date</th>
                    <th className="py-3.5 px-4">Quotation Ref</th>
                    <th className="py-3.5 px-4">Status & Stage</th>
                    <th className="py-3.5 px-4 text-center">Items</th>
                    <th className="py-3.5 px-4 text-right">Total (INR)</th>
                    <th className="py-3.5 px-4 text-right">Advance Due</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(52,21,15,0.06)]">
                  {processedPos.map((po) => {
                    const badge = getStatusBadgeDetails(po.status);
                    const isDispatched = ['DISPATCHED', 'INVOICED'].includes(po.status);

                    return (
                      <tr
                        key={po.id}
                        onClick={() => navigate(`/purchase-orders/${po.id}`)}
                        className="hover:bg-[#FAF5EE]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-mono font-bold text-[#34150F] group-hover:text-[#5B8304] transition-colors">
                            {po.poNumber}
                          </p>
                          <p className="text-[10px] text-[#85431E]">
                            {new Date(po.submittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-[#34150F]">{po.quotationNumber}</p>
                          {po.customerPoReferenceNumber && (
                            <p className="text-[10px] text-[#85431E] font-mono">
                              Ref: {po.customerPoReferenceNumber}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full border ${badge.className}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-[#34150F]">
                            {po.items?.length || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#34150F]">
                          ₹{Number(po.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-900">
                          ₹{Number(po.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setInspectingPo(po)}
                              className="p-1.5 bg-white hover:bg-[#FAF5EE] text-[#34150F] rounded-lg border border-[rgba(52,21,15,0.1)] transition-colors"
                              title="Quick Inspect"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <AsyncActionButton
                              mode="download"
                              onAction={() => downloadPoPdf(po.id, po.poNumber)}
                              idleIcon={<Download className="w-3.5 h-3.5 text-[#85431E]" />}
                              idleLabel=""
                              loadingLabel="…"
                              successLabel="✓"
                              className="p-1.5 bg-white hover:bg-[#FAF5EE] text-[#34150F] rounded-lg border border-[rgba(52,21,15,0.1)] transition-colors shadow-sm"
                              variant="custom"
                              title="Download Proforma Invoice (PI)"
                            />

                            {!isDispatched && (
                              <button
                                type="button"
                                onClick={(e) => handleDeletePo(e, po.id, po.poNumber)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors"
                                title="Delete PO"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ─── Grid View with Lifecycle Stepper ─── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {processedPos.map((po) => {
              const badge = getStatusBadgeDetails(po.status);
              const lifecycle = getPoLifecycle(po.status);
              const isDispatched = ['DISPATCHED', 'INVOICED'].includes(po.status);
              const isAwaitingAdvance = ['AWAITING_ADVANCE_PAYMENT', 'SUBMITTED', 'DRAFT'].includes(po.status);
              const advancePercent = po.advancePercentage || 30;

              return (
                <div
                  key={po.id}
                  onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[rgba(52,21,15,0.08)] shadow-sm hover:shadow-md hover:border-[#7FB706]/40 transition-all cursor-pointer space-y-4 group relative overflow-hidden"
                >
                  {/* Card Header: PO Number, Quotation & Status Badge */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base sm:text-lg text-[#34150F] group-hover:text-[#5B8304] transition-colors">
                          {po.poNumber}
                        </span>
                        {po.customerPoReferenceNumber && (
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAF5EE] rounded-md border border-[rgba(52,21,15,0.08)] text-[#85431E]">
                            Ref: {po.customerPoReferenceNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#85431E] flex items-center gap-1">
                        <span>Quotation:</span>
                        <strong className="text-[#34150F] font-semibold">{po.quotationNumber}</strong>
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] px-3 py-1 rounded-full border ${badge.className} flex-shrink-0`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Visual 5-Stage Lifecycle Stepper */}
                  <div className="bg-[#FAF5EE]/70 p-3 rounded-xl border border-[rgba(52,21,15,0.06)] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#85431E]">
                      <span>Procurement Lifecycle</span>
                      <span className="font-mono text-[#34150F]">
                        {po.status === 'INVOICED' ? 'Complete (100%)' : isDispatched ? 'Dispatched' : 'In Progress'}
                      </span>
                    </div>

                    {/* Stepper Track */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {lifecycle.map((stage) => (
                        <div key={stage.step} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              stage.isCompleted
                                ? 'bg-emerald-500'
                                : stage.isCurrent
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-[#EACEAA]/40'
                            }`}
                          />
                          <span
                            className={`text-[9px] block truncate text-center ${
                              stage.isCurrent
                                ? 'font-black text-[#34150F]'
                                : stage.isCompleted
                                ? 'font-semibold text-emerald-800'
                                : 'text-[#85431E]/50'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial & Advance Summary Box */}
                  <div className="bg-[#FAF5EE] p-4 rounded-xl border border-[rgba(52,21,15,0.06)] space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[#85431E] block font-semibold uppercase tracking-wider">
                          Total Contract
                        </span>
                        <span className="font-mono font-black text-[#34150F] text-base">
                          ₹{Number(po.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#85431E] block font-semibold uppercase tracking-wider">
                          Advance Required ({advancePercent}%)
                        </span>
                        <span className="font-mono font-black text-amber-900 text-base">
                          ₹{Number(po.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Advance vs Balance Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#85431E] font-mono">
                        <span>Advance: ₹{Number(po.advanceAmount).toLocaleString()}</span>
                        <span>Balance: ₹{Number(po.balanceAmount).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-[#EACEAA]/50 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-amber-500 h-full"
                          style={{ width: `${advancePercent}%` }}
                          title={`Advance: ${advancePercent}%`}
                        />
                        <div
                          className="bg-[#34150F]/20 h-full flex-1"
                          title={`Balance: ${100 - advancePercent}%`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items Preview */}
                  {po.items && po.items.length > 0 && (
                    <div className="text-xs text-[#85431E] flex items-center justify-between px-1">
                      <span className="flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-[#85431E]" />
                        <span>
                          <strong>{po.items.length}</strong> items: {po.items[0]?.productName}
                          {po.items.length > 1 && ` +${po.items.length - 1} more`}
                        </span>
                      </span>
                      <span className="text-[10px] text-[#85431E]/70 font-mono">
                        {new Date(po.submittedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[rgba(52,21,15,0.06)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2">
                      <AsyncActionButton
                        mode="download"
                        onAction={() => downloadPoPdf(po.id, po.poNumber)}
                        idleIcon={<Download className="w-3.5 h-3.5 text-[#85431E]" />}
                        idleLabel="PI (PDF)"
                        loadingLabel="Generating…"
                        successLabel="✓ Downloaded"
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF5EE] text-[#34150F] font-bold border border-[rgba(52,21,15,0.12)] flex items-center gap-1.5 transition-colors text-xs shadow-sm"
                        variant="custom"
                        title="Download Proforma Invoice (PI)"
                      />

                      <button
                        type="button"
                        onClick={() => setInspectingPo(po)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF5EE] text-[#34150F] font-bold border border-[rgba(52,21,15,0.12)] flex items-center gap-1 transition-colors text-xs shadow-sm"
                        title="Quick View Items"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#85431E]" />
                        <span>Inspect</span>
                      </button>

                      {!isDispatched && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePo(e, po.id, po.poNumber)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                          title="Cancel and Delete PO"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
                        isAwaitingAdvance
                          ? 'bg-[#34150F] text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F] shadow-sm'
                          : 'text-[#34150F] hover:text-[#5B8304] bg-[#FAF5EE] hover:bg-[#EACEAA]/40'
                      }`}
                    >
                      <span>{isAwaitingAdvance ? 'Pay Advance →' : 'View Details'}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ─── QUICK INSPECTOR MODAL ─── */}
      {inspectingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[rgba(52,21,15,0.12)] max-w-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col font-sans">
            {/* Modal Header */}
            <div className="p-5 bg-[#FAF5EE] border-b border-[rgba(52,21,15,0.08)] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#85431E]">
                  Purchase Order Inspection
                </span>
                <h3
                  className="text-lg font-bold text-[#34150F] font-mono"
                >
                  {inspectingPo.poNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingPo(null)}
                className="p-1.5 rounded-xl bg-white hover:bg-[#FAF5EE] text-[#85431E] border border-[rgba(52,21,15,0.1)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Reference Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAF5EE] rounded-2xl border border-[rgba(52,21,15,0.06)]">
                <div>
                  <span className="text-[10px] text-[#85431E] block font-semibold">Quotation Reference</span>
                  <span className="font-bold text-[#34150F]">{inspectingPo.quotationNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#85431E] block font-semibold">Customer PO Ref</span>
                  <span className="font-bold text-[#34150F] font-mono">
                    {inspectingPo.customerPoReferenceNumber || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#85431E] block font-semibold">Status</span>
                  <span className="font-bold text-[#5B8304]">{inspectingPo.status.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[rgba(52,21,15,0.08)] rounded-2xl overflow-hidden">
                <div className="p-2.5 bg-[#FAF5EE] font-bold text-[#34150F] border-b border-[rgba(52,21,15,0.08)]">
                  Ordered Line Items ({inspectingPo.items?.length || 0})
                </div>
                <div className="divide-y divide-[rgba(52,21,15,0.06)] max-h-48 overflow-y-auto">
                  {inspectingPo.items?.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-[#34150F]">{item.productName}</p>
                        <p className="text-[10px] text-[#85431E] font-mono">
                          SKU: {item.sku || 'N/A'} • Qty: {item.quantity} {item.unit}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-[#34150F]">
                        ₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-[#FAF5EE] rounded-2xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#85431E]">
                  <span>Subtotal:</span>
                  <span>₹{Number(inspectingPo.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[#85431E]">
                  <span>GST & Tax Total (18%):</span>
                  <span>₹{Number(inspectingPo.taxTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-[#34150F] text-sm pt-2 border-t border-[rgba(52,21,15,0.08)]">
                  <span>Grand Total:</span>
                  <span>₹{Number(inspectingPo.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>Advance Due ({inspectingPo.advancePercentage}%):</span>
                  <span>₹{Number(inspectingPo.advanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF5EE] border-t border-[rgba(52,21,15,0.08)] flex justify-between items-center">
              <button
                type="button"
                onClick={() => setInspectingPo(null)}
                className="px-4 py-2 bg-white hover:bg-[#FAF5EE] rounded-xl text-xs font-bold text-[#34150F] border border-[rgba(52,21,15,0.12)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = inspectingPo.id;
                  setInspectingPo(null);
                  navigate(`/purchase-orders/${targetId}`);
                }}
                className="px-5 py-2 bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5"
              >
                <span>Open Full PO Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
