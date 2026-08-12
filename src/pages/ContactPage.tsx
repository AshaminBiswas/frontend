import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { enquiryService } from '../services/enquiryService';

const CONTACT_INFO = [
  { icon: Phone, label: 'Phone', value: '+91 98765 43210', sub: 'Mon–Sat, 9 AM – 6 PM' },
  { icon: Mail, label: 'Email', value: 'info@prchardware.in', sub: 'We reply within 24 hours' },
  { icon: MapPin, label: 'Address', value: '123 Hardware Market, Karol Bagh', sub: 'New Delhi, India 110005' },
  { icon: Clock, label: 'Working Hours', value: 'Mon–Sat: 9 AM – 6 PM', sub: 'Sunday: Closed' },
];

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.message.trim().length < 20) { setError('Message must be at least 20 characters.'); return; }
    setLoading(true);
    const res = await enquiryService.create(form);
    setLoading(false);
    if (res.success) setSuccess(true);
    else setError(res.error?.message || 'Failed to send message. Please try again.');
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Hero */}
      <div className="bg-[#34150F] px-4 md:px-8 lg:px-16 py-16 text-center">
        <h1 className="text-4xl font-bold text-[#EACEAA] mb-3" style={{ fontFamily: "'Gilda Display', serif" }}>Contact Us</h1>
        <p className="text-[#EACEAA]/70 max-w-xl mx-auto">Have a question, bulk enquiry, or need technical advice? We're here to help.</p>
      </div>

      <div className="px-4 md:px-8 lg:px-16 py-14">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Contact Info */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#34150F] mb-6" style={{ fontFamily: "'Gilda Display', serif" }}>Get in Touch</h2>
            {CONTACT_INFO.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex gap-4 bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-5 border border-[rgba(52,21,15,0.08)] hover:shadow-sm transition-shadow">
                <div className="w-11 h-11 bg-[#34150F] rounded-tr-xl rounded-bl-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-[#D39858]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#85431E] uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-bold text-[#34150F] text-sm">{value}</p>
                  <p className="text-xs text-[#85431E]/70 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Form */}
          <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 border border-[rgba(52,21,15,0.08)]">
            {success ? (
              <div className="text-center py-10">
                <CheckCircle2 size={52} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#34150F] mb-2" style={{ fontFamily: "'Gilda Display', serif" }}>Message Sent!</h3>
                <p className="text-[#85431E] text-sm">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSuccess(false); setForm({ name:'', email:'', phone:'', subject:'', message:'' }); }} className="mt-6 text-sm font-bold text-[#D39858] hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-[#34150F] mb-5" style={{ fontFamily: "'Gilda Display', serif" }}>Send a Message</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input required value={form.name} onChange={set('name')} placeholder="Your full name" className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors" />
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
                      <option>Warranty Claim</option>
                      <option>General Query</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#85431E] uppercase tracking-wider mb-1.5">Message *</label>
                  <textarea required value={form.message} onChange={set('message')} rows={5} placeholder="Describe your query in detail..." className="w-full bg-[#EACEAA] text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#D39858] transition-colors resize-none" />
                </div>

                {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#34150F] text-[#EACEAA] py-3 rounded-tr-xl rounded-bl-xl font-bold hover:bg-[#85431E] transition-colors disabled:opacity-60">
                  <Send size={16} />{loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
