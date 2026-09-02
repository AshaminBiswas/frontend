/**
 * VerifyProformaInvoicePage.tsx
 *
 * Public QR-code scan landing page for Proforma Invoice authenticity verification.
 * URL pattern: /verify/pi/:token
 *
 * Calls: GET /api/v1/proforma-invoices/verify/:token
 * Returns a full verification result — signed / unsigned / tampered.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck, ShieldX, ShieldAlert, QrCode, FileText,
  CheckCircle2, XCircle, AlertTriangle, Clock, Download,
  Building2, User, Hash, Calendar, DollarSign, ChevronRight, RefreshCw
} from 'lucide-react';
import { proformaInvoiceService, ProformaInvoiceVerificationResult } from '../services/proformaInvoiceService';

type VerifyState = 'loading' | 'valid' | 'unsigned' | 'tampered' | 'not_found' | 'error';

function formatINR(value: number): string {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso || iso === 'N/A') return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function VerifyProformaInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<ProformaInvoiceVerificationResult | null>(null);
  const [verifyState, setVerifyState] = useState<VerifyState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const verifyToken = async () => {
    if (!token) {
      setVerifyState('not_found');
      setErrorMsg('No verification token provided in URL.');
      return;
    }

    setVerifyState('loading');
    setErrorMsg('');
    try {
      const res = await proformaInvoiceService.verifyToken(token);
      if (!res.success || !res.data) {
        setVerifyState('not_found');
        setErrorMsg(res.error?.message || 'Proforma Invoice not found for this verification token.');
        return;
      }

      const data = res.data;
      setResult(data);

      if (data.tamperDetected) {
        setVerifyState('tampered');
      } else if (!data.isValid) {
        setVerifyState('unsigned');
      } else {
        setVerifyState('valid');
      }
    } catch (err: any) {
      setVerifyState('error');
      setErrorMsg(err?.message || 'Verification service unavailable. Please try again.');
    }
  };

  useEffect(() => {
    verifyToken();
  }, [token]);

  // ── Hero badge config per state ──────────────────────────────────────────────
  const stateConfig = {
    valid: {
      icon: <ShieldCheck className="w-16 h-16 text-emerald-600" />,
      badge: 'AUTHENTIC & VERIFIED',
      badgeClass: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      headerClass: 'border-emerald-400',
      description: 'This Proforma Invoice has been digitally signed and verified. The document is authentic and has not been tampered with.',
    },
    unsigned: {
      icon: <ShieldAlert className="w-16 h-16 text-amber-500" />,
      badge: 'DOCUMENT EXISTS — NOT YET SIGNED',
      badgeClass: 'bg-amber-50 border-amber-300 text-amber-800',
      headerClass: 'border-amber-400',
      description: 'This Proforma Invoice exists in our system but has not yet been digitally authorised by PRC Hardware. Please contact us to confirm its validity.',
    },
    tampered: {
      icon: <ShieldX className="w-16 h-16 text-red-600" />,
      badge: 'TAMPER DETECTED — DO NOT ACCEPT',
      badgeClass: 'bg-red-50 border-red-300 text-red-800',
      headerClass: 'border-red-500',
      description: 'CRITICAL: The cryptographic signature of this Proforma Invoice does not match our records. This document may have been fraudulently altered. Do not make any payment.',
    },
    not_found: {
      icon: <XCircle className="w-16 h-16 text-gray-500" />,
      badge: 'NOT FOUND',
      badgeClass: 'bg-gray-50 border-gray-300 text-gray-700',
      headerClass: 'border-gray-400',
      description: 'We could not locate any Proforma Invoice matching this verification code. If you received this document from PRC Hardware, please contact us.',
    },
    error: {
      icon: <AlertTriangle className="w-16 h-16 text-orange-500" />,
      badge: 'VERIFICATION SERVICE ERROR',
      badgeClass: 'bg-orange-50 border-orange-300 text-orange-800',
      headerClass: 'border-orange-400',
      description: 'Our verification service is temporarily unavailable. Please try again or contact PRC Hardware directly.',
    },
    loading: {
      icon: <QrCode className="w-16 h-16 text-gray-400 animate-pulse" />,
      badge: 'VERIFYING...',
      badgeClass: 'bg-gray-50 border-gray-300 text-gray-600',
      headerClass: 'border-gray-300',
      description: 'Connecting to PRC Hardware secure verification server...',
    },
  };

  const config = stateConfig[verifyState];

  const statusIcon = result?.status === 'SIGNED' || result?.status === 'SENT' || result?.status === 'ACCEPTED'
    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    : <Clock className="w-4 h-4 text-amber-500" />;

  return (
    <div className="min-h-screen bg-[#EACEAA] py-10 px-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Top Brand Strip ──────────────────────────────────────────────────── */}
        <div className="text-center mb-2">
          <Link to="/" className="inline-flex items-center gap-2 text-[#34150F] hover:text-[#85431E] transition-colors">
            <Building2 className="w-5 h-5" />
            <span className="font-black tracking-wide text-lg" style={{ fontFamily: "'Gilda Display', serif" }}>
              PRC Hardware
            </span>
          </Link>
          <p className="text-xs text-[#85431E] mt-0.5 font-semibold tracking-wider uppercase">
            Proforma Invoice Authenticity Verification Portal
          </p>
        </div>

        {/* ── Main Verification Card ──────────────────────────────────────────── */}
        <div className={`bg-white rounded-2xl shadow-xl border-t-4 ${config.headerClass} overflow-hidden`}>

          {/* Hero Section */}
          <div className="p-8 text-center border-b border-gray-100">
            <div className="flex justify-center mb-4">
              {config.icon}
            </div>
            <span className={`inline-block px-4 py-1.5 rounded-full border text-xs font-black tracking-widest uppercase ${config.badgeClass}`}>
              {config.badge}
            </span>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
              {config.description}
            </p>
            {(verifyState === 'error' || verifyState === 'not_found') && errorMsg && (
              <p className="mt-2 text-xs text-red-600 font-semibold">{errorMsg}</p>
            )}
            {(verifyState === 'error' || verifyState === 'not_found') && (
              <button
                onClick={verifyToken}
                className="mt-4 inline-flex items-center gap-2 text-xs bg-[#34150F] text-[#EACEAA] px-4 py-2 rounded-lg font-bold hover:bg-[#85431E] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Verification
              </button>
            )}
          </div>

          {/* ── PI Details Grid (shown when record found) ─────────────────────── */}
          {result && verifyState !== 'not_found' && verifyState !== 'error' && (
            <div className="p-6 space-y-5">

              {/* PI Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-[#34150F]" />
                    <h3 className="text-xs font-black text-[#34150F] uppercase tracking-wider">Invoice Details</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500 text-xs font-semibold">PI Number</span>
                    <span className="text-gray-900 font-black text-xs font-mono">{result.piNumber}</span>

                    <span className="text-gray-500 text-xs font-semibold">Financial Year</span>
                    <span className="text-gray-900 text-xs font-semibold">{result.financialYear}</span>

                    <span className="text-gray-500 text-xs font-semibold">Status</span>
                    <span className="flex items-center gap-1 text-xs font-bold">
                      {statusIcon} {result.status}
                    </span>

                    <span className="text-gray-500 text-xs font-semibold">Items</span>
                    <span className="text-gray-900 text-xs">{result.itemsCount} line item{result.itemsCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Customer */}
                <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-[#34150F]" />
                    <h3 className="text-xs font-black text-[#34150F] uppercase tracking-wider">Customer</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-gray-500 text-xs font-semibold">Name</span>
                    <span className="text-gray-900 text-xs font-bold">{result.customerName}</span>

                    {result.companyName && result.companyName !== 'N/A' && (
                      <>
                        <span className="text-gray-500 text-xs font-semibold">Company</span>
                        <span className="text-gray-900 text-xs">{result.companyName}</span>
                      </>
                    )}

                    {result.gstin && result.gstin !== 'N/A' && (
                      <>
                        <span className="text-gray-500 text-xs font-semibold">GSTIN</span>
                        <span className="text-gray-900 text-xs font-mono">{result.gstin}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Financials */}
                <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-[#34150F]" />
                    <h3 className="text-xs font-black text-[#34150F] uppercase tracking-wider">Financials</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-gray-500 text-xs font-semibold">Grand Total</span>
                    <span className="text-gray-900 text-xs font-black font-mono">{formatINR(result.grandTotal)}</span>

                    <span className="text-gray-500 text-xs font-semibold">Advance ({result.advancePercentage}%)</span>
                    <span className="text-gray-900 text-xs font-bold font-mono">{formatINR(result.advanceAmount)}</span>

                    <span className="text-gray-500 text-xs font-semibold">Balance Due</span>
                    <span className="text-gray-900 text-xs font-mono">{formatINR(result.balanceDue)}</span>
                  </div>
                </div>

                {/* Validity & Dates */}
                <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-[#34150F]" />
                    <h3 className="text-xs font-black text-[#34150F] uppercase tracking-wider">Dates & Validity</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-gray-500 text-xs font-semibold">Issued At</span>
                    <span className="text-gray-900 text-xs">{formatDate(result.issuedAt)}</span>

                    <span className="text-gray-500 text-xs font-semibold">Valid Until</span>
                    <span className="text-gray-900 text-xs">{formatDate(result.validUntil)}</span>
                  </div>
                </div>
              </div>

              {/* ── Digital Signature Block ──────────────────────────────────────── */}
              {verifyState === 'valid' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Cryptographic Signature</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-emerald-700 text-xs font-semibold">Signed By</span>
                    <span className="text-emerald-900 text-xs font-bold">{result.signedBy}</span>

                    <span className="text-emerald-700 text-xs font-semibold">Signed At</span>
                    <span className="text-emerald-900 text-xs">{formatDate(result.signedAt)}</span>
                  </div>
                </div>
              )}

              {/* ── Tamper Alert ─────────────────────────────────────────────────── */}
              {verifyState === 'tampered' && (
                <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <ShieldX className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="text-sm font-black text-red-800">⚠ Document Tampered</p>
                      <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                        Our cryptographic hash verification confirms this document has been modified after issuance.
                        Contact PRC Hardware immediately at{' '}
                        <a href="tel:+919818592113" className="underline font-bold">+91 98185 92113</a>{' '}
                        before making any payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Cryptographic Hash Block ──────────────────────────────────────── */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-[#34150F]" />
                  <h3 className="text-xs font-black text-[#34150F] uppercase tracking-wider">Verification Identifiers</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold mb-0.5">Verification ID</p>
                    <p className="text-gray-800 text-xs font-mono bg-white px-2 py-1.5 rounded border border-gray-200 break-all">{result.verificationId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold mb-0.5">Document Hash (SHA-256)</p>
                    <p className="text-gray-800 text-[10px] font-mono bg-white px-2 py-1.5 rounded border border-gray-200 break-all leading-relaxed">{result.documentHash}</p>
                  </div>
                </div>
              </div>

              {/* ── Download & View Button ──────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`/proforma/${token}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#85431E] transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Full Proforma Invoice
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Disclaimer ──────────────────────────────────────────────── */}
        <div className="text-center text-xs text-[#85431E] space-y-1">
          <p className="font-semibold">PRC Hardware</p>
          <p>H-3, J.R. Complex, Gate No. 4, Mela Ram Farm, Mandoli, Delhi 110093</p>
          <p>
            <a href="tel:+919818592113" className="underline">+91 98185 92113</a>
            {' · '}
            <a href="mailto:billing@prchardware.com" className="underline">billing@prchardware.com</a>
          </p>
          <p className="text-[10px] text-[#34150F]/50 pt-1">
            Secured by PRC Hardware Digital Trust Infrastructure · GSTIN: 07AADFP3948F1Z1
          </p>
        </div>
      </div>
    </div>
  );
}
