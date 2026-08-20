import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Upload,
  FileText,
  FileCheck,
  Calendar,
  Building,
  DollarSign,
  Download,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  PackageCheck,
  Truck,
  CreditCard,
  Receipt,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getPoSubmissionByIdApi,
  getPoSubmissionTrackingApi,
  CustomerPoSubmission,
  PoTrackingData,
  PoSubmissionStatus,
  downloadAcknowledgementApi,
} from '../services/poSubmissionsService';
import { getCustomerPurchaseOrderByIdApi } from '../services/poService';
import { AsyncActionButton } from '../components/common/AsyncActionButton';

export function PoSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [po, setPo] = useState<CustomerPoSubmission | null>(null);
  const [tracking, setTracking] = useState<PoTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTrackingTab, setActiveTrackingTab] = useState<'stepper' | 'items' | 'logs'>('stepper');
  // When the ID belongs to a b2b_purchase_orders record (Standard PO form), we store the redirect target
  const [b2bPoRedirectId, setB2bPoRedirectId] = useState<string | null>(null);

  const loadPoAndTracking = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    setLoading(true);
    try {
      const [poRes, trackRes] = await Promise.all([
        getPoSubmissionByIdApi(id),
        getPoSubmissionTrackingApi(id).catch(() => null),
      ]);

      if (poRes.success && poRes.data) {
        setPo(poRes.data);
      } else {
        // ── Graceful fallback ─────────────────────────────────────────────────
        // The ID may belong to a b2b_purchase_orders record (submitted via
        // Standard PO form) rather than a po_submissions record.
        // Try the purchase-orders API; if it succeeds, redirect automatically.
        try {
          const b2bPo = await getCustomerPurchaseOrderByIdApi(id);
          if (b2bPo && b2bPo.id) {
            // Found a B2B PO — redirect to the full lifecycle page
            setB2bPoRedirectId(b2bPo.id);
            navigate(`/purchase-orders/${b2bPo.id}`, { replace: true });
            return;
          }
        } catch {
          // Not found in either table — fall through to the error state
        }
        setError(poRes.error?.message || 'Failed to load purchase order');
      }

      if (trackRes && trackRes.success && trackRes.data) {
        setTracking(trackRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, navigate]);

  useEffect(() => {
    loadPoAndTracking();
  }, [loadPoAndTracking]);

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
          <p className="text-xs text-[#85431E]">
            Please sign in to view tracking milestones and download verified commercial documents for this Purchase Order.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-3 rounded-tr-xl rounded-bl-xl shadow hover:bg-[#D39858] hover:text-[#34150F] transition-all"
          >
            Sign In to View
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-pulse" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="h-6 bg-[#FAF5EE] rounded w-1/4" />
        <div className="h-32 bg-[#FAF5EE] rounded-3xl" />
        <div className="h-64 bg-[#FAF5EE] rounded-3xl" />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#34150F]">Purchase Order Not Found</h2>
        <p className="text-xs text-[#85431E]">{error || 'Unable to locate submission details'}</p>
        <div className="flex flex-col gap-2 items-center">
          {/* If the ID may be a B2B PO, offer a direct link */}
          {id && (
            <Link
              to={`/purchase-orders/${id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#34150F] px-4 py-2 rounded-xl"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View as Purchase Order</span>
            </Link>
          )}
          <Link
            to="/profile?tab=po"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#34150F] bg-[#EACEAA] px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Purchase Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentStageNum = tracking?.currentStage || 1;
  const stages = tracking?.stages || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* ─── Top Navigation Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          to="/profile?tab=po"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Purchase Orders</span>
        </Link>

        <button
          onClick={loadPoAndTracking}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#85431E] hover:text-[#34150F] bg-[#FAF5EE] border border-[rgba(52,21,15,0.12)] px-3 py-1.5 rounded-xl shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Status</span>
        </button>
      </div>

      {/* ─── Submission Header Card ──────────────────────────────────────────── */}
      <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.12)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#34150F] bg-[#EACEAA] px-2.5 py-1 rounded-lg">
                Ref: {po.submissionNumber}
              </span>
              <span className="text-xs text-[#85431E]">
                Submitted on{' '}
                {new Date(po.submittedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              {tracking?.masterPoNumber && (
                <span className="text-xs font-bold text-teal-800 bg-teal-100 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  Fulfillment PO: {tracking.masterPoNumber}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              PO #{po.customerPoNumber}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {po.acknowledgement && (
              <AsyncActionButton
                mode="download"
                idleLabel={`Download Ack #${po.acknowledgement.ackNumber}`}
                loadingLabel="Preparing PDF..."
                successLabel="Downloaded ✓"
                variant="custom"
                className="bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] font-bold text-xs px-4 py-2.5 rounded-tr-xl rounded-bl-xl shadow transition-all inline-flex items-center gap-1.5"
                onAction={async () => {
                  await downloadAcknowledgementApi(po.id, po.acknowledgement!.ackNumber);
                }}
              />
            )}
          </div>
        </div>

        {/* ─── 8-Stage Milestone Track ───────────────────────────────────────── */}
        {po.status !== 'REJECTED' && (
          <div className="pt-4 border-t border-[rgba(52,21,15,0.08)] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#85431E] uppercase tracking-wider text-[10px]">
                End-to-End Live Tracking: Stage {currentStageNum} of 8
              </span>
              <span className="font-bold text-[#34150F]">
                {stages[currentStageNum - 1]?.title || 'Order in Process'}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {stages.map((stg) => {
                const isPassed = stg.status === 'COMPLETED';
                const isCurrent = stg.stage === currentStageNum;
                const isActionReq = stg.status === 'ACTION_REQUIRED';
                return (
                  <div
                    key={stg.stage}
                    className={`p-2 rounded-xl text-center border transition-all ${
                      isPassed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isCurrent
                        ? 'bg-[#34150F] border-[#34150F] text-[#EACEAA] shadow-md ring-2 ring-[#D39858]'
                        : isActionReq
                        ? 'bg-orange-50 border-orange-400 text-orange-800'
                        : 'bg-white/40 border-[rgba(52,21,15,0.08)] text-[#85431E]/60'
                    }`}
                  >
                    <div className="text-[10px] font-bold">
                      {isPassed ? '✓ ' : ''}Stage {stg.stage}
                    </div>
                    <div className="text-[9px] font-semibold truncate mt-0.5" title={stg.title}>
                      {stg.title.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── View Selector Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[rgba(52,21,15,0.12)] pb-2">
        <button
          onClick={() => setActiveTrackingTab('stepper')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
            activeTrackingTab === 'stepper'
              ? 'bg-[#34150F] text-[#EACEAA] shadow-sm'
              : 'text-[#85431E] hover:bg-[#FAF5EE]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>8-Stage Milestone Tracker</span>
        </button>

        <button
          onClick={() => setActiveTrackingTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
            activeTrackingTab === 'items'
              ? 'bg-[#34150F] text-[#EACEAA] shadow-sm'
              : 'text-[#85431E] hover:bg-[#FAF5EE]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Verified Order Items ({po.lineItems?.length || 0})</span>
        </button>
      </div>

      {/* ─── Tab 1: Comprehensive 8-Stage Timeline & Fulfillment Dossier ────── */}
      {activeTrackingTab === 'stepper' && (
        <div className="space-y-4">
          {stages.map((stg) => {
            const isCompleted = stg.status === 'COMPLETED';
            const isCurrent = stg.stage === currentStageNum;
            const isActionReq = stg.status === 'ACTION_REQUIRED';

            return (
              <div
                key={stg.stage}
                className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#FAF5EE] border-[#34150F]/40 shadow-md ring-1 ring-[#D39858]/30'
                    : isCompleted
                    ? 'bg-[#FAF5EE]/70 border-emerald-500/30'
                    : isActionReq
                    ? 'bg-orange-50/80 border-orange-400'
                    : 'bg-[#FAF5EE]/40 border-[rgba(52,21,15,0.08)] opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#34150F] text-[#EACEAA] ring-2 ring-[#D39858]'
                          : isActionReq
                          ? 'bg-orange-500 text-white'
                          : 'bg-[#EACEAA] text-[#85431E]'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stg.stage}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm text-[#34150F]">{stg.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCurrent
                              ? 'bg-[#34150F] text-[#EACEAA]'
                              : isActionReq
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {stg.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#85431E] leading-relaxed">{stg.description}</p>
                    </div>
                  </div>

                  {stg.timestamp && (
                    <div className="text-[11px] text-[#85431E]/70 sm:text-right flex-shrink-0">
                      <span>
                        {new Date(stg.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stage Artifacts & Documents Download */}
                {stg.artifacts && stg.artifacts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[rgba(52,21,15,0.08)] flex flex-wrap gap-2">
                    {stg.artifacts.map((art, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[rgba(52,21,15,0.15)] text-xs font-semibold text-[#34150F] shadow-sm"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>{art.label}</span>
                        {art.reference && (
                          <span className="font-mono text-[10px] text-[#85431E] bg-[#EACEAA]/50 px-1.5 py-0.5 rounded">
                            {art.reference}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Tab 2: Verified Line Items Table ─────────────────────────────────── */}
      {activeTrackingTab === 'items' && (
        <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.12)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Verified Line Items ({po.lineItems?.length || 0})
            </h2>
            <span className="text-[11px] font-bold text-[#85431E] uppercase">
              {po.sourceType === 'PDF_UPLOAD' ? 'Mapped by PRC Engineering Desk' : 'Customer Submitted Lines'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] font-bold text-[#85431E] uppercase border-b border-[rgba(52,21,15,0.12)]">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(52,21,15,0.08)]">
                {po.lineItems?.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-3 text-[#85431E]/70">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-[#34150F]">{item.description}</td>
                    <td className="py-3 px-3 font-mono text-[#D39858]">{item.sku || '—'}</td>
                    <td className="py-3 px-3 text-center font-bold text-[#34150F]">
                      {item.quantity} {item.unit || 'PCS'}
                    </td>
                    <td className="py-3 px-3 text-right text-[#85431E]">
                      ₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#34150F]">
                      ₹{Number(item.lineTotal || item.quantity * item.unitPrice).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Commercial & Addresses Card ─────────────────────────────────────── */}
      {po.billToAddress && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-[#FAF5EE] rounded-2xl border border-[rgba(52,21,15,0.12)] space-y-1.5 text-xs shadow-sm">
            <span className="text-[10px] font-bold text-[#85431E] uppercase">Billing Address</span>
            <p className="font-bold text-[#34150F]">{po.billToAddress.attentionTo}</p>
            {po.billToAddress.companyName && <p className="text-[#85431E]">{po.billToAddress.companyName}</p>}
            <p className="text-[#85431E]">{po.billToAddress.addressLine1}</p>
            <p className="text-[#85431E]">
              {po.billToAddress.city}, {po.billToAddress.state} - {po.billToAddress.postalCode}
            </p>
            <p className="text-[#85431E]">Phone: {po.billToAddress.phone}</p>
          </div>

          <div className="p-5 bg-[#FAF5EE] rounded-2xl border border-[rgba(52,21,15,0.12)] space-y-1.5 text-xs shadow-sm">
            <span className="text-[10px] font-bold text-[#85431E] uppercase">Delivery Address</span>
            <p className="font-bold text-[#34150F]">{po.shipToAddress?.attentionTo || po.billToAddress.attentionTo}</p>
            <p className="text-[#85431E]">{po.shipToAddress?.addressLine1 || po.billToAddress.addressLine1}</p>
            <p className="text-[#85431E]">
              {po.shipToAddress?.city || po.billToAddress.city}, {po.shipToAddress?.state || po.billToAddress.state}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
