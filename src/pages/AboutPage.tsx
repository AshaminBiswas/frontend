import { Shield, Award, Truck, Users, Package, Star, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATS = [
  { label: 'Products', value: '5,000+', icon: Package },
  { label: 'Happy Clients', value: '12,000+', icon: Users },
  { label: 'Years of Trust', value: '15+', icon: Star },
  { label: 'Warehouses', value: '8', icon: Building2 },
];

const VALUES = [
  {
    icon: Shield,
    title: 'Quality Assured',
    desc: 'Every product undergoes rigorous quality checks. We source only from certified manufacturers to ensure durability and reliability.',
  },
  {
    icon: Award,
    title: 'Industry Expertise',
    desc: 'With over 15 years in architectural hardware, our team brings deep technical knowledge to help you find the perfect fit for every project.',
  },
  {
    icon: Truck,
    title: 'Pan-India Delivery',
    desc: 'Fast, reliable delivery across all major Indian cities and towns. Track your order in real-time from our warehouse to your doorstep.',
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Hero */}
      <div className="bg-[#34150F] px-4 md:px-8 lg:px-16 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#EACEAA] mb-4" style={{ fontFamily: "'Gilda Display', serif" }}>About PRC Hardware</h1>
        <p className="text-[#EACEAA]/70 max-w-2xl mx-auto text-lg leading-relaxed">
          India's trusted destination for premium architectural hardware — from cabinet handles to industrial locks, quality crafted for every space.
        </p>
      </div>

      {/* Mission */}
      <div className="px-4 md:px-8 lg:px-16 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#34150F] mb-4" style={{ fontFamily: "'Gilda Display', serif" }}>Our Mission</h2>
            <p className="text-[#85431E] text-lg leading-relaxed max-w-2xl mx-auto">
              We believe quality hardware is the foundation of beautiful, functional spaces. Our mission is to make premium-grade architectural hardware accessible to homeowners, interior designers, architects, and contractors across India.
            </p>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-7 border border-[rgba(52,21,15,0.08)] hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#34150F] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center mb-5">
                  <Icon size={22} className="text-[#D39858]" />
                </div>
                <h3 className="text-lg font-bold text-[#34150F] mb-2" style={{ fontFamily: "'Gilda Display', serif" }}>{title}</h3>
                <p className="text-sm text-[#85431E] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-[#34150F] rounded-tr-3xl rounded-bl-3xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-16">
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <Icon size={24} className="text-[#D39858] mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-[#EACEAA] mb-1" style={{ fontFamily: "'Gilda Display', serif" }}>{value}</p>
                <p className="text-[#EACEAA]/60 text-sm">{label}</p>
              </div>
            ))}
          </div>

          {/* Story */}
          <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-8 border border-[rgba(52,21,15,0.08)] mb-12">
            <h2 className="text-2xl font-bold text-[#34150F] mb-4" style={{ fontFamily: "'Gilda Display', serif" }}>Our Story</h2>
            <div className="space-y-4 text-[#85431E] leading-relaxed">
              <p>PRC Hardware was founded in 2009 with a simple vision: to bring the same quality of architectural hardware found in luxury projects to every home, office, and commercial space in India.</p>
              <p>What started as a small hardware distribution business in New Delhi quickly grew into a full-service procurement platform, serving interior designers, architects, builders, and homeowners across the country.</p>
              <p>Today, we carry over 5,000 SKUs across handles, hinges, locks, door closers, bathroom fittings, and more — sourced from India's best manufacturers and international brands.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/products" className="inline-block bg-[#34150F] text-[#EACEAA] px-10 py-4 rounded-tr-xl rounded-bl-xl font-bold text-lg hover:bg-[#85431E] transition-colors shadow-md">
              Explore Our Products →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
