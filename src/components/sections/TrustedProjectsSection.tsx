import React from "react";
import { Link } from "react-router-dom";
import { Building2, Landmark, CheckCircle2, ShieldCheck, Sparkles, MapPin, ArrowRight } from "lucide-react";
import { Reveal } from "../common/Reveal";

// ─── Complete Dataset of Trusted Clients & Landmark Completed Projects ───────
// Distributed across 3 tracks for alternating continuous smooth infinite marquees

const TRACK_1_PROJECTS: { name: string; tag?: string }[] = [
  { name: "Reliance JIO", tag: "North India" },
  { name: "Parliament House", tag: "Delhi" },
  { name: "IIFCO Sadan", tag: "Delhi" },
  { name: "Delhi Metro Railway Corporation (DMRC)", tag: "Delhi" },
  { name: "Stellar IT Park", tag: "Noida" },
  { name: "Stellar Business Park", tag: "G. Noida" },
  { name: "MVN University", tag: "Palwal" },
  { name: "Lohia Ayurvedic Hospital", tag: "Lucknow" },
  { name: "Steller Jeevan", tag: "G. Noida" },
  { name: "Stellar 135", tag: "Noida" },
  { name: "B26 Udyog Vihar Phase IV", tag: "Gurgaon" },
  { name: "Star Mall Project", tag: "Commercial" },
  { name: "JMD", tag: "Gurgaon" },
  { name: "Jindal Steel Power Limited", tag: "Industrial" },
  { name: "Modern School", tag: "Vasant Vihar, Delhi" },
  { name: "LPS Global School", tag: "Noida" },
  { name: "Kidzee School", tag: "Gurgaon" },
  { name: "Stellar Gymkhana", tag: "G. Noida" },
  { name: "Indira Gandhi Athletic Stadium", tag: "Guwahati" },
  { name: "Billabong High International School", tag: "Noida" },
  { name: "Spring Board Business Hub", tag: "Bangalore" },
  { name: "JLN Stadium", tag: "Delhi" },
  { name: "RK Khanna Stadium", tag: "Delhi" },
  { name: "Wankhede Stadium", tag: "Mumbai" },
  { name: "Infosys", tag: "Bangalore" },
  { name: "GKVK Campus", tag: "Bangalore" },
  { name: "TATA Institute", tag: "Bangalore" },
  { name: "Royal Thai Embassy", tag: "Delhi" },
  { name: "Siemens", tag: "Bangalore" },
  { name: "PNC Cognitio School", tag: "Bangalore" },
  { name: "Hosur Public School", tag: "Bangalore" },
  { name: "MS Ramaiah College", tag: "Bangalore" },
  { name: "Chinmaya School", tag: "Bangalore" },
  { name: "Virginia Mall", tag: "Bangalore" },
  { name: "Mercedes Showroom", tag: "Thane" },
  { name: "Draeger India", tag: "Wasai" },
  { name: "SMCC", tag: "Mumbai" },
  { name: "CULT FIT GYM", tag: "Pan India" },
  { name: "Siemens Technology", tag: "Bangalore" },
  { name: "CMR Ekya School", tag: "Bangalore" },
  { name: "Narayana School", tag: "Bangalore" },
  { name: "Zomato", tag: "Hyderabad & Bangalore" },
  { name: "Manipal University", tag: "Mangalore" },
  { name: "Phoenix Marketing", tag: "Commercial" },
  { name: "Miraj Cinema", tag: "Pan India" },
];

const TRACK_2_PROJECTS: { name: string; tag?: string }[] = [
  { name: "Omaxe Mall", tag: "Faridabad & Chandigarh" },
  { name: "N.H.A.I. (Delhi Dwarka)", tag: "National Highway" },
  { name: "Asian Fidelis Multi Speciality Hospital", tag: "Healthcare" },
  { name: "X L Health Care", tag: "Bangalore" },
  { name: "United Medicity", tag: "Allahabad" },
  { name: "Shiva Statue Project", tag: "Udaipur" },
  { name: "Indiabulls Mega Mall", tag: "Jodhpur" },
  { name: "AIHP Udhyog Vihar", tag: "Gurgaon" },
  { name: "Piccadily Holiday Resorts", tag: "Hospitality" },
  { name: "Shapoorji Pallonji & Company", tag: "Infrastructure" },
  { name: "M3M India Private Limited", tag: "Gurgaon" },
  { name: "M3M Corner Walk", tag: "Gurgaon" },
  { name: "M3M Prive, Sector-73", tag: "Gurgaon" },
  { name: "M3M 65th Avenue, Sector-65", tag: "Gurgaon" },
  { name: "M3M Broadway, Sector-71", tag: "Gurgaon" },
  { name: "HDFC BANK LTD", tag: "Mohali" },
  { name: "Synergy Corporate", tag: "Gurgaon" },
  { name: "DLF Urban Private Limited", tag: "New Delhi" },
  { name: "Chambal Automotives Pvt Ltd", tag: "Kota" },
  { name: "IIT (BHU)", tag: "Varanasi" },
  { name: "Eminent Colonizers Pvt. Ltd.", tag: "Kota" },
  { name: "S R Group Institute", tag: "Lucknow" },
  { name: "Hiranandani Eden Club House", tag: "Powai" },
  { name: "Hiranandani The Walk Club House", tag: "Thane" },
  { name: "H&M Showroom", tag: "Mumbai" },
  { name: "Coforge Ltd (Erstwhile NIIT Tech)", tag: "G. Noida" },
  { name: "Central Vista Avenue, EPC", tag: "New Delhi" },
  { name: "Embassy Park", tag: "Bangalore" },
  { name: "Hockey Astro Turf, Kailash Prakash Stadium", tag: "Meerut" },
  { name: "Kanpur Metro", tag: "Kanpur" },
  { name: "Highway Amenities Developers Pvt Ltd", tag: "Infrastructure" },
  { name: "Superior Lifestyles Private Limited", tag: "Indore" },
  { name: "Cherry Hill", tag: "Noida" },
  { name: "V3S Mall, Laxminagar", tag: "New Delhi" },
  { name: "Miraj Hotels", tag: "Pan India" },
  { name: "JAHWA ELECTRONICS CO. LTD.", tag: "G. Noida" },
  { name: "AIPL Joy Central", tag: "Gurgaon" },
  { name: "ATS DREAMZONE PRIVATE LIMITED", tag: "Real Estate" },
  { name: "OMAXE LIMITED", tag: "Real Estate" },
  { name: "KBPL Infrastructure Private Limited", tag: "Noida" },
  { name: "Flipspace Technology", tag: "Bangalore" },
  { name: "Integrated Workspaces", tag: "Bangalore" },
  { name: "CNA Enterprises", tag: "Bangalore" },
  { name: "Hombae Construction", tag: "Bangalore" },
];

const TRACK_3_PROJECTS: { name: string; tag?: string }[] = [
  { name: "KIA SHOWROOM", tag: "Bangalore" },
  { name: "P3 ENTERPRISES LLP", tag: "Bangalore" },
  { name: "SWATHI CONSTRUCTIONS", tag: "Bangalore" },
  { name: "NATIONAL PUBLIC SCHOOLS", tag: "Bangalore" },
  { name: "PURAVANKARA LIMITED", tag: "Bangalore" },
  { name: "JOYALUKKAS", tag: "Bangalore" },
  { name: "DSR INFRA PVT LTD", tag: "Bangalore" },
  { name: "GLAZMEN INDIA PVT LTD", tag: "Bangalore" },
  { name: "SURYAVARDHAN CONSTRUCTION", tag: "Bangalore" },
  { name: "BHAGIRATH CONSTRUCTION", tag: "Bangalore" },
  { name: "KRIDL", tag: "Bangalore" },
  { name: "YENEPOYA UNIVERSITY", tag: "Bangalore" },
  { name: "INSIDE SPACE", tag: "Bangalore" },
  { name: "BIZZHUB VENTURES PVT LTD", tag: "Bangalore" },
  { name: "PROVIDENT HOUSING LTD", tag: "Bangalore" },
  { name: "Mastercompus pvt ltd", tag: "Bangalore" },
  { name: "Zuna Interior", tag: "Bangalore" },
  { name: "Max Media Solutions", tag: "Bangalore" },
  { name: "Vibhav Interior Decor", tag: "Bangalore" },
  { name: "MCN INFRASTRUCTURE PVT LTD", tag: "Bangalore" },
  { name: "STG INFRASYS PVT LTD", tag: "Bangalore" },
  { name: "INNOVENT SPACE PVT LTD", tag: "Bangalore" },
  { name: "JN ENTERPRISES", tag: "Bangalore" },
  { name: "SHARMA INTERIOR", tag: "Bangalore" },
  { name: "NEW HORIZONS SCHOOL", tag: "Bangalore" },
  { name: "FLIPSPACE TECHNOLOGY", tag: "Bangalore" },
  { name: "VEDA VYASA INTERIOR", tag: "Bangalore" },
  { name: "VARDA INNOVATION PVT", tag: "Bangalore" },
  { name: "L&Y MYSORE", tag: "Bangalore" },
  { name: "Karumbaiah Academy", tag: "Bangalore" },
  { name: "Capital School", tag: "Bangalore" },
  { name: "Rashtrotthana Parishat", tag: "Bangalore" },
  { name: "Kumaran School", tag: "Bangalore" },
  { name: "Aishwarya Heights", tag: "Bangalore" },
  { name: "Vinegar High School", tag: "Bangalore" },
  { name: "Hyundai Showroom", tag: "Bangalore" },
  { name: "NIET INSTITUTE MYSORE", tag: "Bangalore" },
  { name: "NEXA CAR SHOWROOM", tag: "Bangalore" },
  { name: "KC VIJAYKUMAR", tag: "Bangalore" },
  { name: "DISCOVERY VILLAGE", tag: "Bangalore" },
  { name: "EAGLETON RESORT", tag: "Bangalore" },
  { name: "PANASONIC", tag: "Bangalore" },
  { name: "TATA INSTITUTE", tag: "Bangalore" },
];

interface ProjectChipProps {
  name: string;
  tag?: string;
}

function ProjectChip({ name, tag }: ProjectChipProps) {
  return (
    <div
      className="group relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full bg-[#34150F] hover:bg-[#4A1F17] border border-[#85431E]/40 hover:border-[#D39858] shadow-2xs hover:shadow-md hover:shadow-[#34150F]/15 transition-all duration-300 ease-out hover:-translate-y-0.5 select-none cursor-pointer flex-shrink-0"
    >
      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#D39858] group-hover:scale-125 group-hover:bg-[#F2C082] transition-transform duration-300 shadow-xs shadow-[#D39858]/50 flex-shrink-0" />
      <span
        className="text-[11px] sm:text-xs md:text-sm font-semibold text-[#FDFDF4] group-hover:text-white tracking-wide whitespace-nowrap transition-colors"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        {name}
      </span>
      {tag && (
        <span className="text-[8px] sm:text-[10px] md:text-[11px] font-medium text-[#EACEAA]/90 group-hover:text-[#F2C082] bg-[#1E0B07] px-1.5 py-0.5 rounded-full border border-[#D39858]/20 whitespace-nowrap transition-colors">
          {tag}
        </span>
      )}
    </div>
  );
}

export function TrustedProjectsSection() {
  return (
    <section className="relative bg-[#EED5BC] py-4 sm:py-8 md:py-12 overflow-hidden">
      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 mb-3 sm:mb-6 text-center relative z-10">
        <Reveal>
          <h2
            className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#34150F] tracking-tight leading-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Trusted by India&apos;s Iconic Institutions &amp; Landmark Projects
          </h2>
        </Reveal>
      </div>

      {/* ─── Dual-Direction Auto-Scrolling Multi-Track Marquee ─── */}
      <div className="relative w-full overflow-hidden space-y-1.5 sm:space-y-3 marquee-container">
        {/* ═══ TRACK 1: Moving Right-to-Left ═══ */}
        <div className="flex overflow-hidden py-0.5 sm:py-1">
          <div className="animate-marquee-left flex gap-1.5 sm:gap-3 items-center">
            {TRACK_1_PROJECTS.map((item, idx) => (
              <ProjectChip key={`t1-a-${idx}`} name={item.name} tag={item.tag} />
            ))}
            {/* Duplicated for seamless loop */}
            {TRACK_1_PROJECTS.map((item, idx) => (
              <ProjectChip key={`t1-b-${idx}`} name={item.name} tag={item.tag} />
            ))}
          </div>
        </div>

        {/* ═══ TRACK 2: Moving Left-to-Right ═══ */}
        <div className="flex overflow-hidden py-0.5 sm:py-1">
          <div className="animate-marquee-right flex gap-1.5 sm:gap-3 items-center">
            {TRACK_2_PROJECTS.map((item, idx) => (
              <ProjectChip key={`t2-a-${idx}`} name={item.name} tag={item.tag} />
            ))}
            {/* Duplicated for seamless loop */}
            {TRACK_2_PROJECTS.map((item, idx) => (
              <ProjectChip key={`t2-b-${idx}`} name={item.name} tag={item.tag} />
            ))}
          </div>
        </div>

        {/* ═══ TRACK 3: Moving Right-to-Left ═══ */}
        <div className="flex overflow-hidden py-0.5 sm:py-1">
          <div className="animate-marquee-left flex gap-1.5 sm:gap-3 items-center">
            {TRACK_3_PROJECTS.map((item, idx) => (
              <ProjectChip key={`t3-a-${idx}`} name={item.name} tag={item.tag} />
            ))}
            {/* Duplicated for seamless loop */}
            {TRACK_3_PROJECTS.map((item, idx) => (
              <ProjectChip key={`t3-b-${idx}`} name={item.name} tag={item.tag} />
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Map & Portfolio CTA */}
      <div className="text-center mt-4 sm:mt-6 relative z-20">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#34150F] hover:bg-[#4A1F17] text-[#EACEAA] text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 border border-[#85431E]/40 group"
        >
          <MapPin size={15} className="text-[#D39858]" />
          <span>Explore Interactive India Map &amp; Completed Projects</span>
          <ArrowRight size={15} className="text-[#D39858] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Subtle Bottom Trust Metric Bar */}
      <div className="max-w-4xl mx-auto px-3 mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-[#34150F]/10 flex flex-wrap items-center justify-around gap-2 sm:gap-4 text-center text-[10px] sm:text-xs text-[#85431E] font-semibold">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#85431E]" />
          <span>150+ Landmark Commercial &amp; Govt Projects</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Landmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#85431E]" />
          <span>Central Vista &amp; Parliament Trusted Partner</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#85431E]" />
          <span>Grade-A Architectural Specifications</span>
        </div>
      </div>
    </section>
  );
}
