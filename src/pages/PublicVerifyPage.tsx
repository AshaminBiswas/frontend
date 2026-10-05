import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Building2,
  Calendar,
  CreditCard,
  User,
  Layers,
  Printer,
  Download,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { quotationService, PublicDocumentVerificationResult } from '../services/quotationService';
import { API_BASE_URL } from '../services/api';

export function PublicVerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PublicDocumentVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    if (!token) {
      setError('Verification token is missing in the request URL.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await quotationService.verifyPublicDocument(token);
      if (res && res.success && res.data) {
        setResult(res.data);
      } else if (res && (res as any).valid !== undefined) {
        setResult(res as any);
      } else {
        setResult({
          valid: false,
          message: res?.error?.message || 'Unable to authenticate this token against Pacific security records.',
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Verification service temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verify();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  // Resolve PDF Download URL
  const getPdfDownloadUrl = () => {
    if (!result) return '';
    if (result.pdfDownloadUrl) {
      if (result.pdfDownloadUrl.startsWith('http')) return result.pdfDownloadUrl;
      const base = API_BASE_URL.replace(/\/+$/, '');
      const path = result.pdfDownloadUrl.startsWith('/') ? result.pdfDownloadUrl : `/${result.pdfDownloadUrl}`;
      return `${base}${path}`;
    }
    if (result.quotation?.id) {
      const base = API_BASE_URL.replace(/\/+$/, '');
      return `${base}/sales/quotations/${result.quotation.id}/pdf?download=true`;
    }
    if (result.proformaInvoice?.id) {
      const base = API_BASE_URL.replace(/\/+$/, '');
      return `${base}/sales/pi/${result.proformaInvoice.id}/pdf`;
    }
    return '';
  };

  const pdfUrl = getPdfDownloadUrl();

  const isKolkata =
    result?.document?.documentNumber?.startsWith('PPSK/') ||
    result?.document?.companyName?.toLowerCase().includes('kolkata') ||
    result?.quotation?.companyProfile?.stateCode === '19' ||
    result?.quotation?.companyProfile?.state?.toLowerCase().includes('bengal');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#34150F] py-10 px-4 sm:px-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Brand Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[rgba(52,21,15,0.12)]">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#34150F] text-[#EACEAA] flex items-center justify-center font-black text-xl shadow-md">
              P
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                PACIFIC PRODUCTS & SOLUTIONS
              </span>
              <p className="text-[11px] text-[#85431E] font-bold tracking-wider uppercase">
                Official Digital Document Verification Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs text-[#85431E] bg-[#EACEAA]/40 px-3.5 py-1.5 rounded-full border border-[rgba(52,21,15,0.1)]">
            <Lock className="w-3.5 h-3.5 text-[#34150F]" />
            <span className="font-semibold">Cryptographically Verified & SSL Protected</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-[rgba(52,21,15,0.08)]">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#D39858]/30 border-t-[#34150F] rounded-full animate-spin" />
            <h2 className="text-xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Verifying Document Digital Signature
            </h2>
            <p className="text-xs text-[#85431E] mt-1">
              Querying Pacific Products & Solutions official security registry...
            </p>
          </div>
        )}

        {/* Error / Invalid State */}
        {!loading && (error || !result?.valid) && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-lg border-2 border-red-200 relative overflow-hidden">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200 shadow-sm">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Document Verification Failed
            </h2>
            <p className="text-sm text-red-600 mt-2 max-w-lg mx-auto font-medium leading-relaxed">
              {error || result?.message || 'This document signature could not be verified or has been revoked.'}
            </p>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 my-6 max-w-lg mx-auto text-left text-xs text-[#34150F] space-y-2">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" /> Security Advisory:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Verify all quotation and invoice details directly with Pacific Corporate Accounts before honoring payments.</li>
                <li>Ensure payment is only made to official Pacific Products & Solutions verified bank accounts.</li>
                <li>Contact Pacific verification hotline: <a href="tel:+918010834316" className="font-bold underline text-[#34150F]">+91 8010834316</a> or email <a href="mailto:pacificproduct101@gmail.com" className="font-bold underline text-[#34150F]">pacificproduct101@gmail.com</a>.</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={verify}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#34150F] text-[#EACEAA] rounded-xl text-xs font-bold hover:bg-[#85431E] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Verification
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
              </Link>
            </div>
          </div>
        )}

        {/* Valid Document Certificate View */}
        {!loading && result?.valid && (
          <div className="bg-white rounded-3xl shadow-xl border border-[rgba(52,21,15,0.08)] overflow-hidden">
            {/* Top Authenticity Banner */}
            <div className="bg-gradient-to-r from-[#34150F] via-[#4d2017] to-[#34150F] text-[#EACEAA] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 bg-[#EACEAA]/15 border-2 border-[#EACEAA]/40 rounded-2xl flex items-center justify-center text-[#EACEAA] shrink-0 shadow-inner">
                  <ShieldCheck className="w-9 h-9" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-black uppercase tracking-wider mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Authentic Verified Document
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FDFBF7] tracking-tight font-mono">
                    {result.document?.documentNumber || result.quotation?.referenceNumber}
                  </h1>
                  <p className="text-xs text-[#EACEAA]/80 mt-1">
                    Digitally signed & authenticated via Pacific Restroom Cubicle Subsystem
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end">
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EACEAA] hover:bg-[#d8b58a] text-[#34150F] font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                )}
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-[#FDFBF7] rounded-xl text-xs font-bold transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Details
                </button>
              </div>
            </div>

            {/* Document Attributes Summary Cards */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Document Type */}
                <div className="bg-[#FDFBF7] border border-[rgba(52,21,15,0.08)] rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-[#85431E] uppercase tracking-wider block mb-1">
                    Document Type
                  </span>
                  <div className="flex items-center gap-2 text-[#34150F] font-extrabold text-sm">
                    <FileCheck className="w-4 h-4 text-[#D39858]" />
                    <span>
                      {result.document?.documentType === 'PI'
                        ? 'Proforma Invoice (PI)'
                        : result.document?.documentType === 'QUOTATION' || result.document?.documentType === 'QT'
                        ? 'Sales Quotation'
                        : result.document?.documentType === 'ORDER' || result.document?.documentType === 'SO'
                        ? 'Sales Order'
                        : result.document?.documentType === 'INVOICE'
                        ? 'Tax Invoice'
                        : result.document?.documentType === 'PACKING_LIST'
                        ? 'Packing List / Consignment'
                        : result.document?.documentType || 'Official Document'}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-[#FDFBF7] border border-[rgba(52,21,15,0.08)] rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-[#85431E] uppercase tracking-wider block mb-1">
                    Document Status
                  </span>
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{result.document?.status || 'APPROVED'}</span>
                  </div>
                </div>

                {/* Issuing Entity & Branch */}
                <div className="bg-[#FDFBF7] border border-[rgba(52,21,15,0.08)] rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-[#85431E] uppercase tracking-wider block mb-1">
                    Issuing Branch
                  </span>
                  <div className="flex items-center gap-2 text-[#34150F] font-bold text-sm">
                    <Building2 className="w-4 h-4 text-[#D39858]" />
                    <span className="truncate">{result.document?.companyName}</span>
                  </div>
                  <div className="mt-1">
                    {isKolkata ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        Kolkata Branch
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Main Branch (Delhi HQ)
                      </span>
                    )}
                  </div>
                </div>

                {/* Billed To / Recipient */}
                <div className="bg-[#FDFBF7] border border-[rgba(52,21,15,0.08)] rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-[#85431E] uppercase tracking-wider block mb-1">
                    Billed To / Recipient
                  </span>
                  <div className="flex items-center gap-2 text-[#34150F] font-bold text-sm">
                    <User className="w-4 h-4 text-[#D39858]" />
                    <span className="truncate">{result.document?.partyName}</span>
                  </div>
                  {result.quotation?.projectName && (
                    <p className="text-[11px] text-[#85431E] mt-1 font-semibold">
                      Project: <span className="text-[#34150F] font-bold">{result.quotation.projectName}</span>
                    </p>
                  )}
                </div>

                {/* Document Date */}
                <div className="bg-[#FDFBF7] border border-[rgba(52,21,15,0.08)] rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-[#85431E] uppercase tracking-wider block mb-1">
                    Date of Issue
                  </span>
                  <div className="flex items-center gap-2 text-[#34150F] font-bold text-sm">
                    <Calendar className="w-4 h-4 text-[#D39858]" />
                    <span>
                      {result.document?.date
                        ? new Date(result.document.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                  {result.quotation?.validUntil && (
                    <p className="text-[11px] text-[#85431E] mt-1">
                      Valid Until: <span className="font-semibold text-gray-700">{new Date(result.quotation.validUntil).toLocaleDateString('en-IN')}</span>
                    </p>
                  )}
                </div>

                {/* Authorized Amount */}
                <div className="bg-[#FDFBF7] border border-[rgba(52,21,15,0.08)] rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-[#85431E] uppercase tracking-wider block mb-1">
                    Authorized Total Amount
                  </span>
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base font-mono">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>{result.document?.maskedAmount}</span>
                  </div>
                  {result.quotation?.amountInWords && (
                    <p className="text-[10px] text-gray-600 mt-1 italic leading-tight">{result.quotation.amountInWords}</p>
                  )}
                </div>
              </div>

              {/* Quotation Itemized Line Items & Specifications Table */}
              {result.quotation && Array.isArray(result.quotation.items) && result.quotation.items.length > 0 && (
                <div className="border border-[rgba(52,21,15,0.12)] rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="px-5 py-4 bg-[#FDFBF7] border-b border-[rgba(52,21,15,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#D39858]" />
                      <h3 className="text-xs font-black text-[#34150F] uppercase tracking-wider">
                        Technical Specifications & Line Items ({result.quotation.items.length})
                      </h3>
                    </div>
                    {result.quotation.subject && (
                      <span className="text-xs text-[#85431E] font-medium truncate max-w-md">
                        {result.quotation.subject}
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-800">
                      <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-600 border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4 font-bold text-gray-500">#</th>
                          <th className="py-3 px-4 font-bold">Description / Model</th>
                          <th className="py-3 px-4 font-bold">Board & Dimensions</th>
                          <th className="py-3 px-4 font-bold text-right">Qty</th>
                          <th className="py-3 px-4 font-bold text-right">Rate (₹)</th>
                          <th className="py-3 px-4 font-bold text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.quotation.items.map((item: any, idx: number) => (
                          <tr key={item.id || idx} className="hover:bg-amber-50/20 transition-colors">
                            <td className="py-3 px-4 font-mono text-gray-400 font-semibold">{item.serialNumber || idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-[#34150F]">{item.description}</div>
                              {item.hardwarePackage && (
                                <div className="text-[11px] text-[#85431E] mt-0.5 font-medium">Hardware: {item.hardwarePackage}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-700">
                              <div className="font-medium">{item.boardType || 'Compact Laminate'} {item.boardThickness ? `(${item.boardThickness})` : ''}</div>
                              {item.cubicleSize && <div className="text-[11px] text-gray-500">{item.cubicleSize}</div>}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#34150F] whitespace-nowrap">
                              {item.quantity} {item.unit || 'NOS'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-gray-800 whitespace-nowrap">
                              ₹ {Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-[#34150F] whitespace-nowrap">
                              ₹ {Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Commercial Summary Card */}
                  <div className="p-5 bg-[#FDFBF7] border-t border-[rgba(52,21,15,0.1)] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#34150F]">Freight Terms:</span>
                        <span className="text-gray-700">{result.quotation.freightTerms || 'Extra at actuals'}</span>
                        {Number(result.quotation.freightAmount) > 0 && (
                          <span className="font-mono font-bold text-[#34150F]">
                            (₹ {Number(result.quotation.freightAmount).toLocaleString('en-IN')})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#34150F]">Installation Charges:</span>
                        {Number(result.quotation.installationCharge) > 0 ? (
                          <span className="font-mono font-bold text-emerald-800">
                            ₹ {Number(result.quotation.installationCharge).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Included in Price / Terms Apply
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-right font-mono text-xs">
                      <div className="flex justify-between sm:justify-end gap-6 text-gray-600">
                        <span>Basic Supply Price:</span>
                        <span className="font-bold text-[#34150F]">₹ {Number(result.quotation.basicPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between sm:justify-end gap-6 text-gray-600">
                        <span>GST ({result.quotation.gstRate || 18}%):</span>
                        <span className="font-bold text-[#34150F]">₹ {Number(result.quotation.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between sm:justify-end gap-6 text-sm font-black text-[#34150F] pt-2 border-t border-[rgba(52,21,15,0.15)]">
                        <span>Grand Total:</span>
                        <span className="text-emerald-900 font-extrabold">₹ {Number(result.quotation.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cryptographic Security Details Footer */}
              <div className="bg-[#FDFBF7] border border-[rgba(52,21,15,0.08)] rounded-2xl p-4 text-xs space-y-1.5 text-gray-600">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span>Cryptographic Security Token:</span>
                  <span className="text-[#85431E] font-bold truncate max-w-[280px]">{token}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Verification Timestamp:</span>
                  <span className="text-gray-700 font-medium">
                    {result.document?.verifiedAt
                      ? new Date(result.document.verifiedAt).toLocaleString('en-IN')
                      : new Date().toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Issuing Authority:</span>
                  <span className="text-gray-700 font-bold">Pacific Restroom Cubicle Enterprise ERP</span>
                </div>
              </div>

              {/* Notice Footer */}
              <div className="pt-2 text-[11px] text-gray-500 text-center leading-relaxed">
                This official digital verification certificate confirms that the document was generated and authenticated by Pacific Products & Solutions.
              </div>
            </div>
          </div>
        )}

        {/* Page Footer */}
        <div className="text-center text-xs text-gray-500 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[rgba(52,21,15,0.08)]">
          <span>© {new Date().getFullYear()} Pacific Products & Solutions. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="mailto:pacificproduct101@gmail.com" className="hover:text-[#34150F] transition-colors">
              Support
            </a>
            <a href="tel:+918010834316" className="hover:text-[#34150F] transition-colors">
              Contact: +91 8010834316
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
export default PublicVerifyPage;
