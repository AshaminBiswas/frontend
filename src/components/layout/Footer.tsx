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
    { label: 'Our Landmark Projects', to: '/projects' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Products', to: '/products' },
    { label: "FAQ's", to: '/faq' },
    { label: 'Book Appointment', to: '/services/appointments' },
    ...(isB2B ? [{ label: 'Bulk Order / B2B', to: '/request-quote' }] : []),
  ];


  return (
    <footer className="bg-[#34150F] border-t border-[#EACEAA]/10 pb-20 md:pb-0">
      <div className="px-3 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-10 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Col 1 – Logo & Description */}
        <Reveal delay={0}>
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-2.5">
              <img src="/logo.png" alt="PRC Hardware" className="h-9 sm:h-11 w-auto object-contain" />
              <span className="text-[#EACEAA] font-semibold text-lg sm:text-xl">Hardware</span>
            </div>
            <p className="text-[#EACEAA]/65 text-xs sm:text-sm leading-relaxed mb-3.5 max-w-sm">
              India's trusted destination for premium architectural hardware. From cabinet handles to industrial locks — quality crafted for every space.
            </p>
            <div className="space-y-1.5 text-xs text-[#EACEAA]/60">
              <div className="flex items-center gap-2"><Phone size={12} className="shrink-0 text-[#D39858]" /><span>+91 98765 43210</span></div>
              <div className="flex items-center gap-2"><Mail size={12} className="shrink-0 text-[#D39858]" /><span>info@prchardware.in</span></div>
              <div className="flex items-start gap-2"><MapPin size={12} className="shrink-0 mt-0.5 text-[#D39858]" /><span className="text-[11px] leading-snug">H-3, J.R. COMPLEX GATE NO 4, MANDOLI, DELHI 110093</span></div>
            </div>
          </div>
        </Reveal>

        {/* Col 2 – Quick Links */}
        <Reveal delay={60}>
          <div>
            <h4 className="text-[#D39858] font-bold text-xs sm:text-sm mb-2.5 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5">
              {quickLinks.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-[#EACEAA]/65 text-xs sm:text-sm hover:text-[#D39858] transition-colors inline-block py-0.5">
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
            <h4 className="text-[#D39858] font-bold text-xs sm:text-sm mb-2.5 uppercase tracking-wider">Query Service</h4>
            <ul className="space-y-1.5">
              {[
                { label: 'Track Order', to: '/track-order' },
                { label: 'Privacy Policy', to: '/policy/privacy' },
                { label: 'Refund Policy', to: '/policy/returns' },
                { label: 'Shipping Policy', to: '/policy/shipping' },
                { label: 'Terms of Service', to: '/policy/terms' },
                { label: 'Warranty Claim', to: '/warranty-claim' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-[#EACEAA]/65 text-xs sm:text-sm hover:text-[#D39858] transition-colors inline-block py-0.5">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Col 4 – Newsletter + Social */}
        <Reveal delay={200}>
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-[#D39858] font-bold text-xs sm:text-sm mb-2 uppercase tracking-wider">Stay Updated</h4>
            <p className="text-[#EACEAA]/65 text-xs mb-3">Subscribe for new arrivals, offers & hardware insights.</p>
            {subscribed ? (
              <p className="text-[#D39858] text-xs font-semibold py-2">✓ Thank you for subscribing!</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubscribed(true); }} className="space-y-2 max-w-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[#EACEAA]/10 text-[#EACEAA] placeholder-[#EACEAA]/40 px-3.5 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#EACEAA]/15 focus:outline-none focus:border-[#D39858] transition-colors"
                />
                <button type="submit" className="w-full bg-[#D39858] text-[#34150F] py-2 rounded-tr-xl rounded-bl-xl text-xs font-extrabold hover:bg-[#EACEAA] transition-colors shadow-xs active:scale-95">
                  Subscribe
                </button>
              </form>
            )}
            <div className="flex gap-2.5 mt-4">
              {[{ icon: Facebook, label: 'Facebook' }, { icon: Instagram, label: 'Instagram' }, { icon: Twitter, label: 'Twitter' }, { icon: Youtube, label: 'YouTube' }].map(({ icon: Icon, label }) => (
                <button key={label} type="button" aria-label={label} className="w-7 h-7 border border-[#EACEAA]/20 rounded-tr-lg rounded-bl-lg flex items-center justify-center text-[#EACEAA]/60 hover:text-[#D39858] hover:border-[#D39858] transition-colors active:scale-90">
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <div className="border-t border-[#EACEAA]/10 px-3 sm:px-6 md:px-8 lg:px-16 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-[#EACEAA]/40 text-center sm:text-left">
        <span>© {new Date().getFullYear()} PRC Hardware. All rights reserved.</span>
        <span className="hidden sm:inline">Designed with precision. Built for quality.</span>
      </div>
    </footer>
  );
}
