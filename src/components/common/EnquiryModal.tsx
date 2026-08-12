import { useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { enquiryService } from '../../services/enquiryService';

interface EnquiryModalProps {
  productId?: string;
  productName?: string;
  onClose: () => void;
}

export function EnquiryModal({ productId, productName, onClose }: EnquiryModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: productName ? 'Product Enquiry' : '',
    message: productName ? `Hi, I'm interested in the product: ${productName}. ` : '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.message.trim().length < 10) { setError('Message must be at least 10 characters.'); return; }
    setLoading(true); setError('');
    const res = await enquiryService.create({ ...form, productId });
    setLoading(false);
    if (res.success) setSuccess(true);
    else setError(res.error?.message || 'Failed to send enquiry. Please try again.');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl w-full max-w-lg p-7 shadow-2xl border border-[rgba(52,21,15,0.1)] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-tr-lg rounded-bl-lg bg-[#34150F]/10 flex items-center justify-center hover:bg-[#34150F]/20 transition-colors">
          <X size={16} className="text-[#34150F]" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#34150F] mb-2" style={{ fontFamily: "'Gilda Display', serif" }}>Enquiry Sent!</h3>
            <p className="text-sm text-[#85431E]">Thank you! We'll get back to you within 24 hours.</p>
            <button onClick={onClose} className="mt-6 px-8 py-2.5 bg-[#34150F] text-[#EACEAA] rounded-tr-xl rounded-bl-xl font-bold text-sm hover:bg-[#85431E] transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[#34150F] mb-1" style={{ fontFamily: "'Gilda Display', serif" }}>
              {productName ? 'Product Enquiry' : 'Send Enquiry'}
            </h2>
            {productName && <p className="text-sm text-[#85431E] mb-5 truncate">Re: {productName}</p>}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input required value={form.name} onChange={set('name')} placeholder="Your name" className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Email *</label>
                  <input required type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Phone</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="+91 XXXXX XXXXX" className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Subject *</label>
                  <select required value={form.subject} onChange={set('subject')} className="w-full bg-[#EACEAA] text-[#34150F] px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors">
                    <option value="">Select subject</option>
                    <option>Product Enquiry</option>
                    <option>Bulk Order / B2B</option>
                    <option>Order Support</option>
                    <option>Technical Help</option>
                    <option>General Query</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Message *</label>
                <textarea value={form.message} onChange={set('message')} rows={4} placeholder="Describe your query..." className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors resize-none" />
              </div>

              {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-tr-xl rounded-bl-xl font-semibold text-sm text-[#85431E] border border-[rgba(52,21,15,0.15)] hover:bg-[#34150F]/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-tr-xl rounded-bl-xl font-bold text-sm bg-[#34150F] text-[#EACEAA] hover:bg-[#85431E] flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  <Send size={14} />{loading ? 'Sending...' : 'Send Enquiry'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
