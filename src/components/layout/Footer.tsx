import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Reveal } from '../common/Reveal';
import { useAuth } from '../../context/AuthContext';

export function Footer() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const isB2B = !!(user && (user.companyName || user.gstin || user.role === 'B2B'));

  const quickLinks = [
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Products', to: '/products' },
    { label: "FAQ's", to: '/faq' },
    { label: 'Book Appointment', to: '/services/appointments' },
    ...(isB2B ? [{ label: 'Bulk Order / B2B', to: '/request-quote' }] : []),
  ];


  return (
    <footer className="bg-[#34150F] border-t border-[#EACEAA]/10">
      <div className="px-4 md:px-8 lg:px-16 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Col 1 – Logo & Description */}
        <Reveal delay={0}>
          <div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-[#D39858] font-extrabold text-2xl" style={{ fontFamily: "'Gilda Display', serif" }}>PRC</span>
              <span className="text-[#EACEAA] font-semibold text-lg">Hardware</span>
            </div>
            <p className="text-[#EACEAA]/65 text-sm leading-relaxed mb-5">
              India's trusted destination for premium architectural hardware. From cabinet handles to industrial locks — quality crafted for every space.
            </p>
            <div className="space-y-2 text-sm text-[#EACEAA]/60">
              <div className="flex items-center gap-2"><Phone size={13} /><span>+91 98765 43210</span></div>
              <div className="flex items-center gap-2"><Mail size={13} /><span>info@prchardware.in</span></div>
              <div className="flex items-center gap-2"><MapPin size={13} /><span>New Delhi, India</span></div>
            </div>
          </div>
        </Reveal>

        {/* Col 2 – Quick Links */}
        <Reveal delay={60}>
          <div>
            <h4 className="text-[#D39858] font-bold text-base mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">

              {quickLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-[#EACEAA]/65 text-sm hover:text-[#D39858] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>


          </div>
        </Reveal>

        {/* Col 3 – Query Service */}
        <Reveal delay={120}>
          <div>
            <h4 className="text-[#D39858] font-bold text-base mb-4 uppercase tracking-wider">Query Service</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Track Order', to: '/track-order' },
                { label: 'Privacy Policy', to: '/policy/privacy' },
                { label: 'Refund Policy', to: '/policy/returns' },
                { label: 'Shipping Policy', to: '/policy/shipping' },
                { label: 'Terms of Service', to: '/policy/terms' },
                { label: 'Warranty Claim', to: '/warranty-claim' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-[#EACEAA]/65 text-sm hover:text-[#D39858] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Col 4 – Newsletter + Social */}
        <Reveal delay={200}>
          <div>
            <h4 className="text-[#D39858] font-bold text-base mb-4 uppercase tracking-wider">Stay Updated</h4>
            <p className="text-[#EACEAA]/65 text-sm mb-4">Subscribe for new arrivals, offers & hardware insights.</p>
            {subscribed ? (
              <p className="text-[#D39858] text-sm font-medium">Thank you for subscribing!</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubscribed(true); }} className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/15 focus:outline-none focus:border-[#D39858] transition-colors"
                />
                <button type="submit" className="w-full bg-[#D39858] text-[#34150F] py-2.5 rounded-tr-xl rounded-bl-xl text-sm font-bold hover:bg-[#EACEAA] transition-colors">
                  Subscribe
                </button>
              </form>
            )}
            <div className="flex gap-3 mt-6">
              {[{ icon: Facebook, label: 'Facebook' }, { icon: Instagram, label: 'Instagram' }, { icon: Twitter, label: 'Twitter' }, { icon: Youtube, label: 'YouTube' }].map(({ icon: Icon, label }) => (
                <button key={label} type="button" aria-label={label} className="w-8 h-8 border border-[#EACEAA]/20 rounded-tr-lg rounded-bl-lg flex items-center justify-center text-[#EACEAA]/60 hover:text-[#D39858] hover:border-[#D39858] transition-colors">
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="border-t border-[#EACEAA]/10 px-4 md:px-8 lg:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#EACEAA]/40">
        <span>© {new Date().getFullYear()} PRC Hardware. All rights reserved.</span>
        <span>Designed with precision. Built for quality.</span>
      </div>
    </footer>
  );
}
