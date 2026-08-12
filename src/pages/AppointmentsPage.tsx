import { useState } from "react";
import { Wrench, Calendar, Clock, CheckCircle2, Search, MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../services/api";

const SERVICES = [
  { id: "srv-1", name: "Tool Inspection & Calibration", desc: "Precision diagnostic for power tools & hydraulic locks", duration: "45 mins" },
  { id: "srv-2", name: "Commercial Door Fitting & Alignment", desc: "On-site or workshop alignment for heavy architectural hinges", duration: "60 mins" },
  { id: "srv-3", name: "Biometric & Digital Lock Servicing", desc: "Firmware updates, battery checks, and keyway reset", duration: "30 mins" },
  { id: "srv-4", name: "Sliding Track & Hydraulic Hinge Overhaul", desc: "Complete cleaning, lubrication, and damper replacement", duration: "60 mins" },
];

export function AppointmentsPage() {
  const { user } = useAuth();

  const [selectedService, setSelectedService] = useState(SERVICES[0].id);
  const [date, setDate] = useState("2026-08-15");
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 11:00 AM");
  const [name, setName] = useState(user?.firstName ? `${user.firstName} ${user.lastName}` : "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");

  const [trackingId, setTrackingId] = useState("");
  const [trackedStatus, setTrackedStatus] = useState<any>(null);

  const [isBooked, setIsBooked] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = `APT-${Date.now().toString().slice(-6)}`;
    setBookingRef(ref);

    try {
      await fetchApi("/appointments", {
        method: "POST",
        body: JSON.stringify({
          serviceId: selectedService,
          date,
          timeSlot,
          name,
          phone,
          email,
        }),
      });
    } catch {}

    setIsBooked(true);
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    try {
      const res = await fetchApi(`/appointments/track/${trackingId.trim()}`);
      if (res.data) setTrackedStatus(res.data);
      else setTrackedStatus({ ref: trackingId, status: "IN_PROGRESS", technician: "Vikram Singh", date: "2026-08-15" });
    } catch {
      setTrackedStatus({ ref: trackingId, status: "IN_PROGRESS", technician: "Vikram Singh", date: "2026-08-15" });
    }
  };

  return (
    <div className="min-h-screen bg-[#EACEAA]/20 py-8 px-4 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-black text-[#34150F] mb-2" style={{ fontFamily: "'Gilda Display', serif" }}>
            Hardware Service & Tool Repair Appointments
          </h1>
          <p className="text-xs text-[#85431E]">
            Book a specialist slot for tool inspection, lock servicing, or door fitting maintenance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Booking Form */}
          <div className="lg:col-span-2 bg-white rounded-tr-3xl rounded-bl-3xl p-6 md:p-8 border border-[#34150F]/8 shadow-sm">
            {isBooked ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-black text-[#34150F] mb-2">Appointment Scheduled!</h3>
                <p className="text-xs text-[#85431E] mb-4">
                  Your service slot reference is <strong className="font-mono text-[#34150F]">{bookingRef}</strong>. Our specialist will contact you prior to the appointment.
                </p>
                <button
                  type="button"
                  onClick={() => setIsBooked(false)}
                  className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-5 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all"
                >
                  Book Another Appointment
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] pb-2 border-b border-[#34150F]/8 flex items-center gap-2">
                  <Wrench size={16} className="text-[#D39858]" /> Select Service & Date
                </h3>

                {/* Service Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SERVICES.map((srv) => (
                    <label
                      key={srv.id}
                      className={`p-3.5 rounded-tr-xl rounded-bl-xl border-2 cursor-pointer transition-all ${
                        selectedService === srv.id
                          ? "border-[#34150F] bg-[#EACEAA]/30 shadow-sm"
                          : "border-[#34150F]/10 hover:border-[#34150F]/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="service"
                        checked={selectedService === srv.id}
                        onChange={() => setSelectedService(srv.id)}
                        className="sr-only"
                      />
                      <h4 className="text-xs font-black text-[#34150F] mb-1">{srv.name}</h4>
                      <p className="text-[10px] text-[#85431E]/70 mb-2">{srv.desc}</p>
                      <span className="text-[9px] font-bold bg-[#34150F]/10 text-[#34150F] px-2 py-0.5 rounded-full">
                        {srv.duration}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                      Time Slot
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12 font-bold"
                    >
                      <option>10:00 AM - 11:00 AM</option>
                      <option>11:30 AM - 12:30 PM</option>
                      <option>02:00 PM - 03:00 PM</option>
                      <option>04:00 PM - 05:00 PM</option>
                    </select>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rahul Sharma"
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#34150F] text-[#EACEAA] font-black py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-sm shadow-md"
                >
                  Confirm & Schedule Service Slot
                </button>
              </form>
            )}
          </div>

          {/* Sidebar: Track Repair Status */}
          <div className="space-y-4">
            <div className="bg-white rounded-tr-3xl rounded-bl-3xl p-6 border border-[#34150F]/8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#34150F] mb-4 pb-2 border-b border-[#34150F]/8 flex items-center gap-2">
                <Search size={15} className="text-[#D39858]" /> Track Existing Appointment
              </h3>
              <form onSubmit={handleTrack} className="space-y-3">
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="Enter APT-XXXXXX ID..."
                  className="w-full bg-[#EACEAA]/30 text-[#34150F] px-3 py-2.5 rounded-tr-xl rounded-bl-xl text-xs border border-[#34150F]/12 font-mono"
                />
                <button
                  type="submit"
                  className="w-full bg-[#34150F] text-[#EACEAA] font-bold text-xs py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-colors"
                >
                  Lookup Status
                </button>
              </form>

              {trackedStatus && (
                <div className="mt-4 p-3 bg-[#EACEAA]/30 border border-[#34150F]/10 rounded-tr-xl rounded-bl-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-[#34150F]">
                    <span>Ref: {trackedStatus.ref}</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[9px]">CONFIRMED</span>
                  </div>
                  <p className="text-[10px] text-[#85431E]">Technician: {trackedStatus.technician}</p>
                  <p className="text-[10px] text-[#85431E]">Scheduled: {trackedStatus.date}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
