import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCustomerPurchaseOrdersApi,
  downloadPoPdf,
  deletePurchaseOrderApi,
  CustomerPurchaseOrder,
} from '../services/poService';
import { FileText, Plus, ArrowRight, Download, Trash2 } from 'lucide-react';

export function CustomerPoListPage() {
  const navigate = useNavigate();
  const [pos, setPos] = useState<CustomerPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function load() {
    setLoading(true);
    try {
      const res = await getCustomerPurchaseOrdersApi({ status: statusFilter });
      setPos(res.items);
    } catch (err) {
      console.error('Failed to load POs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleDeletePo = async (e: React.MouseEvent, poId: string, poNumber: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to cancel and delete Purchase Order "${poNumber}"?`)) {
      return;
    }
    try {
      await deletePurchaseOrderApi(poId);
      alert(`Purchase Order ${poNumber} deleted.`);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to delete Purchase Order');
    }
  };

  return (
    <div className="min-h-screen bg-[#EACEAA] py-10 px-4 sm:px-6 lg:px-8" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              My Purchase Orders (POs)
            </h1>
            <p className="text-xs text-[#85431E]">
              Track submitted purchase orders, manage advance payments, and download commercial packing lists.
            </p>
          </div>
          <button
            onClick={() => navigate('/purchase-orders/create')}
            className="bg-[#34150F] text-[#EACEAA] text-xs font-bold px-5 py-3 rounded-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md flex items-center space-x-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New PO</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-bold">
          {['ALL', 'AWAITING_ADVANCE_PAYMENT', 'PAYMENT_RECEIPT_SUBMITTED', 'PAYMENT_ACKNOWLEDGED', 'PACKING_LIST_GENERATED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#34150F] text-[#EACEAA] shadow-sm'
                  : 'bg-[#f5e8d4] text-[#85431E] hover:bg-[#D39858]/30 border border-[rgba(52,21,15,0.1)]'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-[#34150F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-bold text-[#34150F]">Loading Purchase Orders...</p>
          </div>
        ) : pos.length === 0 ? (
          <div className="bg-[#f5e8d4] p-12 rounded-3xl border border-[rgba(52,21,15,0.15)] shadow-md text-center space-y-4">
            <FileText className="w-12 h-12 text-[#85431E] mx-auto" />
            <h3 className="text-lg font-bold text-[#34150F]">No Purchase Orders Found</h3>
            <p className="text-xs text-[#85431E] max-w-sm mx-auto">
              You have not submitted any Purchase Orders yet. Start a PO from your approved quotations.
            </p>
            <button
              onClick={() => navigate('/purchase-orders/create')}
              className="bg-[#34150F] text-[#EACEAA] text-xs font-bold px-6 py-2.5 rounded-xl shadow"
            >
              Start a Purchase Order
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pos.map((po) => {
              const isDispatched = ['DISPATCHED', 'INVOICED'].includes(po.status);
              return (
                <div
                  key={po.id}
                  onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  className="bg-[#f5e8d4] p-5 rounded-2xl border border-[rgba(52,21,15,0.12)] shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-extrabold text-sm text-[#34150F]">{po.poNumber}</span>
                      <p className="text-[11px] text-[#85431E]">Quotation: <strong>{po.quotationNumber}</strong></p>
                    </div>
                    <span className="bg-[#34150F] text-[#EACEAA] text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {po.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="bg-[#FAF5EE] p-3 rounded-xl border border-[rgba(52,21,15,0.08)] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#85431E] block">Total Amount</span>
                      <span className="font-mono font-bold text-[#34150F]">₹{Number(po.totalAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#85431E] block">Advance Due ({po.advancePercentage}%)</span>
                      <span className="font-mono font-bold text-amber-900">₹{Number(po.advanceAmount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-[#85431E] pt-1">
                    <span>Date: {new Date(po.submittedAt).toLocaleDateString('en-IN')}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPoPdf(po.id, po.poNumber);
                        }}
                        className="px-2 py-1 rounded bg-[#FAF5EE] hover:bg-[#EACEAA] text-[#34150F] font-bold border border-[rgba(52,21,15,0.15)] flex items-center space-x-1 transition-colors"
                        title="Download PO PDF"
                      >
                        <Download className="w-3 h-3 text-[#85431E]" />
                        <span>PO PDF</span>
                      </button>

                      {!isDispatched && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePo(e, po.id, po.poNumber)}
                          className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                          title="Delete / Cancel Purchase Order"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      )}

                      <div className="flex items-center text-[#34150F] font-bold space-x-1 hover:text-[#D39858]">
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

