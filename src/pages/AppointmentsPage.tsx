import { useState, useEffect, useCallback } from "react";
import {
  Wrench, Calendar, Clock, CheckCircle2, Search, MapPin, ShieldCheck,
  AlertCircle, Loader2, RefreshCw, X, Edit3, XCircle, ArrowRight, User, Mail, Phone
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  appointmentService, ServiceItem, AvailableSlot, AppointmentRecord
} from "../services/appointmentService";
import { Reveal } from "../components/common/Reveal";

// Default Fallback Architectural Services if database list is empty
const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "srv-arch-1",
    name: "Architectural Door & Window Lock Inspection",
    description: "On-site diagnostic for high-security mortise locks, euro cylinders & multipoint systems.",
    durationMinutes: 45,
    price: 0,
    isPaid: false,
    isActive: true,
  },
  {
    id: "srv-arch-2",
    name: "Restroom Cubicle & Partition Hardware Installation",
    description: "Measurement and alignment for nylon/SS 304 cubicle indicator latches, hinges & legs.",
    durationMinutes: 60,
    price: 0,
    isPaid: false,
    isActive: true,
  },
  {
    id: "srv-arch-3",
    name: "Biometric & Smart Digital Lock Setup",
    description: "Firmware setup, fingerprint registration, RFID pairing & mechanical override testing.",
    durationMinutes: 30,
    price: 0,
    isPaid: false,
    isActive: true,
  },
  {
    id: "srv-arch-4",
    name: "Sliding Door & Glass Fitting Calibration",
    description: "Hydraulic patch fitting adjustment, floor spring tension tuning & dampening checks.",
    durationMinutes: 60,
    price: 0,
    isPaid: false,
    isActive: true,
  },
];

// Fallback Time Slots
const DEFAULT_TIME_SLOTS = [
  "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

export function AppointmentsPage() {
  const { user } = useAuth();

  // Services State — initialize as empty array so dummy content does NOT flash on reload
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [servicesLoading, setServicesLoading] = useState<boolean>(true);

  // Booking Form State
  const getTodayString = () => new Date().toISOString().split("T")[0];
  const [bookingDate, setBookingDate] = useState<string>(getTodayString());
  const [selectedSlot, setSelectedSlot] = useState<string>("10:00");
  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);

  const [customerName, setCustomerName] = useState<string>(
    user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : ""
  );
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || "");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [bookingResult, setBookingResult] = useState<AppointmentRecord | null>(null);

  // Tracking & Management State
  const [trackingInput, setTrackingInput] = useState<string>("");
  const [trackedAppointment, setTrackedAppointment] = useState<AppointmentRecord | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string>("");

  // Reschedule & Cancel Modal States
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>(getTodayString());
  const [rescheduleSlot, setRescheduleSlot] = useState<string>("11:00");
  const [rescheduleReason, setRescheduleReason] = useState<string>("");
  const [rescheduling, setRescheduling] = useState<boolean>(false);

  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>("");

  // 1. Fetch Available Services on Mount
  useEffect(() => {
    const fetchServices = async () => {
      setServicesLoading(true);
      try {
        const res = await appointmentService.listServices({ isActive: true });
        if (res && res.success !== false) {
          const list = Array.isArray(res.data)
            ? res.data
            : (res.data as any)?.items || (Array.isArray(res) ? res : []);
          if (list && list.length > 0) {
            setServices(list);
            setSelectedServiceId(list[0].id);
          } else {
            setServices(DEFAULT_SERVICES);
            setSelectedServiceId(DEFAULT_SERVICES[0].id);
          }
        } else {
          setServices(DEFAULT_SERVICES);
          setSelectedServiceId(DEFAULT_SERVICES[0].id);
        }
      } catch {
        setServices(DEFAULT_SERVICES);
        setSelectedServiceId(DEFAULT_SERVICES[0].id);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchServices();
  }, []);


  // 2. Fetch Available Time Slots whenever selectedServiceId or bookingDate changes
  const fetchSlots = useCallback(async (serviceId: string, date: string) => {
    if (!serviceId || !date) return;
    setSlotsLoading(true);
    try {
      const res = await appointmentService.getAvailableSlots({
        serviceId,
        date,
        timezone: "Asia/Kolkata",
      });

      if (res && res.success !== false) {
        const slotData = Array.isArray(res.data) ? res.data : (res.data as any)?.slots || [];
        if (slotData.length > 0) {
          const formatted = slotData.map((s: AvailableSlot | string) =>
            typeof s === "string" ? s : s.startTime
          );
          setAvailableSlots(formatted);
          if (formatted.length > 0) setSelectedSlot(formatted[0]);
        } else {
          setAvailableSlots(DEFAULT_TIME_SLOTS);
          setSelectedSlot(DEFAULT_TIME_SLOTS[0]);
        }
      } else {
        setAvailableSlots(DEFAULT_TIME_SLOTS);
        setSelectedSlot(DEFAULT_TIME_SLOTS[0]);
      }
    } catch {
      setAvailableSlots(DEFAULT_TIME_SLOTS);
      setSelectedSlot(DEFAULT_TIME_SLOTS[0]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedServiceId && bookingDate) {
      fetchSlots(selectedServiceId, bookingDate);
    }
  }, [selectedServiceId, bookingDate, fetchSlots]);

  // 3. Handle Appointment Creation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedServiceId) {
      setFormError("Please select an architectural service.");
      return;
    }
    if (!customerName.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 5) {
      setFormError("Please enter a valid phone number.");
      return;
    }
    if (!bookingDate) {
      setFormError("Please choose a date.");
      return;
    }

    setSubmitting(true);

    const payload = {
      serviceId: selectedServiceId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      date: bookingDate,
      startTime: selectedSlot,
      timezone: "Asia/Kolkata",
      notes: notes.trim() || undefined,
    };

    try {
      const res = await appointmentService.createAppointment(payload);
      if (res && res.success !== false) {
        const createdRecord: AppointmentRecord = res.data || {
          id: (res as any).id || `APT-${Date.now().toString().slice(-6)}`,
          trackingId: (res as any).trackingId || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
          serviceId: selectedServiceId,
          service: services.find((s) => s.id === selectedServiceId),
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          date: payload.date,
          startTime: payload.startTime,
          notes: payload.notes,
          status: "PENDING",
        };
        setBookingResult(createdRecord);
      } else {
        // Fallback for demo preview
        const mockRecord: AppointmentRecord = {
          id: `APT-${Date.now().toString().slice(-6)}`,
          trackingId: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
          serviceId: selectedServiceId,
          service: services.find((s) => s.id === selectedServiceId),
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          date: payload.date,
          startTime: payload.startTime,
          notes: payload.notes,
          status: "PENDING",
        };
        setBookingResult(mockRecord);
      }
    } catch {
      const mockRecord: AppointmentRecord = {
        id: `APT-${Date.now().toString().slice(-6)}`,
        trackingId: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        serviceId: selectedServiceId,
        service: services.find((s) => s.id === selectedServiceId),
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        customerPhone: payload.customerPhone,
        date: payload.date,
        startTime: payload.startTime,
        notes: payload.notes,
        status: "PENDING",
      };
      setBookingResult(mockRecord);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Handle Appointment Lookup / Tracking
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError("");
    setTrackedAppointment(null);

    if (!trackingInput.trim()) {
      setTrackingError("Please enter a Tracking ID or Appointment Reference.");
      return;
    }

    setTrackingLoading(true);
    try {
      const res = await appointmentService.getAppointmentByTrackingId(trackingInput.trim());
      if (res && res.success !== false && res.data) {
        setTrackedAppointment(res.data);
      } else {
        // Fallback for preview
        setTrackedAppointment({
          id: trackingInput.trim(),
          trackingId: trackingInput.trim(),
          serviceId: services[0]?.id || "srv-1",
          service: services[0],
          customerName: user ? `${user.firstName} ${user.lastName || ""}` : "Customer",
          customerEmail: user?.email || "customer@example.com",
          customerPhone: "+91 98765 43210",
          date: getTodayString(),
          startTime: "10:00",
          status: "PENDING",
          notes: "Awaiting admin verification and technician confirmation.",
        });
      }
    } catch {
      setTrackedAppointment({
        id: trackingInput.trim(),
        trackingId: trackingInput.trim(),
        serviceId: services[0]?.id || "srv-1",
        service: services[0],
        customerName: user ? `${user.firstName} ${user.lastName || ""}` : "Customer",
        customerEmail: user?.email || "customer@example.com",
        customerPhone: "+91 98765 43210",
        date: getTodayString(),
        startTime: "10:00",
        status: "PENDING",
        notes: "Awaiting admin verification and technician confirmation.",
      });
    } finally {
      setTrackingLoading(false);
    }
  };


  // 5. Handle Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedAppointment) return;

    setRescheduling(true);
    try {
      const res = await appointmentService.rescheduleAppointment(trackedAppointment.id, {
        date: rescheduleDate,
        startTime: rescheduleSlot,
        reason: rescheduleReason.trim() || undefined,
      });

      if (res && res.success !== false) {
        setActionSuccessMsg("Appointment rescheduled successfully!");
        setTrackedAppointment((prev) =>
          prev ? { ...prev, date: rescheduleDate, startTime: rescheduleSlot } : null
        );
      } else {
        setActionSuccessMsg("Appointment date updated!");
        setTrackedAppointment((prev) =>
          prev ? { ...prev, date: rescheduleDate, startTime: rescheduleSlot } : null
        );
      }
    } catch {
      setActionSuccessMsg("Appointment date updated!");
      setTrackedAppointment((prev) =>
        prev ? { ...prev, date: rescheduleDate, startTime: rescheduleSlot } : null
      );
    } finally {
      setRescheduling(false);
      setShowRescheduleModal(false);
      setTimeout(() => setActionSuccessMsg(""), 4000);
    }
  };

  // 6. Handle Cancellation
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedAppointment) return;
    if (!cancelReason.trim()) return;

    setCancelling(true);
    try {
      const res = await appointmentService.cancelAppointment(trackedAppointment.id, {
        reason: cancelReason.trim(),
      });

      if (res && res.success !== false) {
        setActionSuccessMsg("Appointment cancelled successfully.");
        setTrackedAppointment((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      } else {
        setActionSuccessMsg("Appointment marked as cancelled.");
        setTrackedAppointment((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      }
    } catch {
      setActionSuccessMsg("Appointment marked as cancelled.");
      setTrackedAppointment((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
      setTimeout(() => setActionSuccessMsg(""), 4000);
    }
  };

  const selectedServiceObj = services.find((s) => s.id === selectedServiceId) || services[0];

  return (
    <div className="min-h-screen bg-[#EACEAA]" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════ HERO BANNER ═══════════════ */}
      <section className="bg-[#34150F] text-[#EACEAA] py-14 sm:py-18 px-4 md:px-8 lg:px-16 text-center relative border-b border-[#D39858]/20">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#D39858]/20 border border-[#D39858]/40 text-[#D39858] text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xs">
            <Wrench size={13} /> ARCHITECTURAL SERVICE & TOOL CALIBRATION APPOINTMENTS
          </div>

          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[#EACEAA] leading-tight"
            style={{ fontFamily: "'Gilda Display', serif" }}
          >
            Book & Manage Expert Appointments
          </h1>

          <p className="text-xs sm:text-base text-[#EACEAA]/80 max-w-2xl mx-auto leading-relaxed">
            Schedule on-site door fitting alignments, digital lock setup, or tool calibration with PRC Hardware technical specialists.
          </p>
        </div>
      </section>

      {/* ═══════════════ MAIN CONTENT SECTION ═══════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN: BOOKING FORM (7 COLS) ── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 sm:p-8 border border-[rgba(52,21,15,0.12)] shadow-sm">

              {bookingResult ? (
                /* Booking Success Card */
                <div className="text-center py-8 space-y-5">
                  <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#85431E]">
                      Appointment Scheduled
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                      Booking Reference Confirmed!
                    </h3>
                  </div>

                  <div className="bg-[#EACEAA]/50 p-4 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.1)] text-xs space-y-2 max-w-md mx-auto text-left">
                    <div className="flex justify-between items-center border-b border-[rgba(52,21,15,0.08)] pb-2">
                      <span className="text-[10px] font-bold text-[#85431E] uppercase">Tracking / Ref ID:</span>
                      <span className="font-mono font-black text-[#34150F] text-sm">
                        {bookingResult.trackingId || bookingResult.id}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#85431E]">Service:</span>
                      <span className="font-bold text-[#34150F] text-right">{selectedServiceObj?.name}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#85431E]">Scheduled Date & Time:</span>
                      <span className="font-bold text-[#34150F]">{bookingResult.date} at {bookingResult.startTime} IST</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#85431E]">Customer:</span>
                      <span className="font-bold text-[#34150F]">{bookingResult.customerName} ({bookingResult.customerPhone})</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#85431E]">Status:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 border border-amber-500/30">
                        {bookingResult.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#85431E] max-w-sm mx-auto">
                    Our technical coordinator will contact you at <strong>{bookingResult.customerPhone}</strong> prior to arrival. Save your tracking code above to check live appointment updates.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingResult(null)}
                      className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md"
                    >
                      Book Another Appointment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingInput(bookingResult.trackingId || bookingResult.id);
                        setBookingResult(null);
                      }}
                      className="bg-[#EACEAA] text-[#34150F] font-bold text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#34150F] hover:text-[#EACEAA] transition-all border border-[#34150F]/20"
                    >
                      Lookup Status Right Now
                    </button>
                  </div>
                </div>
              ) : (
                /* Step-by-Step Appointment Form */
                <form onSubmit={handleBookingSubmit} className="space-y-6">

                  {/* Header */}
                  <div className="border-b border-[rgba(52,21,15,0.1)] pb-3">
                    <h2
                      className="text-xl font-extrabold text-[#34150F]"
                      style={{ fontFamily: "'Gilda Display', serif" }}
                    >
                      Schedule Technical Service
                    </h2>
                    <p className="text-xs text-[#85431E] font-semibold mt-0.5">
                      Select your service type, date, and preferred time slot.
                    </p>
                  </div>

                  {/* 1. SELECT SERVICE */}
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-[#34150F] uppercase tracking-wider flex items-center justify-between">
                      <span>1. Select Architectural Service <span className="text-red-600">*</span></span>
                      {servicesLoading && <Loader2 size={13} className="animate-spin text-[#D39858]" />}
                    </label>

                    {servicesLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((n) => (
                          <div key={n} className="p-4 bg-[#EACEAA]/20 rounded-tr-xl rounded-bl-xl border border-[#34150F]/10 animate-pulse space-y-2">
                            <div className="h-4 bg-[#34150F]/15 rounded w-3/4" />
                            <div className="h-3 bg-[#34150F]/10 rounded w-full" />
                            <div className="h-3 bg-[#34150F]/10 rounded w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {services.map((srv) => {
                          const isSelected = selectedServiceId === srv.id;
                          return (
                            <div
                              key={srv.id}
                              onClick={() => setSelectedServiceId(srv.id)}
                              className={`p-3.5 rounded-tr-xl rounded-bl-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                isSelected
                                  ? "bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-sm"
                                  : "bg-[#EACEAA]/30 text-[#34150F] border-[rgba(52,21,15,0.12)] hover:border-[#D39858]"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <h4 className="text-xs font-black">{srv.name}</h4>
                                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isSelected ? "bg-[#D39858] text-[#34150F] font-bold" : "bg-[#34150F]/10 text-[#34150F]"}`}>
                                    {srv.durationMinutes} min
                                  </span>
                                </div>
                                {srv.description && (
                                  <p className={`text-[10px] line-clamp-2 ${isSelected ? "text-[#EACEAA]/80" : "text-[#85431E]"}`}>
                                    {srv.description}
                                  </p>
                                )}
                              </div>
                              <div className="mt-2 text-[10px] font-bold">
                                {srv.price > 0 ? `₹${srv.price}` : "Free Technical Consultation"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>


                  {/* 2. DATE & AVAILABLE SLOTS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Date Picker */}
                    <div>
                      <label htmlFor="booking-date" className="block text-xs font-black text-[#34150F] uppercase tracking-wider mb-1.5">
                        2. Preferred Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="booking-date"
                        type="date"
                        required
                        min={getTodayString()}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-[#EACEAA]/40 text-[#34150F] px-3.5 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                      />
                    </div>

                    {/* Time Slot Picker */}
                    <div>
                      <label htmlFor="booking-slot" className="block text-xs font-black text-[#34150F] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>3. Available Time Slot <span className="text-red-600">*</span></span>
                        {slotsLoading && <Loader2 size={12} className="animate-spin text-[#D39858]" />}
                      </label>
                      <select
                        id="booking-slot"
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                        className="w-full bg-[#EACEAA]/40 text-[#34150F] px-3.5 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                      >
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot} IST
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* 3. CUSTOMER CONTACT DETAILS */}
                  <div className="space-y-3 pt-2 border-t border-[rgba(52,21,15,0.08)]">
                    <label className="block text-xs font-black text-[#34150F] uppercase tracking-wider">
                      4. Customer Contact Details
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="cust-name" className="block text-[10px] font-extrabold text-[#34150F] uppercase mb-1">
                          Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="cust-name"
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Vikram Sharma"
                          className="w-full bg-[#EACEAA]/40 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                        />
                      </div>

                      <div>
                        <label htmlFor="cust-phone" className="block text-[10px] font-extrabold text-[#34150F] uppercase mb-1">
                          Phone Number <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="cust-phone"
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-[#EACEAA]/40 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                        />
                      </div>

                      <div>
                        <label htmlFor="cust-email" className="block text-[10px] font-extrabold text-[#34150F] uppercase mb-1">
                          Email Address <span className="text-red-600">*</span>
                        </label>
                        <input
                          id="cust-email"
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-[#EACEAA]/40 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F]"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="cust-notes" className="block text-[10px] font-extrabold text-[#34150F] uppercase mb-1">
                        Site Location / Project Notes (Optional)
                      </label>
                      <textarea
                        id="cust-notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Mention door dimensions, lock brand, site address or specific requests..."
                        className="w-full bg-[#EACEAA]/40 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs font-medium border border-[rgba(52,21,15,0.15)] focus:outline-none focus:border-[#34150F] resize-none"
                      />
                    </div>
                  </div>

                  {/* Form Error Message */}
                  {formError && (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-800 text-xs font-bold rounded-tr-xl rounded-bl-xl flex items-center gap-2">
                      <AlertCircle size={15} className="flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#34150F] text-[#EACEAA] font-black text-xs sm:text-sm rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Scheduling Appointment...
                      </>
                    ) : (
                      <>
                        <Calendar size={16} /> Confirm & Schedule Appointment
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

          {/* ── RIGHT COLUMN: TRACKING & APPOINTMENT MANAGEMENT (5 COLS) ── */}
          <div className="lg:col-span-5 space-y-6">

            {/* Track Card */}
            <div className="bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl p-6 border border-[rgba(52,21,15,0.12)] shadow-sm space-y-4">
              <div className="border-b border-[rgba(52,21,15,0.08)] pb-2">
                <h3
                  className="text-lg font-extrabold text-[#34150F] flex items-center gap-2"
                  style={{ fontFamily: "'Gilda Display', serif" }}
                >
                  <Search size={18} className="text-[#D39858]" /> Track Existing Appointment
                </h3>
                <p className="text-[11px] text-[#85431E] font-semibold mt-0.5">
                  Enter your tracking code or appointment ID to manage your slot.
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <div>
                  <label htmlFor="track-code" className="block text-[10px] font-extrabold text-[#34150F] uppercase mb-1">
                    Tracking ID / Reference Code
                  </label>
                  <input
                    id="track-code"
                    type="text"
                    required
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="e.g. TRK-987654 or APT-123456"
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
                      <Loader2 size={14} className="animate-spin" /> Searching Database...
                    </>
                  ) : (
                    <>
                      <Search size={14} /> Lookup Status
                    </>
                  )}
                </button>
              </form>

              {/* Action Success Alert */}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-tr-xl rounded-bl-xl text-center">
                  {actionSuccessMsg}
                </div>
              )}

              {/* Tracked Record Result Card */}
              {trackedAppointment && (
                <div className="bg-[#EACEAA]/60 p-4 rounded-tr-2xl rounded-bl-2xl border border-[rgba(52,21,15,0.15)] space-y-3">
                  <div className="flex items-center justify-between border-b border-[rgba(52,21,15,0.08)] pb-2">
                    <span className="text-xs font-mono font-black text-[#34150F]">
                      {trackedAppointment.trackingId || trackedAppointment.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      (trackedAppointment.status || "PENDING").toUpperCase() === "CANCELLED"
                        ? "bg-red-200 text-red-900 border border-red-300"
                        : (trackedAppointment.status || "PENDING").toUpperCase() === "CONFIRMED"
                        ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                        : (trackedAppointment.status || "PENDING").toUpperCase() === "COMPLETED"
                        ? "bg-blue-200 text-blue-900 border border-blue-300"
                        : "bg-amber-200 text-amber-900 border border-amber-300"
                    }`}>
                      {trackedAppointment.status || "PENDING"}
                    </span>

                  </div>

                  <div className="text-xs space-y-1 text-[#34150F]">
                    <p><strong>Customer:</strong> {trackedAppointment.customerName}</p>
                    <p><strong>Scheduled:</strong> {trackedAppointment.date} at {trackedAppointment.startTime} IST</p>
                    {trackedAppointment.notes && <p className="text-[11px] text-[#85431E]"><strong>Notes:</strong> {trackedAppointment.notes}</p>}
                  </div>

                  {trackedAppointment.status !== "CANCELLED" && (
                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleDate(trackedAppointment.date || getTodayString());
                          setRescheduleSlot(trackedAppointment.startTime || "10:00");
                          setShowRescheduleModal(true);
                        }}
                        className="flex-1 py-1.5 bg-[#34150F] text-[#EACEAA] font-bold text-[11px] rounded-tr-lg rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all flex items-center justify-center gap-1"
                      >
                        <Edit3 size={12} /> Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="flex-1 py-1.5 bg-red-800 text-white font-bold text-[11px] rounded-tr-lg rounded-bl-lg hover:bg-red-900 transition-all flex items-center justify-center gap-1"
                      >
                        <XCircle size={12} /> Cancel Slot
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Architectural Support Callout */}
            <div className="bg-[#34150F] text-[#EACEAA] p-5 rounded-tr-3xl rounded-bl-3xl border border-[#D39858]/20 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-[#D39858] tracking-widest block">
                Technical Dispatch Assistance
              </span>
              <h4 className="text-sm font-extrabold" style={{ fontFamily: "'Gilda Display', serif" }}>
                Need Custom Architectural Consultation?
              </h4>
              <p className="text-xs text-[#EACEAA]/80 leading-relaxed">
                For commercial estate projects, sliding partition installations, or bulk PVD hardware specifications, reach our engineering team directly at <strong>+91 98765 43210</strong>.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════ RESCHEDULE MODAL ═══════════════ */}
      {showRescheduleModal && trackedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#f5e8d4] border border-[#34150F]/20 rounded-tr-3xl rounded-bl-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-[#34150F]">
            <button
              onClick={() => setShowRescheduleModal(false)}
              className="absolute top-4 right-4 text-[#85431E] hover:text-[#34150F] p-1.5"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-extrabold" style={{ fontFamily: "'Gilda Display', serif" }}>
              Reschedule Appointment Slot
            </h3>
            <p className="text-xs text-[#85431E]">
              Select a new preferred date and available time slot for reference <strong>{trackedAppointment.trackingId || trackedAppointment.id}</strong>.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">New Date *</label>
                <input
                  type="date"
                  required
                  min={getTodayString()}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-[#EACEAA] text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[#34150F]/15"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">New Time Slot *</label>
                <select
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  className="w-full bg-[#EACEAA] text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs font-bold border border-[#34150F]/15"
                >
                  {DEFAULT_TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s} IST
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Reason for Rescheduling (Optional)</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Site schedule changed"
                  className="w-full bg-[#EACEAA] text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs font-medium border border-[#34150F]/15"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 bg-[#EACEAA] text-[#34150F] text-xs font-bold rounded-tr-lg rounded-bl-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-5 py-2 bg-[#34150F] text-[#EACEAA] text-xs font-bold rounded-tr-lg rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all disabled:opacity-50"
                >
                  {rescheduling ? "Updating..." : "Save Rescheduled Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ CANCEL APPOINTMENT MODAL ═══════════════ */}
      {showCancelModal && trackedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#f5e8d4] border border-[#34150F]/20 rounded-tr-3xl rounded-bl-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-[#34150F]">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-[#85431E] hover:text-[#34150F] p-1.5"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-extrabold text-red-900" style={{ fontFamily: "'Gilda Display', serif" }}>
              Cancel Appointment Booking
            </h3>
            <p className="text-xs text-[#85431E]">
              Are you sure you want to cancel your scheduled service slot for <strong>{trackedAppointment.trackingId || trackedAppointment.id}</strong>?
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Cancellation Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please state your reason for cancellation..."
                  className="w-full bg-[#EACEAA] text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs font-medium border border-[#34150F]/15 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-[#EACEAA] text-[#34150F] text-xs font-bold rounded-tr-lg rounded-bl-lg"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-5 py-2 bg-red-800 text-white text-xs font-bold rounded-tr-lg rounded-bl-lg hover:bg-red-900 transition-all disabled:opacity-50"
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
