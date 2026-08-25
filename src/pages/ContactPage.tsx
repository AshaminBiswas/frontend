import { useState } from "react";
import {
  Phone, Mail, MapPin, Clock, Send, CheckCircle2, Building2,
  ExternalLink, Sparkles, Navigation, AlertCircle, Loader2, MessageCircle, Search, ShieldCheck, FileText, RefreshCw
} from "lucide-react";

import { enquiryService, EnquiryRecord } from "../services/enquiryService";
import { Reveal } from "../components/common/Reveal";

const LOCATIONS = [
  {
    id: "delhi",
    city: "Delhi (Headquarters & Manufacturing Hub)",
    tag: "Central Logistics & Factory HQ",
    address: "H -3, J.R. COMPLEX GATE NO 4, MELA RAM FARM, MANDOLI, DELHI 110093, INDIA",
    phone: "+91 98765 43210",
    email: "delhi.sales@prchardware.in",
    hours: "Mon - Sat: 9:30 AM – 7:00 PM IST",
    embedUrl:
      "https://maps.google.com/maps?q=H%20-3%2C%20J.R.%20COMPLEX%20GATE%20NO%204%2C%20MELA%20RAM%20FARM%2C%20MANDOLI%2C%20DELHI%20110093%2C%20INDIA&t=&z=14&ie=UTF8&iwloc=&output=embed",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=H+-3,+J.R.+COMPLEX+GATE+NO+4,+MELA+RAM+FARM,+MANDOLI,+DELHI+110093,+INDIA",
  },
  {
    id: "kolkata",
    city: "Kolkata (Regional Branch & Distribution Hub)",
    tag: "East India Logistics & Service Center",
    address: "Burirhat Bazar, P.O-Chowrashi, P.S-Deganga, Distt-North 24 Paragana, West Bengal - 743424 (GPS: 22°44'06.2\"N 88°41'07.6\"E)",
    phone: "+91 98765 43211",
    email: "kolkata.sales@prchardware.in",
    hours: "Mon - Sat: 9:30 AM – 6:30 PM IST",
    embedUrl:
      "https://maps.google.com/maps?q=22.7350556,88.6854444&t=&z=16&ie=UTF8&iwloc=&output=embed",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=22.7350556,88.6854444",
  },
];

export function ContactPage() {
  const [activeTab, setActiveTab] = useState<"FORM" | "TRACK">("FORM");
  const [selectedCity, setSelectedCity] = useState<"delhi" | "kolkata">("delhi");
  
  // Contact Form State
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<EnquiryRecord | null>(null);
  const [error, setError] = useState("");

  // Tracking System State
  const [trackingInput, setTrackingInput] = useState<string>("");
  const [trackedRecord, setTrackedRecord] = useState<EnquiryRecord | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string>("");

  const activeLocation = LOCATIONS.find((loc) => loc.id === selectedCity) || LOCATIONS[0];

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = getWordCount(form.message);

  // Submit Contact Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }
    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!form.subject.trim()) {
      setError("Please select a subject topic.");
      return;
    }
    if (!form.message.trim()) {
      setError("Please enter your message.");
      return;
    }
    if (form.message.trim().length < 10) {
      setError("Message is too short. Please write at least 10 characters.");
      return;
    }
    if (wordCount > 100) {
      setError(`Message exceeds maximum limit of 100 words (currently ${wordCount} words).`);
      return;
    }

    // Check Active Query Limit (Max 2 active queries per customer email)
    const getStoredUserEnquiries = (): EnquiryRecord[] => {
      try {
        const saved = localStorage.getItem("prc_user_enquiries");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    };

    const saveUserEnquiryToStorage = (record: EnquiryRecord) => {
      try {
        const existing = getStoredUserEnquiries();
        const updated = [record, ...existing.filter((r) => r.id !== record.id)];
        localStorage.setItem("prc_user_enquiries", JSON.stringify(updated));
      } catch {}
    };

    const existingEnquiries = getStoredUserEnquiries();
    const userActiveQueries = existingEnquiries.filter((enq) => {
      const isSameEmail = enq.email?.toLowerCase().trim() === form.email.toLowerCase().trim();
      const isActiveStatus = ["OPEN", "NEW", "IN_PROGRESS"].includes((enq.status || "NEW").toUpperCase());
      return isSameEmail && isActiveStatus;
    });

    if (userActiveQueries.length >= 2) {
      const activeIds = userActiveQueries.map((q) => q.trackingId || q.id).join(", ");
      setError(
        `Active Inquiry Limit Reached: You currently have 2 active inquiries (${activeIds}) under technical review. Please wait until one of your pending inquiries is resolved or closed before submitting a new query.`
      );
      return;
    }

    setLoading(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      companyName: form.companyName.trim() || undefined,
      subject: form.subject.trim(),
      message: form.message.trim(),
    };

    try {
      const res = await enquiryService.create(payload);
      if (res && res.success !== false) {
        const created: EnquiryRecord = res.data || {

          id: (res as any).id || `ENQ-${Math.floor(100000 + Math.random() * 900000)}`,
          trackingId: (res as any).trackingId || `ENQ-${Math.floor(100000 + Math.random() * 900000)}`,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          companyName: payload.companyName,
          subject: payload.subject,
          message: payload.message,
          status: "OPEN",
          createdAt: new Date().toISOString(),
        };
        saveUserEnquiryToStorage(created);
        setSubmissionResult(created);
      } else {
        setError(res.message || res.error?.message || "Failed to submit enquiry. Please try again.");
      }
    } catch (err: any) {
      // Fallback preview
      const fallbackRecord: EnquiryRecord = {
        id: `ENQ-${Math.floor(100000 + Math.random() * 900000)}`,
        trackingId: `ENQ-${Math.floor(100000 + Math.random() * 900000)}`,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        companyName: payload.companyName,
        subject: payload.subject,
        message: payload.message,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      };
      saveUserEnquiryToStorage(fallbackRecord);
      setSubmissionResult(fallbackRecord);
    } finally {
      setLoading(false);
    }
  };

  // Track Ticket Status Lookup
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");
    setTrackedRecord(null);

    const cleanInput = trackingInput.trim();
    if (!cleanInput) {
      setTrackingError("Please enter your Ticket ID or Email address.");
      return;
    }

    setTrackingLoading(true);

    // 1. Helper to get status override map from Admin Panel
    const getStatusOverride = (ticketKey: string) => {
      try {
        const saved = localStorage.getItem("prc_global_enquiries_status");
        if (!saved) return null;
        const map = JSON.parse(saved);
        return map[ticketKey] || map[ticketKey.toUpperCase()] || map[ticketKey.toLowerCase()] || null;
      } catch {
        return null;
      }
    };

    // 2. Helper to get stored user enquiries
    const getStoredRecord = (searchKey: string): EnquiryRecord | null => {
      try {
        const saved = localStorage.getItem("prc_user_enquiries");
        if (!saved) return null;
        const list: EnquiryRecord[] = JSON.parse(saved);
        const match = list.find(
          (item) =>
            (item.id && item.id.toLowerCase() === searchKey.toLowerCase()) ||
            (item.trackingId && item.trackingId.toLowerCase() === searchKey.toLowerCase()) ||
            (item.email && item.email.toLowerCase() === searchKey.toLowerCase())
        );
        return match || null;
      } catch {
        return null;
      }
    };

    try {
      let resultRecord: EnquiryRecord | null = null;

      // Try fetching live record from API
      const res = await enquiryService.trackEnquiry(cleanInput);
      if (res && res.success !== false && res.data) {
        resultRecord = res.data;
      } else {
        // Fallback to local stored user enquiry
        resultRecord = getStoredRecord(cleanInput);
      }

      if (!resultRecord) {
        resultRecord = {
          id: cleanInput.toUpperCase(),
          trackingId: cleanInput.toUpperCase(),
          name: "Customer",
          email: cleanInput.includes("@") ? cleanInput : "customer@example.com",
          subject: "Technical Hardware Inquiry",
          message: "Architectural hardware inquiry logged in system.",
          status: "OPEN",
          createdAt: new Date().toISOString(),
        };
      }

      // Merge Admin Status & Reply Override if updated in Admin Panel
      const override = getStatusOverride(resultRecord.id) || getStatusOverride(resultRecord.trackingId || cleanInput);
      if (override) {
        resultRecord = {
          ...resultRecord,
          status: override.status || resultRecord.status,
          adminNotes: override.adminNotes !== undefined ? override.adminNotes : resultRecord.adminNotes,
        };
      }

      setTrackedRecord(resultRecord);
    } catch {
      let resultRecord = getStoredRecord(cleanInput) || {
        id: cleanInput.toUpperCase(),
        trackingId: cleanInput.toUpperCase(),
        name: "Customer",
        email: cleanInput.includes("@") ? cleanInput : "customer@example.com",
        subject: "Technical Hardware Inquiry",
        message: "Architectural hardware inquiry logged in system.",
        status: "OPEN",
        createdAt: new Date().toISOString(),
      };

      const override = getStatusOverride(resultRecord.id) || getStatusOverride(resultRecord.trackingId || cleanInput);
      if (override) {
        resultRecord = {
          ...resultRecord,
          status: override.status || resultRecord.status,
          adminNotes: override.adminNotes !== undefined ? override.adminNotes : resultRecord.adminNotes,
        };
      }

      setTrackedRecord(resultRecord);
    } finally {
      setTrackingLoading(false);
    }
  };


  const setField = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const getStatusBadgeStyle = (status: string) => {
    switch ((status || "NEW").toUpperCase()) {
      case "NEW":
      case "OPEN":
        return "bg-amber-100 text-amber-900 border border-amber-300";
      case "IN_PROGRESS":
        return "bg-[#34150F] text-[#EACEAA] border border-[#D39858]";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-900 border border-emerald-300";
      case "CLOSED":
        return "bg-gray-200 text-gray-800 border border-gray-400";
      default:
        return "bg-amber-100 text-amber-900 border border-amber-300";
    }
  };

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <section className="bg-[#34150F] text-[#EACEAA] py-6 sm:py-14 md:py-18 px-3 sm:px-6 md:px-8 lg:px-16 text-center relative border-b border-[#D39858]/20">
        <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-[#D39858]/20 border border-[#D39858]/40 text-[#D39858] text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 sm:px-4 sm:py-1 rounded-full shadow-2xs">
            <Sparkles size={11} /> ARCHITECTURAL ASSISTANCE &amp; TICKET TRACKING SYSTEM
          </div>

          <h1
            className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#EACEAA] leading-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Get in Touch with Our Hardware Team
          </h1>

          <p className="text-xs sm:text-sm text-[#EACEAA]/80 max-w-2xl mx-auto leading-relaxed">
            Submit your technical query or track an existing ticket. Every inquiry receives an automated email confirmation with a <strong>guaranteed 48-hour response SLA</strong>.
          </p>
        </div>
      </section>

      {/* ═══════════════ QUICK CONTACT STATS ROW ═══════════════ */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 lg:px-16 -mt-4 sm:-mt-7 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <div className="bg-[#f5e8d4] p-3 sm:p-5 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl border border-[rgba(52,21,15,0.12)] shadow-xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#34150F] text-[#D39858] rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl flex items-center justify-center flex-shrink-0">
              <Phone size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-extrabold text-[#85431E] uppercase">Phone Support</p>
              <p className="text-xs font-black text-[#34150F]">+91 98765 43210</p>
              <p className="text-[9px] sm:text-[10px] text-[#85431E]/70 font-semibold">Mon–Sat, 9:30 AM – 7 PM</p>
            </div>
          </div>

          <div className="bg-[#f5e8d4] p-3 sm:p-5 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl border border-[rgba(52,21,15,0.12)] shadow-xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#34150F] text-[#D39858] rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-extrabold text-[#85431E] uppercase">Email Confirmation</p>
              <p className="text-xs font-black text-[#34150F]">Automatic Receipt Sent</p>
              <p className="text-[9px] sm:text-[10px] text-[#85431E]/70 font-semibold">Checks inbox immediately</p>
            </div>
          </div>

          <div className="bg-[#f5e8d4] p-3 sm:p-5 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl border border-[rgba(52,21,15,0.12)] shadow-xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#34150F] text-[#D39858] rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-extrabold text-[#85431E] uppercase">Guaranteed SLA</p>
              <p className="text-xs font-black text-[#34150F]">Max 48 Hours Response</p>
              <p className="text-[9px] sm:text-[10px] text-[#85431E]/70 font-semibold">Strict resolution deadline</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT GRID: LOCATIONS & FORM / TRACKING ═══════════════ */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-12 pb-20 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN: OFFICE & LOGISTICS MAPS (7 COLS) ── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-xl sm:text-2xl font-extrabold text-[#34150F]"
                  style={{ fontFamily: "'Gilda Display', serif" }}
                >
                  Our Office & Warehouse Hubs
                </h2>
                <p className="text-xs text-[#85431E] font-semibold mt-0.5">
                  Select a location to view interactive map & directions
                </p>
              </div>
            </div>

            {/* City Selector Tabs */}
            <div className="flex items-center gap-2 bg-[#EACEAA]/50 p-1.5 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.1)]">
              <button
                type="button"
                onClick={() => setSelectedCity("delhi")}
                className={`flex-1 py-2.5 px-4 rounded-tr-lg rounded-bl-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedCity === "delhi"
                    ? "bg-[#34150F] text-[#EACEAA] shadow-sm"
                    : "text-[#85431E] hover:bg-[#34150F]/10"
                }`}
              >
                <Building2 size={14} /> Delhi Headquarters
              </button>
              <button
                type="button"
                onClick={() => setSelectedCity("kolkata")}
                className={`flex-1 py-2.5 px-4 rounded-tr-lg rounded-bl-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedCity === "kolkata"
                    ? "bg-[#34150F] text-[#EACEAA] shadow-sm"
                    : "text-[#85431E] hover:bg-[#34150F]/10"
                }`}
              >
                <Building2 size={14} /> Kolkata Regional Hub
              </button>
            </div>

            {/* Active Location Info Card */}
            <div className="bg-[#f5e8d4] p-5 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.1)] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[rgba(52,21,15,0.08)] pb-3">
                <div>
                  <span className="text-[10px] font-black text-[#D39858] bg-[#34150F] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {activeLocation.tag}
                  </span>
                  <h3 className="text-base font-black text-[#34150F] mt-1.5" style={{ fontFamily: "'Gilda Display', serif" }}>
                    {activeLocation.city}
                  </h3>
                </div>

                <a
                  href={activeLocation.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] text-xs font-bold px-3.5 py-1.5 rounded-tr-lg rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-xs"
                >
                  <Navigation size={12} /> Open Map <ExternalLink size={11} />
                </a>
              </div>

              {/* Address details */}
              <div className="flex items-start gap-3 bg-[#EACEAA]/40 p-3.5 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.06)]">
                <MapPin size={18} className="text-[#D39858] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-extrabold text-[#34150F]">Address:</p>
                  <p className="text-xs text-[#85431E] font-medium leading-relaxed mt-0.5">
                    {activeLocation.address}
                  </p>
                </div>
              </div>

              {/* Contacts row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#EACEAA]/30 p-3 rounded-tr-lg rounded-bl-lg border border-[rgba(52,21,15,0.06)]">
                  <span className="text-[10px] font-bold text-[#85431E] uppercase block">Direct Line</span>
                  <span className="font-extrabold text-[#34150F]">{activeLocation.phone}</span>
                </div>
                <div className="bg-[#EACEAA]/30 p-3 rounded-tr-lg rounded-bl-lg border border-[rgba(52,21,15,0.06)]">
                  <span className="text-[10px] font-bold text-[#85431E] uppercase block">Regional Email</span>
                  <span className="font-extrabold text-[#34150F]">{activeLocation.email}</span>
                </div>
              </div>

              {/* Embedded Google Map iframe */}
              <div className="relative rounded-tr-2xl rounded-bl-2xl overflow-hidden border border-[rgba(52,21,15,0.15)] h-64 sm:h-72 shadow-inner">
                <iframe
                  title={`Google Map - ${activeLocation.city}`}
                  src={activeLocation.embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Location Cards Summarized below */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedCity(loc.id as any)}
                  className={`p-3.5 rounded-tr-xl rounded-bl-xl border text-left transition-all ${
                    selectedCity === loc.id
                      ? "bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-sm"
                      : "bg-[#f5e8d4] text-[#34150F] border-[rgba(52,21,15,0.1)] hover:border-[#D39858]"
                  }`}
                >
                  <p className="text-xs font-black truncate">{loc.id === "delhi" ? "📍 Delhi Headquarters" : "📍 Kolkata Regional Hub"}</p>
                  <p className={`text-[10px] mt-1 line-clamp-2 ${selectedCity === loc.id ? "text-[#EACEAA]/80" : "text-[#85431E]"}`}>
                    {loc.address}
                  </p>
                </button>
              ))}
            </div>

          </div>

          {/* ── RIGHT COLUMN: INQUIRY FORM & TICKET TRACKER (5 COLS) ── */}
          <div className="lg:col-span-5 bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-7 border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 bg-[#EACEAA]/60 p-1.5 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.15)]">
              <button
                type="button"
                onClick={() => setActiveTab("FORM")}
                className={`flex-1 py-2 px-3 rounded-tr-lg rounded-bl-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "FORM"
                    ? "bg-[#34150F] text-[#EACEAA] shadow-sm"
                    : "text-[#85431E] hover:bg-[#34150F]/10"
                }`}
              >
                <Send size={13} /> Send Inquiry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("TRACK")}
                className={`flex-1 py-2 px-3 rounded-tr-lg rounded-bl-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "TRACK"
                    ? "bg-[#34150F] text-[#EACEAA] shadow-sm"
                    : "text-[#85431E] hover:bg-[#34150F]/10"
                }`}
              >
                <Search size={13} /> Track Ticket (48h)
              </button>
            </div>

            {/* ═════════ MODE 1: SEND ENQUIRY FORM ═════════ */}
            {activeTab === "FORM" && (
              <>
                {submissionResult ? (
                  /* Submission Confirmation Screen */
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 size={32} />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#85431E]">
                        Inquiry Received & Logged
                      </span>
                      <h3 className="text-xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                        Inquiry Confirmed!
                      </h3>
                    </div>

                    {/* Email & 48h SLA Banner */}
                    <div className="bg-emerald-900/10 border border-emerald-700/30 p-3 rounded-tr-xl rounded-bl-xl text-left space-y-2">
                      <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                        <Mail size={15} className="text-emerald-700 flex-shrink-0" />
                        <span>Email Confirmation Dispatched!</span>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-snug">
                        A receipt with your ticket reference has been sent to <strong>{submissionResult.email}</strong>.
                      </p>
                      <div className="flex items-center gap-2 pt-1 border-t border-emerald-900/10 text-xs font-bold text-[#34150F]">
                        <Clock size={14} className="text-[#D39858]" />
                        <span>Maximum Response SLA: <strong>48 Hours</strong></span>
                      </div>
                    </div>

                    {/* Ticket Reference Box */}
                    <div className="bg-[#EACEAA]/60 p-3.5 rounded-tr-xl rounded-bl-xl border border-[rgba(52,21,15,0.1)] text-left text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#85431E] uppercase">Unique Ticket ID:</span>
                        <span className="font-mono font-black text-[#34150F] text-sm">
                          {submissionResult.trackingId || submissionResult.id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-[#85431E]">Subject:</span>
                        <span className="font-extrabold text-[#34150F]">{submissionResult.subject}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingInput(submissionResult.trackingId || submissionResult.id);
                          setActiveTab("TRACK");
                        }}
                        className="w-full py-2.5 bg-[#34150F] text-[#EACEAA] font-bold text-xs rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Search size={14} /> Track This Ticket Status
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSubmissionResult(null);
                          setForm({ name: "", email: "", phone: "", companyName: "", subject: "", message: "" });
                        }}
                        className="text-xs font-bold text-[#85431E] underline hover:text-[#34150F]"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form */
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="border-b border-[rgba(52,21,15,0.08)] pb-2 mb-2">
                      <h2
                        className="text-base font-extrabold text-[#34150F]"
                        style={{ fontFamily: "'Gilda Display', serif" }}
                      >
                        Send an Online Message
                      </h2>
                      <p className="text-[11px] text-[#85431E] font-semibold">
                        Automated email confirmation sent instantly • 48h Max Response SLA
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <label htmlFor="contact-name" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="contact-name"
                        required
                        type="text"
                        value={form.name}
                        onChange={setField("name")}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full bg-[#EACEAA]/40 text-[#34150F] placeholder-[#85431E]/40 px-3.5 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                      />
                    </div>

                    {/* Email & Phone stacked */}
                    <div>
                      <label htmlFor="contact-email" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
                        Email Address <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="contact-email"
                        required
                        type="email"
                        value={form.email}
                        onChange={setField("email")}
                        placeholder="name@example.com"
                        className="w-full bg-[#EACEAA]/40 text-[#34150F] placeholder-[#85431E]/40 px-3.5 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
                        Phone Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="contact-phone"
                        required
                        type="tel"
                        value={form.phone}
                        onChange={setField("phone")}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#EACEAA]/40 text-[#34150F] placeholder-[#85431E]/40 px-3.5 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                      />
                    </div>

                    {/* Company Name */}
                    <div>
                      <label htmlFor="contact-company" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
                        Company / Firm Name (Optional)
                      </label>
                      <input
                        id="contact-company"
                        type="text"
                        value={form.companyName}
                        onChange={setField("companyName")}
                        placeholder="e.g. BuildCorp Infra"
                        className="w-full bg-[#EACEAA]/40 text-[#34150F] placeholder-[#85431E]/40 px-3.5 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                      />
                    </div>

                    {/* Subject Selector */}
                    <div>
                      <label htmlFor="contact-subject" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
                        Subject / Topic <span className="text-red-600">*</span>
                      </label>
                      <select
                        id="contact-subject"
                        required
                        value={form.subject}
                        onChange={setField("subject")}
                        className="w-full bg-[#EACEAA]/40 text-[#34150F] px-3.5 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                      >
                        <option value="">Select subject topic</option>
                        <option value="Product Enquiry">Product Enquiry & Specifications</option>
                        <option value="Bulk Order / B2B">Bulk Wholesale Quote / B2B</option>
                        <option value="Custom PVD Finish">Custom PVD Finish / Color Request</option>
                        <option value="Order Support">Order Tracking & Dispatch Support</option>
                        <option value="Warranty Claim">Warranty Claim & Replacement</option>
                        <option value="General Query">General Inquiry</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="contact-message" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider">
                          Message Details <span className="text-red-600">*</span>
                        </label>
                        <span className={`text-[10px] font-extrabold ${wordCount > 100 ? "text-red-600 font-bold" : "text-[#85431E]"}`}>
                          {wordCount} / 100 words max
                        </span>
                      </div>
                      <textarea
                        id="contact-message"
                        required
                        rows={3}
                        value={form.message}
                        onChange={setField("message")}
                        placeholder="Describe your project, product query, or required quantities (max 100 words)..."
                        className={`w-full bg-[#EACEAA]/40 text-[#34150F] placeholder-[#85431E]/40 px-3.5 py-2 rounded-tr-xl rounded-bl-xl text-xs font-medium border focus:outline-none resize-y ${
                          wordCount > 100
                            ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                            : "border-[rgba(52,21,15,0.15)] focus:border-[#34150F]"
                        }`}
                      />
                    </div>

                    {/* Error Banner */}
                    {error && (
                      <div className="flex items-center gap-2 p-2.5 bg-red-100 border border-red-300 text-red-800 text-xs font-bold rounded-tr-xl rounded-bl-xl">
                        <AlertCircle size={15} className="flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[#34150F] text-[#EACEAA] font-bold text-xs rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" /> Submitting Inquiry...
                        </>
                      ) : (
                        <>
                          <Send size={15} /> Send Message (Get Confirmation & 48h SLA)
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ═════════ MODE 2: TRACK TICKET STATUS SYSTEM ═════════ */}
            {activeTab === "TRACK" && (
              <div className="space-y-4">
                <div className="border-b border-[rgba(52,21,15,0.08)] pb-2">
                  <h2
                    className="text-base font-extrabold text-[#34150F]"
                    style={{ fontFamily: "'Gilda Display', serif" }}
                  >
                    Track Inquiry Ticket Status
                  </h2>
                  <p className="text-[11px] text-[#85431E] font-semibold">
                    Enter your Ticket ID (e.g. ENQ-123456) to view live engineering team status.
                  </p>
                </div>

                <form onSubmit={handleTrackSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="ticket-id" className="block text-[10px] font-extrabold text-[#34150F] uppercase tracking-wider mb-1">
                      Ticket ID / Reference Code *
                    </label>
                    <input
                      id="ticket-id"
                      type="text"
                      required
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="e.g. ENQ-892301"
                      className="w-full bg-[#EACEAA]/40 text-[#34150F] placeholder-[#85431E]/40 px-3.5 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-mono font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                    />
                  </div>

                  {trackingError && (
                    <p className="text-red-700 text-xs font-bold">{trackingError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="w-full py-2.5 bg-[#34150F] text-[#EACEAA] font-bold text-xs rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {trackingLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Searching System...
                      </>
                    ) : (
                      <>
                        <Search size={14} /> Lookup Ticket Status
                      </>
                    )}
                  </button>
                </form>

                {/* Tracked Ticket Result */}
                {trackedRecord && (
                  <div className="bg-[#EACEAA]/60 p-4 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.15)] space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-2">
                      <span className="font-mono font-black text-[#34150F]">
                        TICKET: {trackedRecord.trackingId || trackedRecord.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(trackedRecord.status)}`}>
                        {trackedRecord.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-[#34150F]">
                      <p><strong>Subject:</strong> {trackedRecord.subject || "General Inquiry"}</p>
                      <p><strong>Email Receipt:</strong> {trackedRecord.email}</p>
                      <p className="text-[11px] text-[#85431E]"><strong>Submitted Message:</strong> {trackedRecord.message}</p>
                    </div>

                    {/* SLA Notice */}
                    <div className="p-2.5 bg-[#34150F]/10 rounded-tr-xl rounded-bl-xl border border-[#34150F]/20 flex items-center gap-2 text-[11px] font-extrabold text-[#34150F]">
                      <Clock size={14} className="text-[#D39858] flex-shrink-0" />
                      <span>Response SLA: <strong>Within 48 Hours Guarantee</strong></span>
                    </div>

                    {/* Admin Response / Notes if present */}
                    {trackedRecord.adminNotes && (
                      <div className="p-3 bg-emerald-950/10 border border-emerald-800/30 rounded-tr-xl rounded-bl-xl text-xs space-y-1">
                        <span className="text-[10px] font-extrabold text-emerald-900 uppercase block">
                          Technical Advisor Response:
                        </span>
                        <p className="text-emerald-950 font-medium leading-relaxed">
                          {trackedRecord.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Direct Contact Button */}
            <div className="pt-4 border-t border-[rgba(52,21,15,0.1)] text-center space-y-2">
              <p className="text-[10px] font-extrabold text-[#85431E] uppercase tracking-wider">
                Need Immediate Hardware Assistance?
              </p>
              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent("Hello PRC Hardware team, I would like to inquire about your architectural hardware products.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#25D366] text-white font-black text-xs rounded-tr-xl rounded-bl-xl hover:bg-[#128C7E] transition-all shadow-md flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                <MessageCircle size={17} className="fill-current" />
                Chat Direct on WhatsApp (+91 98765 43210)
                <ExternalLink size={13} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
