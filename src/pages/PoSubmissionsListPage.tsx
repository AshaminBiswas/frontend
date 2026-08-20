import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Eye,
  FileCheck,
  Building,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getMyPoSubmissionsApi,
  CustomerPoSubmission,
  PoSubmissionStatus,
  downloadAcknowledgementApi,
} from '../services/poSubmissionsService';
import { AsyncActionButton } from '../components/common/AsyncActionButton';

const STATUS_LABELS: Record<
  PoSubmissionStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  DRAFT: { label: 'Draft', bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  SUBMITTED: { label: 'Submitted & Under Review', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
  UNDER_REVIEW: { label: 'Active Review', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300' },
  CHANGES_REQUESTED: { label: 'Action Required', bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-300' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300' },
  ACKNOWLEDGED: { label: 'Acknowledged', bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-300' },
  REJECTED: { label: 'Declined', bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-300' },
  FULFILLMENT: { label: 'In Fulfillment', bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-300' },
};

export function PoSubmissionsListPage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [submissions, setSubmissions] = useState<CustomerPoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadSubmissions = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getMyPoSubmissionsApi({
        status: statusFilter,
        search: search.trim() || undefined,
        page,
        limit: 12,
      });
      if (res.success && res.data) {
        setSubmissions(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.totalItems);
        } else {
          setTotalCount(res.data.length);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, statusFilter, search, page]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="max-w-md w-full bg-[#FAF5EE] border border-[rgba(52,21,15,0.15)] rounded-tr-3xl rounded-bl-3xl p-8 text-center shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EACEAA] text-[#34150F] flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Purchase Order Intake Desk
          </h2>
          <p className="text-xs text-[#85431E] leading-relaxed">
            Please sign in to your PRC account to submit new purchase orders, track review status, and download formal Order Acknowledgements.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* ─── Hero / Header ───────────────────────────────────────────────────── */}
      <div className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.12)] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EACEAA] text-[#34150F] text-xs font-extrabold uppercase tracking-wider">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Direct Intake Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
            Purchase Orders & Submissions
          </h1>
          <p className="text-xs sm:text-sm text-[#85431E] leading-relaxed">
            Submit your company's native ERP Purchase Order PDF or fill our structured commercial form. Track engineering review, SKU mapping, and receive your binding Order Acknowledgement.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
          <Link
            to="/po-submissions/new"
            className="inline-flex items-center justify-center gap-2 bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] font-bold text-xs px-5 py-3 rounded-tr-xl rounded-bl-xl transition-all shadow-md group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Submit Purchase Order</span>
          </Link>
        </div>
      </div>

      {/* ─── Filters & Search ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85431E]/60" />
          <input
            type="text"
            placeholder="Search by PO number, submission ref..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF5EE] border border-[rgba(52,21,15,0.2)] rounded-xl text-xs text-[#34150F] placeholder-[#85431E]/60 focus:outline-none focus:ring-2 focus:ring-[#D39858]"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'SUBMITTED', label: 'Under Review' },
            { key: 'CHANGES_REQUESTED', label: 'Action Needed' },
            { key: 'APPROVED', label: 'Approved' },
            { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setStatusFilter(item.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === item.key
                  ? 'bg-[#34150F] text-[#EACEAA] shadow-sm'
                  : 'bg-[#FAF5EE] text-[#85431E] border border-[rgba(52,21,15,0.12)] hover:border-[#D39858]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Submissions List ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 bg-[#FAF5EE] rounded-2xl border border-[rgba(52,21,15,0.12)] animate-pulse space-y-3">
              <div className="h-4 bg-[#EACEAA] rounded w-1/3" />
              <div className="h-6 bg-[#EACEAA] rounded w-2/3" />
              <div className="h-3 bg-[#EACEAA] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center bg-[#FAF5EE] rounded-3xl border border-[rgba(52,21,15,0.12)] space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#EACEAA] text-[#34150F] flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              No Purchase Orders Found
            </h3>
            <p className="text-xs text-[#85431E]">
              {statusFilter !== 'ALL' || search
                ? 'No submissions match your active filter criteria.'
                : "You haven't submitted any external purchase orders yet."}
            </p>
          </div>
          <Link
            to="/po-submissions/new"
            className="inline-flex items-center gap-2 bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl transition-all shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Your First PO</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {submissions.map((po) => {
            const st = STATUS_LABELS[po.status] || STATUS_LABELS.SUBMITTED;
            return (
              <div
                key={po.id}
                className="bg-[#FAF5EE] border border-[rgba(52,21,15,0.14)] hover:border-[#D39858] rounded-tr-2xl rounded-bl-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#34150F] bg-[#EACEAA] px-2.5 py-1 rounded-lg">
                      {po.submissionNumber}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#85431E] uppercase">Your PO Number</span>
                    <h3 className="text-base font-extrabold text-[#34150F] truncate">{po.customerPoNumber}</h3>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-3 bg-[#f5e8d4]/60 rounded-xl space-y-1.5 text-xs text-[#85431E]">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#85431E]/80">Submission Mode:</span>
                    <span className="font-bold text-[#34150F] inline-flex items-center gap-1">
                      {po.sourceType === 'PDF_UPLOAD' ? (
                        <>
                          <Upload className="w-3 h-3 text-[#D39858]" />
                          PDF Document
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 text-[#7FB706]" />
                          Structured Form
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#85431E]/80">Order Value:</span>
                    <span className="font-mono font-bold text-[#34150F]">
                      {po.mappedTotal
                        ? `₹${Number(po.mappedTotal).toLocaleString('en-IN')}`
                        : po.statedTotal
                        ? `₹${Number(po.statedTotal).toLocaleString('en-IN')} (Stated)`
                        : 'Under Review'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#85431E]/80">Submitted Date:</span>
                    <span className="font-medium text-[#34150F]">
                      {new Date(po.submittedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-[rgba(52,21,15,0.08)] flex items-center justify-between gap-2">
                  <Link
                    to={`/po-submissions/${po.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#34150F] hover:text-[#D39858] transition-colors"
                  >
                    <span>View Timeline & Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  {po.acknowledgement && (
                    <AsyncActionButton
                      mode="download"
                      idleLabel="Ack PDF"
                      loadingLabel="..."
                      successLabel="✓"
                      variant="custom"
                      size="sm"
                      className="px-2.5 py-1 bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] font-bold text-[11px] rounded-lg transition-colors"
                      onAction={async () => {
                        await downloadAcknowledgementApi(po.id, po.acknowledgement!.ackNumber);
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
