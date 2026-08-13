import { fetchApi } from "./api";

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes?: number;
  maxParallelBookings?: number;
  price: number;
  isPaid?: boolean;
  isActive?: boolean;
}

export interface AvailableSlot {
  startTime: string; // e.g. "10:00"
  endTime?: string;   // e.g. "10:30"
  isAvailable?: boolean;
}

export interface CreateAppointmentPayload {
  serviceId: string;
  locationId?: string;
  staffUserId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "10:00")
  timezone?: string;
  customFields?: Record<string, any>;
  notes?: string;
}

export interface RescheduleAppointmentPayload {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  reason?: string;
}

export interface CancelAppointmentPayload {
  reason: string;
}

export interface AppointmentRecord {
  id: string;
  trackingId?: string;
  serviceId: string;
  service?: ServiceItem;
  locationId?: string;
  staffUserId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime?: string;
  timezone?: string;
  notes?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt?: string;
}

export const appointmentService = {
  // List Public Services
  listServices: async (query?: { isActive?: boolean; search?: string }) => {
    const params = new URLSearchParams();
    if (query?.isActive !== undefined) params.append("isActive", String(query.isActive));
    if (query?.search) params.append("search", query.search);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return fetchApi<ServiceItem[]>(`/appointments/services${queryString}`, { method: "GET" });
  },

  // Get Available Time Slots for Service & Date
  getAvailableSlots: async (query: {
    serviceId: string;
    date: string;
    staffUserId?: string;
    locationId?: string;
    timezone?: string;
  }) => {
    const params = new URLSearchParams();
    params.append("serviceId", query.serviceId);
    params.append("date", query.date);
    if (query.staffUserId) params.append("staffUserId", query.staffUserId);
    if (query.locationId) params.append("locationId", query.locationId);
    if (query.timezone) params.append("timezone", query.timezone);
    return fetchApi<AvailableSlot[]>(`/appointments/available-slots?${params.toString()}`, {
      method: "GET",
    });
  },

  // Create New Appointment Booking
  createAppointment: async (payload: CreateAppointmentPayload) => {
    return fetchApi<AppointmentRecord>("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Get Appointment by Tracking ID
  getAppointmentByTrackingId: async (trackingId: string) => {
    return fetchApi<AppointmentRecord>(`/appointments/track/${encodeURIComponent(trackingId)}`, {
      method: "GET",
    });
  },

  // Get Appointment by ID
  getAppointmentById: async (id: string) => {
    return fetchApi<AppointmentRecord>(`/appointments/${id}`, { method: "GET" });
  },

  // Reschedule Appointment
  rescheduleAppointment: async (id: string, payload: RescheduleAppointmentPayload) => {
    return fetchApi<AppointmentRecord>(`/appointments/${id}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // Cancel Appointment
  cancelAppointment: async (id: string, payload: CancelAppointmentPayload) => {
    return fetchApi<AppointmentRecord>(`/appointments/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
