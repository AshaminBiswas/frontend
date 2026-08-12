import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { FileText, ChevronRight } from 'lucide-react';

const POLICIES = [
  { slug: 'terms', title: 'Terms of Service' },
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'returns', title: 'Return & Refund Policy' },
  { slug: 'shipping', title: 'Shipping Policy' },
];

const FALLBACK_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: 'Terms of Service',
    content: `
## 1. Acceptance of Terms
By using PRC Hardware's website and services, you agree to these Terms of Service. If you do not agree, please discontinue use of our platform.

## 2. Products & Pricing
All prices are displayed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. We reserve the right to modify prices without prior notice.

## 3. Orders & Payment
Orders are confirmed only upon successful payment. We accept major payment methods including UPI, credit/debit cards, and net banking.

## 4. Delivery
Delivery timelines are estimated and may vary based on your location and product availability. We ship pan-India.

## 5. Returns & Refunds
Returns are accepted within 7 days of delivery for defective or damaged products. Please refer to our Return Policy for full details.

## 6. User Responsibilities
You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
    `.trim(),
  },
  privacy: {
    title: 'Privacy Policy',
    content: `
## 1. Information We Collect
We collect information you provide during registration (name, email, phone, address), as well as usage data to improve our services.

## 2. How We Use Your Information
Your information is used to process orders, communicate updates, and improve our platform. We do not sell your data to third parties.

## 3. Data Security
We use industry-standard encryption (HTTPS/TLS) to protect your data. Our servers are secured and regularly audited.

## 4. Cookies
We use cookies to maintain your session, remember your preferences, and analyze site traffic.

## 5. Your Rights
You may request access to, correction of, or deletion of your personal data by contacting us at privacy@prchardware.in.
    `.trim(),
  },
  returns: {
    title: 'Return & Refund Policy',
    content: `
## 1. Return Eligibility
Items may be returned within 7 days of delivery if they are defective, damaged, or significantly different from the product description.

## 2. Non-Returnable Items
Custom-cut items, special orders, and clearance products are non-returnable unless defective.

## 3. Return Process
1. Contact our support team at returns@prchardware.in within 7 days.
2. Provide order number and photos of the defective item.
3. We will arrange a pickup or provide a return shipping label.

## 4. Refunds
Refunds are processed within 5–7 business days after we receive and inspect the returned item. Refunds are issued to the original payment method.
    `.trim(),
  },
  shipping: {
    title: 'Shipping Policy',
    content: `
## 1. Shipping Coverage
We ship pan-India to all major cities, towns, and pin codes served by our logistics partners.

## 2. Delivery Timelines
- Metro Cities (Delhi, Mumbai, Bangalore, Chennai): 2–3 business days
- Tier-2 Cities: 3–5 business days
- Remote Areas: 5–8 business days

## 3. Shipping Charges
Free shipping on orders above ₹2,000. A flat shipping fee applies to smaller orders based on weight and location.

## 4. Order Tracking
Once your order is dispatched, you will receive a tracking link via email and SMS. You can also track orders on our website.

## 5. Damaged in Transit
If your package arrives visibly damaged, please refuse delivery or contact us within 24 hours with photos.
    `.trim(),
  },
};

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold text-[#34150F] mt-8 mb-3" style={{ fontFamily: "'Gilda Display', serif" }}>{line.replace('## ', '')}</h2>;
    }
    if (line.startsWith('- ')) {
      return <li key={i} className="text-[#85431E] text-sm leading-relaxed ml-4 list-disc">{line.replace('- ', '')}</li>;
    }
    if (line.match(/^\d+\./)) {
      return <li key={i} className="text-[#85431E] text-sm leading-relaxed ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
    }
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="text-[#85431E] text-sm leading-relaxed mb-2">{line}</p>;
  });
}

export function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchApi(`/cms/${slug}`)
      .then(res => {
        if (res.success && res.data) {
          setContent({ title: res.data.title || FALLBACK_CONTENT[slug]?.title || slug, content: res.data.content || res.data.body || '' });
        } else {
          setContent(FALLBACK_CONTENT[slug] || { title: slug, content: 'Content not found.' });
        }
      })
      .catch(() => setContent(FALLBACK_CONTENT[slug] || null))
      .finally(() => setLoading(false));
  }, [slug]);

  const current = POLICIES.find(p => p.slug === slug);

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="px-4 md:px-8 lg:px-16 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <h3 className="text-xs font-bold text-[#85431E] uppercase tracking-wider mb-3">Policies</h3>
            <div className="space-y-1">
              {POLICIES.map(p => (
                <Link key={p.slug} to={`/policy/${p.slug}`} className={`flex items-center gap-2 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm font-semibold transition-all ${
                  slug === p.slug
                    ? 'bg-[#34150F] text-[#EACEAA]'
                    : 'text-[#85431E] hover:bg-[#f5e8d4] hover:text-[#34150F]'
                }`}>
                  <FileText size={14} />
                  <span>{p.title}</span>
                  {slug === p.slug && <ChevronRight size={14} className="ml-auto" />}
                </Link>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 animate-pulse space-y-4">
                <div className="h-8 bg-[#34150F]/10 rounded w-1/2" />
                {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-[#34150F]/10 rounded" />)}
              </div>
            ) : content ? (
              <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 border border-[rgba(52,21,15,0.08)]">
                <div className="flex items-center gap-2 mb-1">
                  <Link to="/" className="text-xs text-[#85431E] hover:text-[#D39858]">Home</Link>
                  <ChevronRight size={12} className="text-[#85431E]/50" />
                  <span className="text-xs text-[#85431E]">{content.title}</span>
                </div>
                <h1 className="text-3xl font-bold text-[#34150F] mt-4 mb-6" style={{ fontFamily: "'Gilda Display', serif" }}>{content.title}</h1>
                <div className="prose-sm">{renderContent(content.content)}</div>
              </div>
            ) : (
              <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 text-center">
                <p className="text-[#85431E]">Policy content not found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
