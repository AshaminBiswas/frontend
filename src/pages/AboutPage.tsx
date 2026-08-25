import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Award, Truck, Users, Package, Star, Building2,
  CheckCircle2, ArrowRight, Sparkles, Clock, MapPin, ChevronRight,
  Shield, Layers, Wrench
} from "lucide-react";
import { Reveal } from "../components/common/Reveal";

const STATS = [
  { label: "Architectural SKUs", value: "5,000+", icon: Package, detail: "Handles, locks & fittings" },
  { label: "Satisfied Projects", value: "12,000+", icon: Users, detail: "Homes, offices & resorts" },
  { label: "Years of Excellence", value: "15+", icon: Award, detail: "Est. 2009 in New Delhi" },
  { label: "Dispatch Hubs", value: "8", icon: Building2, detail: "Pan-India logistics network" },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "304 & 316 Grade Metallurgy",
    desc: "We exclusively source high-density solid brass, die-cast zinc, and marine-grade stainless steel engineered for lifetime corrosion resistance.",
  },
  {
    icon: Wrench,
    title: "200,000+ Cycle Ratings",
    desc: "Every hinge, lock, and slider mechanism undergoes rigorous stress testing to guarantee smooth, silent performance under heavy commercial loads.",
  },
  {
    icon: Truck,
    title: "Pan-India Express Dispatch",
    desc: "Robust supply chain across 28 states and union territories with real-time tracking from our central Mandoli warehouse straight to your project site.",
  },
  {
    icon: Sparkles,
    title: "Architectural Customization",
    desc: "Tailored PVD finishes — from Brushed Gold and Antique Bronze to Matte Black — designed to match luxury interior color palettes.",
  },
];

const TIMELINE = [
  {
    year: "2009",
    title: "Foundation in Delhi",
    desc: "PRC Hardware was established in Mandoli, Delhi, with a vision to revolutionize architectural fitting availability across North India.",
  },
  {
    year: "2014",
    title: "Commercial & Cubicle Hardware Launch",
    desc: "Expanded into high-grade office partition systems, toilet cubicle fittings, and heavy-duty industrial door locks.",
  },
  {
    year: "2019",
    title: "Pan-India B2B Procurement Hub",
    desc: "Partnered with over 500+ top interior designers, architects, and estate builders across major metro regions.",
  },
  {
    year: "2025",
    title: "Omnichannel Digital Experience",
    desc: "Launched our direct procurement platform with live catalog synchronization, custom quote negotiation, and fast delivery.",
  },
];

export function AboutPage() {
  const [activeTab, setActiveTab] = useState<"STORY" | "STANDARDS" | "TIMELINE">("STORY");

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ HERO HEADER ═══════════════ */}
      <section className="bg-gradient-to-r from-[#34150F] via-[#5c2415] to-[#85431E] py-8 sm:py-14 md:py-20 px-3 sm:px-6 md:px-8 lg:px-16 text-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D39858]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#34150F]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <Reveal>
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#D39858]/20 border border-[#D39858]/40 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-3 sm:mb-6 shadow-xs">
              <Sparkles size={12} className="text-[#D39858] sm:w-3.5 sm:h-3.5" />
              <span className="text-[9px] sm:text-[11px] font-black text-[#D39858] uppercase tracking-wider">
                India&apos;s Architectural Hardware Specialist
              </span>
            </div>
          </Reveal>

          <Reveal delay={50}>
            <h1
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#EACEAA] leading-tight mb-3 sm:mb-6"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Crafting the Fine Details That <br className="hidden sm:inline" />
              <span className="text-[#D39858] italic font-serif">Transform Architectural Spaces</span>
            </h1>
          </Reveal>

          <Reveal delay={100}>
            <p className="text-xs sm:text-base md:text-lg text-[#EACEAA]/80 max-w-3xl mx-auto leading-relaxed mb-5 sm:mb-8">
              At PRC Hardware, we believe premium fittings are the soul of architectural design. From luxury cabinet pulls to heavy commercial door locks, we manufacture and curate hardware built for precision, durability, and timeless style.
            </p>
          </Reveal>

          <Reveal delay={150}>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
              <Link
                to="/products"
                className="bg-[#D39858] text-[#34150F] font-black text-xs sm:text-sm px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                Explore Product Catalog <ArrowRight size={14} />
              </Link>
              <Link
                to="/contact"
                className="bg-[#EACEAA]/10 text-[#EACEAA] font-bold text-xs sm:text-sm px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/20 transition-all border border-[#EACEAA]/20"
              >
                Contact Sales Team
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ STATS COUNTER ROW ═══════════════ */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 lg:px-16 -mt-6 sm:-mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {STATS.map(({ label, value, icon: Icon, detail }, idx) => (
            <Reveal key={label} delay={idx * 50}>
              <div className="bg-[#f5e8d4] p-3 sm:p-5 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl border border-[rgba(52,21,15,0.12)] shadow-sm hover:border-[#D39858] transition-all text-center group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#34150F] text-[#D39858] rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-2xs group-hover:scale-110 transition-transform">
                  <Icon size={16} className="sm:w-5 sm:h-5" />
                </div>
                <p
                  className="text-lg sm:text-2xl md:text-3xl font-black text-[#34150F] mb-0.5 sm:mb-1"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {value}
                </p>
                <p className="text-[11px] sm:text-xs font-bold text-[#34150F]">{label}</p>
                <p className="text-[9px] sm:text-[10px] text-[#85431E]/70 font-semibold mt-0.5">{detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ STORY & CRAFTSMANSHIP (SPLIT SECTION) ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-16 sm:py-20">
        <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-10 border border-[rgba(52,21,15,0.08)] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Story Content */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#85431E] bg-[#EACEAA]/60 px-3.5 py-1.5 rounded-full border border-[rgba(52,21,15,0.08)]">
              <Clock size={13} className="text-[#D39858]" /> Our Heritage
            </div>

            <h2
              className="text-2xl sm:text-4xl font-extrabold text-[#34150F] leading-snug"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Building India&apos;s Benchmark for Architectural Hardware
            </h2>

            <p className="text-xs sm:text-sm text-[#85431E] leading-relaxed font-semibold">
              Founded in 2009 in Delhi, PRC Hardware started with a commitment to bridge the gap between high-end international hardware standards and accessible domestic procurement.
            </p>

            <p className="text-xs sm:text-sm text-[#85431E] leading-relaxed">
              What began as a focused hardware distribution house has evolved into a premier architectural fitting authority. Today, we serve over 12,000 interior architects, estate contractors, furniture manufacturers, and discerning homeowners across India with precision-machined brass, stainless steel, and aluminum solutions.
            </p>

            {/* Quality Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                "ISO 9001:2015 Quality Certified",
                "Solid Brass & 304/316 Steel Alloys",
                "Electroplated & PVD Satin Finishes",
                "Comprehensive Manufacturer Guarantee",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-bold text-[#34150F]">
                  <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link
                to="/products"
                className="bg-[#34150F] text-[#EACEAA] text-xs font-bold px-6 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md"
              >
                Browse Hardware Catalog
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-tr-3xl rounded-bl-3xl overflow-hidden border-2 border-[#34150F]/15 shadow-lg group">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format"
                alt="Precision Architectural Hardware"
                className="w-full h-72 sm:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#34150F] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4 right-4 p-4 bg-[#34150F]/90 backdrop-blur-sm rounded-tr-xl rounded-bl-xl border border-[#D39858]/30">
                <p className="text-xs font-black text-[#D39858] uppercase tracking-wider">Precision Engineering</p>
                <p className="text-xs text-[#EACEAA] font-medium mt-1">
                  Crafted for high-frequency residential and heavy commercial doors.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#EACEAA]/40 p-4 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)]">
                <p className="text-lg font-black text-[#34150F]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  100%
                </p>
                <p className="text-[11px] font-bold text-[#85431E]">Quality Checked Batch Testing</p>
              </div>
              <div className="bg-[#EACEAA]/40 p-4 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.08)]">
                <p className="text-lg font-black text-[#34150F]" style={{ fontFamily: "'DM Mono', monospace" }}>
                  28+
                </p>
                <p className="text-[11px] font-bold text-[#85431E]">States & Union Territories Served</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════ CORE ENGINEERING PILLARS ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 pb-16 sm:pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-[#34150F] mb-3"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Our Core Quality Standards
          </h2>
          <p className="text-xs sm:text-sm text-[#85431E] font-semibold">
            Built to strict architectural specifications to guarantee longevity, aesthetic cohesion, and seamless installation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map(({ icon: Icon, title, desc }, idx) => (
            <Reveal key={title} delay={idx * 60}>
              <div className="bg-[#f5e8d4] p-6 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.1)] shadow-sm hover:shadow-md transition-all hover:border-[#D39858] h-full flex flex-col justify-between">
                <div>
                  <div className="w-11 h-11 bg-[#34150F] text-[#D39858] rounded-tr-xl rounded-bl-xl flex items-center justify-center mb-4 shadow-sm">
                    <Icon size={22} />
                  </div>
                  <h3
                    className="text-base font-bold text-[#34150F] mb-2"
                    style={{ fontFamily: "'Gilda Display', serif" }}
                  >
                    {title}
                  </h3>
                  <p className="text-xs text-[#85431E] leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ MILESTONE TIMELINE (2009 - 2025) ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 pb-16 sm:pb-20">
        <div className="bg-[#34150F] text-[#EACEAA] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-10 border border-[#D39858]/20 shadow-lg">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#D39858] bg-[#D39858]/10 px-3 py-1 rounded-full border border-[#D39858]/20">
              15+ YEARS JOURNEY
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#EACEAA] mt-3"
              style={{ fontFamily: "'Gilda Display', serif" }}
            >
              Key Milestones in Our Growth
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIMELINE.map((item, index) => (
              <div
                key={item.year}
                className="bg-[#1e0a06] p-5 rounded-tr-2xl rounded-bl-2xl border border-[#D39858]/20 relative flex flex-col justify-between"
              >
                <div>
                  <span
                    className="text-3xl font-black text-[#D39858] block mb-2"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {item.year}
                  </span>
                  <h4 className="text-sm font-bold text-[#EACEAA] mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#EACEAA]/70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-4 text-right">
                  <span className="text-[10px] font-mono text-[#D39858]/60">0{index + 1} / 04</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HEADQUARTERS & WAREHOUSE LOCATION ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 pb-16">
        <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 border border-[rgba(52,21,15,0.08)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#34150F] text-[#D39858] rounded-tr-2xl rounded-bl-2xl flex items-center justify-center flex-shrink-0 shadow-md">
              <MapPin size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                Central Dispatch Headquarters
              </h3>
              <p className="text-xs text-[#85431E] font-semibold mt-1">
                H -3, J.R. Complex Gate No 4, Mela Ram Farm, Mandoli, New Delhi 110093, India
              </p>
              <p className="text-[11px] text-[#85431E]/70 mt-0.5">
                ISO 9001:2015 Registered Facility • Mon - Sat: 9:30 AM - 7:00 PM IST
              </p>
            </div>
          </div>

          <Link
            to="/contact"
            className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all whitespace-nowrap shadow-md flex-shrink-0"
          >
            Visit / Contact Us →
          </Link>
        </div>
      </section>

      {/* ═══════════════ CALL TO ACTION ═══════════════ */}
      <section className="bg-[#34150F] text-center py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2
            className="text-2xl sm:text-4xl font-extrabold text-[#EACEAA]"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Ready to Elevate Your Architectural Project?
          </h2>
          <p className="text-xs sm:text-sm text-[#EACEAA]/80 leading-relaxed max-w-xl mx-auto">
            Discover precision handles, concealed soft-close hinges, digital smart locks, and partition hardware online today.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/products"
              className="bg-[#D39858] text-[#34150F] font-black text-xs sm:text-sm px-8 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all shadow-md"
            >
              Shop Full Hardware Catalog
            </Link>
            <Link
              to="/services/appointments"
              className="bg-[#EACEAA]/10 text-[#EACEAA] font-bold text-xs sm:text-sm px-8 py-3.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/20 transition-all border border-[#EACEAA]/20"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
