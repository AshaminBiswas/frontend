import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  User, Mail, Phone, Building2, FileText, Shield,
  Edit3, Save, X, LogOut, ChevronRight, Package,
  Heart, Bell, Star, CheckCircle2, AlertCircle,
  Lock, Eye, EyeOff, ArrowLeft, MapPin, Plus, Trash2,
  ShoppingCart, Minus, Truck, Download, Receipt, ExternalLink,
  FileSpreadsheet, Upload, Search, LocateFixed, Navigation,
  MessageSquare, Pencil, Check, Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { fetchApi, API_BASE_URL } from "../../services/api";
import { CartItem, Product } from "../../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../../data/products";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { B2BQuotationManager } from "../b2b/B2BQuotationManager";
import { isB2BUser, getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";
import { validateGstin, validatePhoneNumber } from "../../utils/validation";
import { proformaInvoiceService, ProformaInvoiceDetail } from "../../services/proformaInvoiceService";

import { AsyncActionButton } from "../common/AsyncActionButton";

// Safe helper functions for PO downloads & cancellation
const deletePurchaseOrderApi = async (id: string) => {
  return fetchApi(`/purchase-orders/${id}`, { method: 'DELETE' });
};
const downloadPackingListPdf = async (id: string, _poNumber?: string) => {
  window.open(`${API_BASE_URL}/purchase-orders/${id}/packing-list/pdf`, '_blank');
};
const downloadPoInvoicePdf = async (id: string, _invoiceNumber?: string) => {
  window.open(`${API_BASE_URL}/purchase-orders/${id}/invoice/pdf`, '_blank');
};

type CustomerPurchaseOrder = any;

const ALL_PRODUCTS: Product[] = [...SUPER_SAVER_PRODUCTS, ...VALUE_MONEY_PRODUCTS, ...BEST_SELLER_PRODUCTS];

interface UserProfilePageProps {
  onClose: () => void;
  cart: CartItem[];
  onRemoveFromCart: (id: number) => void;
  onChangeQty: (id: number, delta: number) => void;
  wishlist: Set<number>;
  onToggleWishlist: (id: number) => void;
  onAddToCart: (product: Product) => void;
}

type ProfileTab = "overview" | "edit" | "quotes" | "po" | "proforma" | "security" | "orders" | "addresses" | "cart" | "wishlist" | "notifications" | "reviews";

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  postalCode?: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  altPhone?: string | null;
  hasWhatsapp?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-100 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-100 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export function UserProfilePage({
  onClose,
  cart,
  onRemoveFromCart,
  onChangeQty,
  wishlist,
  onToggleWishlist,
  onAddToCart,
}: UserProfilePageProps) {
  const { user, logout, updateUser } = useAuth();
  const b2bCache = useB2BPricing();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isB2B = isB2BUser(user);

  const tabParam = searchParams.get("tab") as ProfileTab | null;
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    if (tabParam && ["overview", "edit", "quotes", "po", "proforma", "orders", "addresses", "cart", "wishlist", "notifications", "reviews", "security"].includes(tabParam)) {
      return tabParam;
    }
    return "overview";
  });

  useEffect(() => {
    if (tabParam && ["overview", "edit", "quotes", "po", "proforma", "orders", "addresses", "cart", "wishlist", "notifications", "reviews", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  /* ── Edit Profile ── */
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [gstin, setGstin] = useState(user?.gstin || "");
  // accountType: "b2b" if user already has business info, else "b2c"
  const [accountType, setAccountType] = useState<"b2c" | "b2b">(
    user?.companyName || user?.gstin ? "b2b" : "b2c"
  );

  /* ── Security ── */
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  /* ── Orders & Purchase Orders ── */
  const [orders, setOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<CustomerPurchaseOrder[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<"ALL" | "RETAIL">("ALL");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [poSearchQuery, setPoSearchQuery] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState<string>("ALL");

  /* ── B2B Proforma Invoices (PI) ── */
  const [proformaInvoices, setProformaInvoices] = useState<ProformaInvoiceDetail[]>([]);
  const [proformaLoading, setProformaLoading] = useState(false);
  const [proformaSearch, setProformaSearch] = useState("");
  const [proformaStatusFilter, setProformaStatusFilter] = useState<string>("ALL");

  /* ── Notifications ── */
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  /* ── My Reviews ── */
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  /* ── Addresses ── */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrEmail, setAddrEmail] = useState("");
  const [addrAltPhone, setAddrAltPhone] = useState("");
  const [addrHasWhatsapp, setAddrHasWhatsapp] = useState(false);
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrLat, setAddrLat] = useState<number | null>(null);
  const [addrLng, setAddrLng] = useState<number | null>(null);

  // Location search & Geolocation state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Sync fields on user change
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setCompanyName(user.companyName || "");
      setGstin(user.gstin || "");
      setAccountType(user.companyName || user.gstin ? "b2b" : "b2c");
    }
  }, [user]);

  // Fetch standard orders & purchase orders when tab selected
  useEffect(() => {
    if (activeTab !== "orders" && activeTab !== "po") return;
    setOrdersLoading(true);

    const userEmail = user?.email || "";

    Promise.all([
      fetchApi("/orders/my").then((res) => {
        if (res.success && Array.isArray(res.data)) return res.data;
        if (res.success && res.data?.orders) return res.data.orders;
        return [];
      }).catch(() => []),
      fetchApi<any>(`/po-management/my-pos?email=${encodeURIComponent(userEmail)}`).then((res) => {
        if (res.success && Array.isArray(res.data?.items)) return res.data.items;
        if (res.success && Array.isArray(res.data)) return res.data;
        return [];
      }).catch(() => []),
      fetchApi<any>("/purchase-orders/my").then((res) => {
        if (res.success && Array.isArray(res.data)) return res.data;
        if (res.success && Array.isArray(res.data?.items)) return res.data.items;
        return [];
      }).catch(() => []),
    ]).then(([fetchedOrders, fetchedPoSubmissions, legacyPos]) => {
      setOrders(fetchedOrders);
      const combined = [...fetchedPoSubmissions, ...legacyPos];
      const uniquePos = Array.from(new Map(combined.map((item) => [item.poSubmissionId || item.id, item])).values());
      setPurchaseOrders(uniquePos);
    }).finally(() => {
      setOrdersLoading(false);
    });
  }, [activeTab, user?.email]);

  // Fetch B2B Proforma Invoices when B2B customer visits profile or selects proforma tab
  useEffect(() => {
    if (!isB2B) return;
    if (activeTab !== "proforma" && activeTab !== "overview") return;
    setProformaLoading(true);
    proformaInvoiceService.getMyCustomerProformas()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setProformaInvoices(res.data);
        } else {
          setProformaInvoices([]);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch customer proforma invoices:", err);
        setProformaInvoices([]);
      })
      .finally(() => setProformaLoading(false));
  }, [activeTab, isB2B, user?.email]);

  // Fetch addresses when tab selected
  useEffect(() => {
    if (activeTab !== "addresses") return;
    setAddrLoading(true);
    fetchApi("/users/addresses")
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setAddresses(res.data);
        else setAddresses([]);
      })
      .catch(() => setAddresses([]))
      .finally(() => setAddrLoading(false));
  }, [activeTab]);

  const clearFeedback = () => { setSuccessMsg(""); setErrorMsg(""); };

  const switchTab = (tab: ProfileTab) => {
    if (tab === "cart") {
      onClose();
      navigate("/cart");
      return;
    }
    if (tab === "wishlist") {
      onClose();
      navigate("/wishlist");
      return;
    }
    setActiveTab(tab);
    setSearchParams({ tab });
    clearFeedback();
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Handlers ── */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!firstName.trim() || !lastName.trim()) { setErrorMsg("First name and last name are required."); return; }

    const phoneCheck = validatePhoneNumber(phone);
    if (!phoneCheck.isValid) {
      setErrorMsg(phoneCheck.error!);
      return;
    }

    const isB2BSubmission = isB2B || accountType === "b2b";
    if (isB2BSubmission) {
      if (!companyName.trim()) { setErrorMsg("Company / Firm Name is required for B2B accounts."); return; }
      if (!gstin.trim()) { setErrorMsg("GSTIN is required for B2B accounts."); return; }
      const gstCheck = validateGstin(gstin);
      if (!gstCheck.isValid) {
        setErrorMsg(gstCheck.error!);
        return;
      }
    }

    setIsLoading(true);
    const res = await updateUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phoneCheck.normalized || phone.trim(),
      ...(isB2BSubmission
        ? { companyName: companyName.trim(), gstin: gstin.trim().toUpperCase() }
        : {}),
    });
    setIsLoading(false);
    if (res.success) {
      if (!isB2B && isB2BSubmission) {
        setSuccessMsg("Account upgraded to B2B Wholesale Partner successfully! Wholesale pricing and Quotation tools unlocked.");
      } else {
        setSuccessMsg("Profile updated successfully!");
      }
      setTimeout(clearFeedback, 4000);
    } else {
      setErrorMsg(res.message || "Failed to update profile.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!newPassword || !confirmPassword) { setErrorMsg("Please fill all password fields."); return; }
    if (newPassword.length < 8) { setErrorMsg("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setErrorMsg("Passwords do not match."); return; }
    setIsLoading(true);
    const res = await authService.forgotPassword({ email: user?.email || "" });
    setIsLoading(false);
    if (res.success) {
      setSuccessMsg("A password reset link has been sent to your email. Please check your inbox.");
      setNewPassword(""); setConfirmPassword("");
      setTimeout(clearFeedback, 7000);
    } else {
      setErrorMsg(res.error?.message || "Failed to send password reset email.");
    }
  };

  // ─── Location Search Debounce (OpenStreetMap Nominatim API) ────────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setIsSearchingLocation(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5&countrycodes=in`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (_err) {
        setSearchResults([]);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (item: any) => {
    const address = item.address || {};
    const line = [
      address.road || address.building || address.suburb,
      address.neighbourhood || address.residential || address.subdistrict,
    ].filter(Boolean).join(", ") || item.display_name?.split(",").slice(0, 2).join(",");

    setAddrLine1(line || item.display_name?.split(",")[0] || "");
    if (address.city || address.town || address.village || address.county) {
      setAddrCity(address.city || address.town || address.village || address.county);
    }
    if (address.state) setAddrState(address.state);
    if (address.postcode) setAddrPincode(address.postcode);
    if (item.lat && item.lon) {
      setAddrLat(parseFloat(item.lat));
      setAddrLng(parseFloat(item.lon));
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingUser(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddrLat(latitude);
        setAddrLng(longitude);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};

            const line = [
              address.road || address.building || address.suburb,
              address.neighbourhood || address.residential || address.subdistrict,
            ].filter(Boolean).join(", ") || data.display_name?.split(",").slice(0, 2).join(",");

            if (line) setAddrLine1(line);
            if (address.city || address.town || address.village || address.county) {
              setAddrCity(address.city || address.town || address.village || address.county);
            }
            if (address.state) setAddrState(address.state);
            if (address.postcode) setAddrPincode(address.postcode);
          }
        } catch (_err) {
          setLocationError("Could not fetch address name automatically. Please enter details.");
        } finally {
          setIsLocatingUser(false);
        }
      },
      (err) => {
        setIsLocatingUser(false);
        if (err.code === 1) {
          setLocationError("Location permission denied. Please allow location access or type manually.");
        } else {
          setLocationError("Unable to retrieve GPS coordinates. Please type address manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddrLabel("Home");
    setAddrLine1("");
    setAddrLine2("");
    setAddrCity("");
    setAddrState("");
    setAddrPincode("");
    setAddrPhone(user?.phone || "");
    setAddrEmail(user?.email || "");
    setAddrAltPhone("");
    setAddrHasWhatsapp(false);
    setAddrIsDefault(false);
    setAddrLat(null);
    setAddrLng(null);
    setSearchQuery("");
    setSearchResults([]);
    setLocationError("");
  };

  const handleOpenAddForm = () => {
    resetAddressForm();
    setShowAddressForm(true);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label || "Home");
    setAddrLine1(addr.line1 || addr.addressLine1 || "");
    setAddrLine2(addr.line2 || addr.addressLine2 || "");
    setAddrCity(addr.city || "");
    setAddrState(addr.state || "");
    setAddrPincode(addr.pincode || addr.postalCode || "");
    setAddrPhone(addr.phone || user?.phone || "");
    setAddrEmail(addr.email || user?.email || "");
    setAddrAltPhone(addr.altPhone || "");
    setAddrHasWhatsapp(Boolean(addr.hasWhatsapp));
    setAddrIsDefault(Boolean(addr.isDefault));
    setAddrLat(addr.latitude ?? null);
    setAddrLng(addr.longitude ?? null);
    setSearchQuery("");
    setSearchResults([]);
    setLocationError("");
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (!addrLine1.trim()) {
      setErrorMsg("Address Line 1 is required.");
      return;
    }
    if (!addrLine2.trim()) {
      setErrorMsg("Address Line 2 (Area / Landmark) is required.");
      return;
    }
    if (!addrCity.trim() || !addrState.trim()) {
      setErrorMsg("City and State are required.");
      return;
    }
    if (!addrPincode.trim() || addrPincode.trim().length < 5) {
      setErrorMsg("Valid pincode / postal code is required.");
      return;
    }

    setIsLoading(true);

    const payload = {
      label: addrLabel.trim() || "Home",
      line1: addrLine1.trim(),
      line2: addrLine2.trim() || null,
      city: addrCity.trim(),
      state: addrState.trim(),
      pincode: addrPincode.trim(),
      phone: addrPhone.trim() || null,
      email: addrEmail.trim() || null,
      altPhone: addrAltPhone.trim() || null,
      hasWhatsapp: addrHasWhatsapp,
      latitude: addrLat,
      longitude: addrLng,
      isDefault: addrIsDefault,
    };

    const url = editingAddressId ? `/users/addresses/${editingAddressId}` : "/users/addresses";
    const method = editingAddressId ? "PATCH" : "POST";

    const res = await fetchApi(url, {
      method,
      body: JSON.stringify(payload),
    });

    setIsLoading(false);

    if (res.success) {
      setShowAddressForm(false);
      resetAddressForm();
      setSuccessMsg(editingAddressId ? "Address updated successfully!" : "Address saved successfully!");
      setTimeout(clearFeedback, 4000);
      const fresh = await fetchApi("/users/addresses");
      if (fresh.success && Array.isArray(fresh.data)) setAddresses(fresh.data);
    } else {
      setErrorMsg(res.error?.message || "Failed to save address.");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    await fetchApi(`/users/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleLogout = async () => { await logout(); onClose(); };

  const getInitials = () => {
    const f = user?.firstName?.charAt(0)?.toUpperCase() || "";
    const l = user?.lastName?.charAt(0)?.toUpperCase() || "";
    return f + l || "U";
  };

  // Fetch notifications when tab selected
  useEffect(() => {
    if (activeTab !== "notifications") return;
    setNotifLoading(true);
    fetchApi("/notifications?limit=30")
      .then((res) => {
        if (res.success && res.data) setNotifications(res.data.notifications ?? res.data ?? []);
        else setNotifications([]);
      })
      .catch(() => setNotifications([]))
      .finally(() => setNotifLoading(false));
  }, [activeTab]);

  // Fetch my reviews when tab selected
  useEffect(() => {
    if (activeTab !== "reviews") return;
    setReviewsLoading(true);
    fetchApi("/users/reviews")
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setMyReviews(res.data);
        else setMyReviews([]);
      })
      .catch(() => setMyReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [activeTab]);

  const TABS: { key: ProfileTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <User size={15} /> },
    { key: "edit", label: "Edit Profile", icon: <Edit3 size={15} /> },
    { key: "quotes" as ProfileTab, label: "My Quotations", icon: <FileText size={15} /> },
    { key: "po" as ProfileTab, label: "Purchase Orders (PO)", icon: <FileSpreadsheet size={15} />, badge: purchaseOrders.length > 0 ? purchaseOrders.length : undefined },
    ...(isB2B ? [{
      key: "proforma" as ProfileTab,
      label: "Proforma Invoices (PI)",
      icon: <Receipt size={15} />,
      badge: proformaInvoices.length > 0 ? proformaInvoices.length : undefined,
    }] : []),
    { key: "orders", label: "My Orders", icon: <Package size={15} /> },
    { key: "cart", label: "My Cart", icon: <ShoppingCart size={15} />, badge: cart.reduce((s, i) => s + i.qty, 0) },
    { key: "wishlist", label: "Wishlist", icon: <Heart size={15} />, badge: wishlist.size },
    { key: "addresses", label: "Addresses", icon: <MapPin size={15} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={15} /> },
    { key: "reviews", label: "My Reviews", icon: <Star size={15} /> },
    { key: "security", label: "Security", icon: <Shield size={15} /> },
  ];

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[60] bg-[#EACEAA] overflow-y-auto"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Background Decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#D39858]/8" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#34150F]/5" />
      </div>

      <div className="relative max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-20 sm:pb-16">

        {/* Back button */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 sm:gap-2 text-[#85431E] hover:text-[#34150F] font-bold text-xs sm:text-sm mb-4 sm:mb-8 transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Back to Store</span>
        </button>

        {/* ── HERO CARD ── */}
        <div className="relative bg-gradient-to-br from-[#34150F] via-[#4a1e0d] to-[#6b2f12] rounded-tr-2xl rounded-bl-2xl sm:rounded-tr-3xl sm:rounded-bl-3xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
            <div className="absolute top-3 right-8 w-40 h-40 rounded-full border-4 border-[#EACEAA]" />
            <div className="absolute bottom-3 right-24 w-24 h-24 rounded-full border-2 border-[#EACEAA]" />
            <div className="absolute top-20 right-4 w-14 h-14 rounded-full border-2 border-[#EACEAA]" />
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl bg-gradient-to-br from-[#D39858] to-[#85431E] flex items-center justify-center shadow-xl border-2 sm:border-4 border-[#EACEAA]/20">
                  <span className="text-[#34150F] font-black text-xl sm:text-3xl md:text-4xl" style={{ fontFamily: "'Gilda Display', serif" }}>
                    {getInitials()}
                  </span>
                </div>
                {user?.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 bg-emerald-500 rounded-full border-2 border-[#34150F] flex items-center justify-center shadow">
                    <CheckCircle2 size={11} className="text-white sm:w-3.5 sm:h-3.5" />
                  </div>
                )}
              </div>

              {/* Identity Info (mobile header right) */}
              <div className="flex-1 min-w-0 md:hidden">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <h1 className="text-base sm:text-xl font-black text-[#EACEAA] truncate" style={{ fontFamily: "'Gilda Display', serif" }}>
                    {user?.firstName} {user?.lastName}
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full ${
                    isB2B ? "bg-[#D39858] text-[#34150F]" : "bg-[#EACEAA]/20 text-[#EACEAA] border border-[#EACEAA]/30"
                  }`}>
                    {isB2B ? "B2B" : "Retail"}
                  </span>
                  {user?.isVerified && (
                    <span className="text-[9px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-[#EACEAA]/70">
                  <p className="truncate flex items-center gap-1"><Mail size={10} className="text-[#D39858] flex-shrink-0" />{user?.email}</p>
                  {user?.phone && (
                    <p className="truncate flex items-center gap-1"><Phone size={10} className="text-[#D39858] flex-shrink-0" />{user.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Identity Info */}
            <div className="hidden md:block flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-[#EACEAA]" style={{ fontFamily: "'Gilda Display', serif" }}>
                  {user?.firstName} {user?.lastName}
                </h1>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                  isB2B ? "bg-[#D39858] text-[#34150F]" : "bg-[#EACEAA]/20 text-[#EACEAA] border border-[#EACEAA]/30"
                }`}>
                  {isB2B ? "B2B Business" : "B2C Retail"}
                </span>
                {user?.isVerified && (
                  <span className="text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#EACEAA]/70">
                <span className="flex items-center gap-1.5">
                  <Mail size={12} className="text-[#D39858]" />{user?.email}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="text-[#D39858]" />{user.phone}
                  </span>
                )}
                {user?.companyName && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={12} className="text-[#D39858]" />{user.companyName}
                  </span>
                )}
              </div>
              {user?.gstin && (
                <div className="mt-2 inline-flex items-center gap-2 bg-[#EACEAA]/10 border border-[#EACEAA]/15 px-3 py-1 rounded-full">
                  <FileText size={12} className="text-[#D39858]" />
                  <span className="text-xs font-mono text-[#EACEAA]/80">GSTIN: {user.gstin}</span>
                </div>
              )}
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-red-300 hover:text-red-100 bg-red-900/30 hover:bg-red-900/60 border border-red-500/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl transition-all duration-200 text-xs font-bold flex-shrink-0 self-end md:self-auto"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── TABS (Mobile horizontal swipe strip / Desktop grid) ── */}
        <div className="flex overflow-x-auto no-scrollbar touch-pan-x gap-1.5 pb-2 mb-4 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:flex md:flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-95 ${
                activeTab === t.key
                  ? "bg-[#34150F] text-[#EACEAA] shadow-md"
                  : "bg-white/80 text-[#85431E] hover:bg-white border border-[#34150F]/10"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`ml-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full text-[9px] sm:text-[10px] font-black flex items-center justify-center ${
                  activeTab === t.key ? "bg-[#D39858] text-[#34150F]" : "bg-[#34150F] text-[#EACEAA]"
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Feedback Banners */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-tr-xl rounded-bl-xl bg-red-100 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-tr-xl rounded-bl-xl bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ═══════════════ OVERVIEW ═══════════════ */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal */}
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 shadow-sm border border-[#34150F]/6">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={14} className="text-[#D39858]" /> Personal Info
              </h3>
              <dl className="space-y-0">
                {[
                  { label: "Full Name", value: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "—" },
                  { label: "Email", value: user?.email || "—" },
                  { label: "Phone", value: user?.phone || "Not provided" },
                  { label: "Role", value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Customer" },
                ].map((i) => (
                  <div key={i.label} className="flex items-start justify-between py-2.5 border-b border-[#34150F]/5 last:border-0 gap-3">
                    <dt className="text-xs text-[#85431E] font-semibold shrink-0">{i.label}</dt>
                    <dd className="text-xs font-bold text-[#34150F] text-right break-all">{i.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Business */}
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 shadow-sm border border-[#34150F]/6">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Building2 size={14} className="text-[#D39858]" /> Business Info
              </h3>
              {isB2B ? (
                <div>
                  <dl className="space-y-0">
                    {[
                      { label: "Company", value: user?.companyName || "—" },
                      { label: "GSTIN", value: user?.gstin || "—" },
                      { label: "Type", value: "B2B Wholesale Partner" },
                    ].map((i) => (
                      <div key={i.label} className="flex items-start justify-between py-2.5 border-b border-[#34150F]/5 last:border-0 gap-3">
                        <dt className="text-xs text-[#85431E] font-semibold shrink-0">{i.label}</dt>
                        <dd className="text-xs font-bold text-[#34150F] text-right break-all font-mono">{i.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => switchTab("quotes")}
                      className="flex items-center justify-center gap-1.5 bg-[#EACEAA] text-[#34150F] border border-[#34150F]/20 font-bold text-xs py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] transition-all shadow-xs"
                    >
                      <FileText size={13} /> Quotations →
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab("po")}
                      className="flex items-center justify-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold text-xs py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all shadow-xs"
                    >
                      <FileSpreadsheet size={13} /> PO Orders →
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab("proforma")}
                      className="flex items-center justify-center gap-1.5 bg-[#D39858] text-[#34150F] font-black text-xs py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all shadow-xs"
                    >
                      <Receipt size={13} /> Proformas (PI) →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <Building2 size={32} className="text-[#D39858]/35 mb-3" />
                  <p className="text-xs font-semibold text-[#85431E] mb-1">Personal / Retail Account</p>
                  <p className="text-[10px] text-[#34150F]/45 mb-3">Add business details to unlock bulk pricing and GST invoices.</p>
                  <button type="button" onClick={() => switchTab("edit")} className="text-xs font-bold text-[#D39858] hover:underline">
                    Add Business Details →
                  </button>
                </div>
              )}
            </div>

            {/* Security Summary */}
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 shadow-sm border border-[#34150F]/6">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield size={14} className="text-[#D39858]" /> Account Security
              </h3>
              <div className="space-y-0">
                {[
                  { label: "Email Verified", value: user?.isVerified ? "✓ Verified" : "✗ Not Verified", ok: !!user?.isVerified },
                  { label: "Account Status", value: "Active", ok: true },
                ].map((i) => (
                  <div key={i.label} className="flex items-center justify-between py-2.5 border-b border-[#34150F]/5">
                    <span className="text-xs text-[#85431E] font-semibold">{i.label}</span>
                    <span className={`text-xs font-bold ${i.ok ? "text-emerald-600" : "text-red-600"}`}>{i.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-[#85431E] font-semibold">Password</span>
                  <button type="button" onClick={() => switchTab("security")} className="text-xs font-bold text-[#D39858] hover:underline">
                    Change →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 shadow-sm border border-[#34150F]/6">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Bell size={14} className="text-[#D39858]" /> Quick Actions
              </h3>
              <div className="space-y-2">
                {([
                  { icon: <Edit3 size={13} />, label: "Edit My Profile", action: () => switchTab("edit") },
                  { icon: <Clock size={13} />, label: "My Quotations & Tracking", action: () => switchTab("quotes") },
                  ...(isB2B ? [
                    { icon: <FileSpreadsheet size={13} />, label: "My Purchase Orders (PO)", action: () => switchTab("po") },
                  ] : []),
                  { icon: <MapPin size={13} />, label: "Manage Addresses", action: () => switchTab("addresses") },
                  { icon: <Lock size={13} />, label: "Change Password", action: () => switchTab("security") },
                  { icon: <Package size={13} />, label: "View My Orders", action: () => switchTab("orders") },
                ] as { icon: React.ReactNode; label: string; action: () => void }[]).map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.action}
                    className="w-full flex items-center justify-between p-3 bg-[#EACEAA]/40 hover:bg-[#D39858]/12 rounded-tr-xl rounded-bl-xl transition-colors text-xs font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[#D39858]">{a.icon}</span>
                      <span className="text-[#34150F]">{a.label}</span>
                    </span>
                    <ChevronRight size={13} className="text-[#85431E]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ PURCHASE ORDERS (PO INTAKE & STATUS) ═══════════════ */}
        {activeTab === "po" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Header Card */}
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 sm:p-6 shadow-sm border border-[#34150F]/6 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-black text-[#34150F] text-sm sm:text-base uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: "'Gilda Display', serif" }}>
                  <FileSpreadsheet size={18} className="text-[#D39858]" /> Commercial Purchase Orders (PO)
                </h3>
                <p className="text-xs text-[#85431E]">
                  Track the technical review, commercial approval, and proforma invoice issuance for your purchase orders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/submit-po");
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md active:scale-95"
                >
                  <Plus size={14} /> Submit New PO
                </button>
              </div>
            </div>

            {/* Search & Status Filter Bar */}
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-3 sm:p-4 shadow-sm border border-[#34150F]/6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#85431E]/50" />
                <input
                  type="text"
                  value={poSearchQuery}
                  onChange={(e) => setPoSearchQuery(e.target.value)}
                  placeholder="Search by PO ID, Customer PO #, or subject..."
                  className="w-full bg-[#EACEAA]/20 text-[#34150F] placeholder-[#85431E]/50 pl-9 pr-3 py-2 rounded-xl text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                {[
                  { key: "ALL", label: "All POs" },
                  { key: "NEW", label: "New" },
                  { key: "UNDER_REVIEW", label: "Under Review" },
                  { key: "PROCESSING", label: "Processing" },
                  { key: "COMPLETED", label: "Completed" },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setPoStatusFilter(st.key)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                      poStatusFilter === st.key
                        ? "bg-[#34150F] text-[#EACEAA] shadow-2xs"
                        : "bg-[#EACEAA]/30 text-[#85431E] hover:bg-[#EACEAA]/50"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content List */}
            {ordersLoading ? (
              <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-12 text-center shadow-sm border border-[#34150F]/6 space-y-3">
                <div className="w-8 h-8 border-3 border-[#D39858] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#85431E]">Loading your Purchase Orders...</p>
              </div>
            ) : (() => {
              const filteredPos = purchaseOrders.filter((po) => {
                const matchesQuery = !poSearchQuery.trim() ||
                  (po.poSubmissionId && po.poSubmissionId.toLowerCase().includes(poSearchQuery.toLowerCase())) ||
                  (po.poNumber && po.poNumber.toLowerCase().includes(poSearchQuery.toLowerCase())) ||
                  (po.customerPoNumber && po.customerPoNumber.toLowerCase().includes(poSearchQuery.toLowerCase())) ||
                  (po.quotationNumber && po.quotationNumber.toLowerCase().includes(poSearchQuery.toLowerCase())) ||
                  (po.subject && po.subject.toLowerCase().includes(poSearchQuery.toLowerCase()));

                const matchesStatus = poStatusFilter === "ALL" || po.status === poStatusFilter;
                return matchesQuery && matchesStatus;
              });

              if (filteredPos.length === 0) {
                return (
                  <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-8 sm:p-12 text-center shadow-sm border border-[#34150F]/6 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#EACEAA]/40 flex items-center justify-center mx-auto text-[#85431E]">
                      <FileSpreadsheet size={32} />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h4 className="font-black text-[#34150F] text-sm">No Purchase Orders Found</h4>
                      <p className="text-xs text-[#85431E]">
                        {poSearchQuery || poStatusFilter !== "ALL"
                          ? "No POs match your current search or status filter."
                          : "You have not submitted any Purchase Orders yet. You can submit via quotation, custom form, or document upload."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate("/submit-po");
                      }}
                      className="inline-flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold px-5 py-2.5 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md"
                    >
                      <Plus size={14} /> Submit Purchase Order Now
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredPos.map((po) => {
                    const poRefId = po.poSubmissionId || po.poNumber || po.id;
                    const dateStr = po.receivedAt || po.submittedAt || po.createdAt;
                    const totalVal = po.metadata?.totalEstimatedValue || po.totalAmount;
                    const lineItemsCount = po.metadata?.lineItems?.length || po.items?.length || 0;
                    const attachmentsList = po.attachments || [];

                    return (
                      <div
                        key={po.id || poRefId}
                        className="bg-white rounded-tr-2xl rounded-bl-2xl p-4 sm:p-5 shadow-sm border border-[#34150F]/10 hover:border-[#D39858]/50 transition-all space-y-3"
                      >
                        {/* Header Row */}
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#34150F]/8 pb-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-[#34150F]">
                                {poRefId}
                              </span>
                              {po.customerPoNumber && (
                                <span className="inline-flex items-center gap-1 bg-[#34150F]/10 text-[#34150F] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#34150F]/15">
                                  Client PO: {po.customerPoNumber}
                                </span>
                              )}
                              {po.source && (
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                  {po.source === "QUOTATION"
                                    ? "📋 Quotation Linked"
                                    : po.source === "PO_FORM"
                                    ? "📝 Custom Form"
                                    : po.source === "CUSTOM_PDF_UPLOAD"
                                    ? "📤 Direct Upload"
                                    : "📧 Inbound Email"}
                                </span>
                              )}
                              {(po.metadata?.quoteNumber || po.quotationNumber) && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-blue-200">
                                  Linked Quote: {po.metadata?.quoteNumber || po.quotationNumber}
                                </span>
                              )}
                            </div>
                            {dateStr && (
                              <p className="text-[11px] text-[#85431E]/70 flex items-center gap-1">
                                <Clock size={11} /> Submitted on {new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>

                          <div>
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                                po.status === "COMPLETED" || po.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : po.status === "PROCESSING" || po.status === "INVOICED"
                                  ? "bg-purple-100 text-purple-800 border-purple-300"
                                  : po.status === "UNDER_REVIEW" || po.status === "NEW"
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : po.status === "CANCELLED" || po.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : "bg-blue-100 text-blue-800 border-blue-300"
                              }`}
                            >
                              {String(po.status || "UNDER_REVIEW").replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Subject & Summary */}
                        {po.subject && (
                          <p className="text-xs font-bold text-[#34150F]">
                            {po.subject}
                          </p>
                        )}

                        {/* Metrics bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-[#FAF5EE] p-2.5 rounded-xl border border-[#34150F]/6">
                          <div>
                            <span className="text-[10px] text-[#85431E] block font-semibold">Scope / Items</span>
                            <span className="font-bold text-[#34150F]">
                              {lineItemsCount > 0 ? `${lineItemsCount} Line Item(s)` : "Document Attachment"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#85431E] block font-semibold">Estimated Value</span>
                            <span className="font-bold text-[#34150F] font-mono">
                              {totalVal ? `₹${Number(totalVal).toLocaleString("en-IN")}` : "Under Quotation Review"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#85431E] block font-semibold">Attached Docs</span>
                            <span className="font-bold text-[#34150F]">
                              {attachmentsList.length > 0 ? `${attachmentsList.length} File(s)` : "None"}
                            </span>
                          </div>
                        </div>

                        {/* Attachments links */}
                        {attachmentsList.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10.5px] font-bold text-[#85431E] block">Uploaded Documents:</span>
                            <div className="flex flex-wrap gap-2">
                              {attachmentsList.map((att: any, attIdx: number) => {
                                const downloadUrl = att.storageUrl?.startsWith("http")
                                  ? att.storageUrl
                                  : `${API_BASE_URL}/po-management/attachments/${att.id}/download`;

                                return (
                                  <a
                                    key={att.id || attIdx}
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EACEAA]/30 hover:bg-[#D39858]/20 text-[#34150F] rounded-lg text-[11px] font-bold border border-[#34150F]/15 transition-colors"
                                  >
                                    <Download size={11} className="text-[#D39858]" />
                                    <span>{att.fileName || `Attachment #${attIdx + 1}`}</span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════════ B2B QUOTATIONS (EXCLUSIVE) ═══════════════ */}
        {activeTab === "quotes" && (
          <B2BQuotationManager onGoToProfileEdit={() => switchTab("edit")} />
        )}

        {/* ═══════════════ B2B PROFORMA INVOICES (EXCLUSIVE) ═══════════════ */}
        {activeTab === "proforma" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest flex items-center gap-2">
                  <Receipt size={15} className="text-[#D39858]" /> Proforma Invoices (PI)
                  {proformaInvoices.length > 0 && (
                    <span className="bg-[#34150F] text-[#EACEAA] text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                      {proformaInvoices.length}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#85431E]/80 mt-0.5">
                  View and download officially issued B2B Proforma Invoices, verify cryptographic authenticity, and submit advance payment remittance receipts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9.5px] font-black uppercase tracking-wider bg-[#D39858] text-[#34150F] px-2.5 py-1 rounded-full font-mono">
                  B2B EXCLUSIVE
                </span>
              </div>
            </div>

            {/* Proforma Search & Status Filters */}
            <div className="bg-white rounded-tr-xl rounded-bl-xl p-3 sm:p-4 border border-[#34150F]/10 space-y-2.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={proformaSearch}
                    onChange={(e) => setProformaSearch(e.target.value)}
                    placeholder="Search by PI Number, Quote Ref, or PO Reference..."
                    className="w-full bg-[#EACEAA]/20 text-[#34150F] placeholder-[#85431E]/40 pl-8 pr-4 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/10 focus:outline-none focus:border-[#D39858]"
                  />
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/50" />
                  {proformaSearch && (
                    <button
                      type="button"
                      onClick={() => setProformaSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/50 hover:text-[#34150F]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                  {[
                    { id: "ALL", label: "All Statuses" },
                    { id: "APPROVED", label: "Approved / Signed" },
                    { id: "ADVANCE_RECEIVED", label: "Advance Paid" },
                    { id: "ACCEPTED", label: "Accepted" },
                    { id: "CONVERTED", label: "Converted to Tax Invoice" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setProformaStatusFilter(filter.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                        proformaStatusFilter === filter.id
                          ? "bg-[#34150F] text-[#EACEAA] shadow-2xs"
                          : "bg-[#EACEAA]/30 text-[#85431E] hover:bg-[#EACEAA]/60"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Proforma List */}
            {proformaLoading ? (
              <div className="flex justify-center py-12 sm:py-16">
                <div className="w-8 h-8 border-2 border-[#D39858] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (() => {
              const filtered = proformaInvoices.filter((pi) => {
                if (proformaStatusFilter !== "ALL") {
                  if (proformaStatusFilter === "APPROVED" && !["APPROVED", "SIGNED", "SENT"].includes(pi.status)) return false;
                  if (proformaStatusFilter === "ADVANCE_RECEIVED" && pi.status !== "ADVANCE_RECEIVED") return false;
                  if (proformaStatusFilter === "ACCEPTED" && pi.status !== "ACCEPTED") return false;
                  if (proformaStatusFilter === "CONVERTED" && pi.status !== "CONVERTED") return false;
                }
                if (!proformaSearch.trim()) return true;
                const q = proformaSearch.toLowerCase().trim();
                return (
                  pi.piNumber?.toLowerCase().includes(q) ||
                  pi.companyName?.toLowerCase().includes(q) ||
                  pi.customerName?.toLowerCase().includes(q) ||
                  (pi as any).quoteNumber?.toLowerCase().includes(q) ||
                  (pi as any).poNumber?.toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-8 sm:p-12 text-center border border-[#34150F]/6 shadow-2xs space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#EACEAA]/60 flex items-center justify-center mx-auto text-[#D39858]">
                      <Receipt size={32} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-[#34150F]">No Proforma Invoices Found</h4>
                      <p className="text-xs text-[#85431E] max-w-md mx-auto leading-relaxed">
                        {proformaSearch
                          ? `No Proforma Invoices match "${proformaSearch}". Try clearing your search query.`
                          : "Proforma Invoices are issued exclusively by the PRC Hardware administration upon approval of your Quotations or Purchase Orders. Once issued, your signed PI and payment details will appear here."}
                      </p>
                    </div>
                    {proformaSearch ? (
                      <button
                        type="button"
                        onClick={() => { setProformaSearch(""); setProformaStatusFilter("ALL"); }}
                        className="inline-flex items-center gap-1 bg-[#34150F] text-[#EACEAA] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all"
                      >
                        Reset Search
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchTab("quotes")}
                        className="inline-flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] text-xs font-bold px-4 py-2 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all"
                      >
                        <FileText size={13} /> View Quotations
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map((pi) => {
                    const statusColor =
                      pi.status === "CONVERTED"
                        ? "bg-purple-100 text-purple-800 border-purple-300"
                        : pi.status === "ADVANCE_RECEIVED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : pi.status === "ACCEPTED"
                        ? "bg-teal-100 text-teal-800 border-teal-300"
                        : pi.status === "APPROVED" || pi.status === "SIGNED"
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : pi.status === "EXPIRED"
                        ? "bg-stone-100 text-stone-600 border-stone-300"
                        : "bg-amber-100 text-amber-800 border-amber-300";

                    return (
                      <div
                        key={pi.id}
                        className="bg-white rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-4 sm:p-5 shadow-2xs border border-[#34150F]/10 hover:shadow-xs transition-all space-y-3"
                      >
                        {/* Header */}
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#34150F]/8 pb-2.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9.5px] font-black uppercase bg-[#34150F] text-[#EACEAA] px-1.5 py-0.5 rounded tracking-wider font-mono">
                                PI
                              </span>
                              <Link
                                to={`/pi/${pi.verificationToken}`}
                                onClick={onClose}
                                className="text-sm font-black text-[#34150F] hover:text-[#85431E] font-mono transition-colors"
                              >
                                {pi.piNumber}
                              </Link>
                              {pi.financialYear && (
                                <span className="text-[9.5px] font-bold text-[#85431E] bg-[#EACEAA]/40 border border-[#85431E]/20 px-1.5 py-0.2 rounded font-mono">
                                  FY {pi.financialYear}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#85431E]/80 pt-0.5">
                              <span>
                                Issued: <strong>{new Date(pi.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                              </span>
                              {pi.validUntil && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Valid Until: <strong>{new Date(pi.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                                  </span>
                                </>
                              )}
                              {pi.placeOfSupply && (
                                <>
                                  <span>•</span>
                                  <span>Place of Supply: <strong>{pi.placeOfSupply}</strong></span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <span className={`text-[9.5px] font-black px-2.5 py-0.8 rounded-full uppercase tracking-wider border ${statusColor}`}>
                              {pi.status.replace(/_/g, " ")}
                            </span>
                            {pi.signedBy && (
                              <p className="text-[9px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                                <Shield size={10} /> Digitally Signed
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Commercial Financial Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#FAF5EE] p-3 rounded-xl border border-[#34150F]/6 text-xs">
                          <div>
                            <span className="text-[10px] text-[#85431E] block font-semibold">Scope</span>
                            <span className="font-bold text-[#34150F]">{pi.items?.length || 0} Line Item(s)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#85431E] block font-semibold">Grand Total (Incl. GST)</span>
                            <span className="font-bold font-mono text-[#34150F]">₹{Number(pi.grandTotal || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#85431E] block font-semibold">Advance Required ({pi.advancePercentage || 30}%)</span>
                            <span className="font-bold font-mono text-emerald-700">₹{Number(pi.advanceAmount || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#85431E] block font-semibold">Balance at Dispatch</span>
                            <span className="font-bold font-mono text-amber-900">₹{Number(pi.balanceDue || 0).toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Cryptographic Authenticity Strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] bg-[#EACEAA]/20 px-3 py-1.5 rounded-lg border border-[#D39858]/30">
                          <div className="flex items-center gap-1.5 text-[#85431E]">
                            <Shield size={12} className="text-[#D39858]" />
                            <span>SHA-256 Authenticity Seal:</span>
                            <span className="font-mono text-[#34150F] font-bold truncate max-w-[150px] sm:max-w-[250px]">
                              {pi.documentHash || pi.verificationId || "VERIFIED-DOC"}
                            </span>
                          </div>
                          <span className="text-emerald-700 font-bold text-[9.5px] uppercase tracking-wider">
                            ✓ Tamper Proof Seal Verified
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#34150F]/8">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await proformaInvoiceService.downloadPdfByToken(pi.verificationToken, pi.piNumber);
                                } catch (err: any) {
                                  alert(err.message || "Failed to download PDF");
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#34150F] hover:text-white bg-[#EACEAA]/50 hover:bg-[#34150F] border border-[#34150F]/20 px-3 py-1.5 rounded-lg transition-all shadow-2xs active:scale-95"
                            >
                              <Download size={12} className="text-[#D39858]" />
                              <span>Download PDF</span>
                            </button>

                            <a
                              href={`${API_BASE_URL}/proforma-invoices/public/${encodeURIComponent(pi.verificationToken)}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#85431E] hover:text-[#34150F] px-2 py-1.5 rounded-lg transition-colors"
                            >
                              <ExternalLink size={12} />
                              <span>Open in Browser</span>
                            </a>
                          </div>

                          <Link
                            to={`/pi/${pi.verificationToken}`}
                            onClick={onClose}
                            className={`inline-flex items-center gap-1.5 font-bold text-xs px-4 py-1.5 rounded-lg transition-all shadow-2xs active:scale-95 ${
                              pi.status === "ADVANCE_RECEIVED" || pi.status === "APPROVED"
                                ? "bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F]"
                                : "bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white shadow-emerald-900/20"
                            }`}
                          >
                            <Upload size={12} />
                            <span>
                              {pi.status === "ADVANCE_RECEIVED" || pi.status === "APPROVED"
                                ? "View Commercial PI"
                                : "Upload Payment Receipt & UTR"}
                            </span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════════ EDIT PROFILE ═══════════════ */}
        {activeTab === "edit" && (
          <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 shadow-sm border border-[#34150F]/6">
            <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
              <Edit3 size={14} className="text-[#D39858]" /> Edit Profile Information
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "First Name *", value: firstName, set: setFirstName, placeholder: "Rahul" },
                  { label: "Last Name *", value: lastName, set: setLastName, placeholder: "Sharma" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">{f.label}</label>
                    <input
                      type="text" value={f.value} onChange={(e) => f.set(e.target.value)}
                      placeholder={f.placeholder} required
                      className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] focus:bg-[#EACEAA]/50 transition-all"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">Email Address</label>
                <input type="email" value={user?.email || ""} disabled
                  className="w-full bg-[#34150F]/5 text-[#34150F]/50 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/8 cursor-not-allowed" />
                <p className="text-[10px] text-[#85431E]/60 mt-1">Email address cannot be changed.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">Phone Number *</label>
                <div className="relative">
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210" required
                    className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 pl-10 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] focus:bg-[#EACEAA]/50 transition-all" />
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                </div>
              </div>

              {/* Account Type + B2B Section */}
              <div className="pt-4 border-t border-[#34150F]/8">
                <p className="text-[10px] font-bold text-[#85431E] uppercase tracking-wider mb-3">
                  Account Type &amp; Business Profile
                </p>

                {isB2B ? (
                  /* ── Verified B2B User: Locked to B2B (Cannot Downgrade) ── */
                  <div className="space-y-4">
                    <div className="p-3.5 bg-[#34150F]/6 border border-[#34150F]/15 rounded-tr-xl rounded-bl-xl text-xs text-[#34150F] flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-tr-md rounded-bl-md bg-[#D39858] text-[#34150F] flex items-center justify-center flex-shrink-0 font-black text-xs">
                        ✓
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-[#34150F] text-xs uppercase tracking-wider">
                            B2B Wholesale Partner (Verified)
                          </span>
                          <span className="text-[10px] font-bold bg-[#D39858] text-[#34150F] px-2 py-0.5 rounded-full">
                            Wholesale Pricing Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[#85431E]/80 mt-1">
                          Your account is registered as a B2B Wholesale Partner. B2B accounts cannot be downgraded to retail to safeguard your custom quote records, bulk pricing contracts, and GST invoices.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                          Company / Firm Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Acme Hardware Pvt Ltd"
                            required
                            className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 pl-10 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] focus:bg-[#EACEAA]/50 transition-all"
                          />
                          <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                          GSTIN <span className="text-red-500">*</span>{" "}
                          <span className="text-[#34150F]/40 font-normal">(15 characters)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            placeholder="27AAAAA0000A1Z5"
                            maxLength={15}
                            required
                            className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 pl-10 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] focus:bg-[#EACEAA]/50 transition-all font-mono"
                          />
                          <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                        </div>
                        {gstin && (() => {
                          const check = validateGstin(gstin);
                          if (check.isValid) {
                            return (
                              <p className="text-[10px] text-emerald-600 font-bold mt-1">
                                ✓ Valid {check.stateName} GSTIN ({check.entityType})
                              </p>
                            );
                          }
                          return <p className="text-[10px] text-red-500 mt-1">{check.error}</p>;
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── B2C Retail User: Can choose to Upgrade to B2B ── */
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType("b2c")}
                        className={`flex-1 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-black uppercase tracking-wider border-2 transition-all duration-200 ${
                          accountType === "b2c"
                            ? "bg-[#D39858] text-[#34150F] border-[#D39858] shadow-md"
                            : "bg-transparent text-[#85431E] border-[#34150F]/20 hover:border-[#34150F]/40"
                        }`}
                      >
                        B2C — Personal / Retail
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("b2b")}
                        className={`flex-1 py-2.5 rounded-tr-xl rounded-bl-xl text-xs font-black uppercase tracking-wider border-2 transition-all duration-200 flex items-center justify-center gap-1.5 ${
                          accountType === "b2b"
                            ? "bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-md"
                            : "bg-transparent text-[#85431E] border-[#34150F]/20 hover:border-[#34150F]/40"
                        }`}
                      >
                        <span>Upgrade to B2B</span>
                        <span className="text-[9px] bg-[#D39858] text-[#34150F] px-1.5 py-0.5 rounded font-black">Wholesale</span>
                      </button>
                    </div>

                    {accountType === "b2c" ? (
                      <div className="p-3.5 bg-[#EACEAA]/40 border border-[#34150F]/10 rounded-tr-xl rounded-bl-xl text-xs text-[#85431E] flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-sm">ℹ️</span>
                          <div>
                            <span className="font-bold text-[#34150F]">Retail Account</span>
                            <p className="text-[11px] text-[#85431E]/80 mt-0.5">
                              You are currently on standard retail pricing. Are you a contractor, builder, or business?
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAccountType("b2b")}
                          className="shrink-0 bg-[#34150F] text-[#EACEAA] font-bold text-[11px] px-3 py-1.5 rounded-tr-lg rounded-bl-lg hover:bg-[#D39858] hover:text-[#34150F] transition-all"
                        >
                          Upgrade to B2B →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4 bg-[#34150F]/5 border border-[#D39858]/30 rounded-tr-xl rounded-bl-xl">
                        <div className="flex items-start gap-2 text-xs text-[#34150F]">
                          <Building2 size={15} className="text-[#D39858] mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-extrabold text-[#34150F]">Upgrading to B2B Wholesale Partner</span>
                            <p className="text-[11px] text-[#85431E]/80 mt-0.5">
                              Enter your registered Business Name and 15-character GSTIN below. Upon saving, you will instantly unlock tiered wholesale bulk pricing, custom PDF quotations, and PO submissions.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                              Company / Firm Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Acme Hardware Pvt Ltd"
                                required={accountType === "b2b"}
                                className="w-full bg-white text-[#34150F] placeholder-[#85431E]/40 pl-10 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/15 focus:outline-none focus:border-[#D39858] transition-all"
                              />
                              <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                              GSTIN <span className="text-red-500">*</span>{" "}
                              <span className="text-[#34150F]/40 font-normal">(15 characters)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={gstin}
                                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                                placeholder="27AAAAA0000A1Z5"
                                maxLength={15}
                                required={accountType === "b2b"}
                                className="w-full bg-white text-[#34150F] placeholder-[#85431E]/40 pl-10 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/15 focus:outline-none focus:border-[#D39858] transition-all font-mono"
                              />
                              <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                            </div>
                            {gstin && (() => {
                              const check = validateGstin(gstin);
                              if (check.isValid) {
                                return (
                                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                                    ✓ Valid {check.stateName} GSTIN ({check.entityType})
                                  </p>
                                );
                              }
                              return <p className="text-[10px] text-red-500 mt-1">{check.error}</p>;
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isLoading}
                  className="flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all duration-200 text-sm shadow-md active:scale-95 disabled:opacity-50">
                  <Save size={14} /> {isLoading ? "Saving..." : "Save Profile"}
                </button>
                <button type="button" onClick={() => switchTab("overview")}
                  className="flex items-center gap-2 bg-[#34150F]/10 text-[#34150F] font-bold px-5 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#34150F]/20 transition-all text-sm">
                  <X size={14} /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═══════════════ ADDRESSES ═══════════════ */}
        {activeTab === "addresses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-[#D39858]" /> Saved Addresses
              </h3>
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-sm active:scale-95"
              >
                <Plus size={13} /> Add Address
              </button>
            </div>

            {showAddressForm && (
              <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 sm:p-6 shadow-md border border-[#34150F]/10 space-y-4">
                <div className="flex items-center justify-between border-b border-[#34150F]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-tr-lg rounded-bl-lg bg-[#D39858]/20 flex items-center justify-center text-[#85431E]">
                      {editingAddressId ? <Pencil size={14} /> : <Plus size={14} />}
                    </div>
                    <div>
                      <h4 className="font-black text-[#34150F] text-sm uppercase tracking-wider">
                        {editingAddressId ? "Edit Saved Address" : "Add New Delivery Address"}
                      </h4>
                      <p className="text-[11px] text-[#85431E]/70">
                        {editingAddressId ? "Update your location & contact information" : "Add your location, contact number, and WhatsApp updates"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowAddressForm(false); resetAddressForm(); }}
                    className="text-[#34150F]/50 hover:text-[#34150F] p-1.5 rounded-full hover:bg-[#EACEAA]/30 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Location Quick Tools: GPS & Map Search */}
                <div className="p-3.5 bg-[#EACEAA]/20 rounded-tr-xl rounded-bl-xl border border-[#D39858]/30 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#85431E] flex items-center gap-1.5">
                      <Navigation size={13} className="text-[#D39858]" /> Quick Location Detection
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocatingUser}
                      className="flex items-center gap-1.5 text-xs font-bold bg-[#D39858] text-[#34150F] px-3.5 py-1.5 rounded-tr-lg rounded-bl-lg hover:bg-[#EACEAA] transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <LocateFixed size={13} className={isLocatingUser ? "animate-spin" : ""} />
                      {isLocatingUser ? "Detecting GPS..." : "Use My Current Location"}
                    </button>
                  </div>

                  {/* Location Search Bar */}
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search area, locality, town, landmark as per Google Map..."
                        className="w-full bg-white text-[#34150F] placeholder-[#85431E]/40 pl-8 pr-8 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858] shadow-inner"
                      />
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                      {isSearchingLocation && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#D39858] border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#34150F]/15 rounded-tr-xl rounded-bl-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-[#34150F]/6">
                        {searchResults.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSearchResult(item)}
                            className="w-full text-left px-3 py-2 hover:bg-[#EACEAA]/30 text-xs text-[#34150F] flex items-start gap-2 transition-colors"
                          >
                            <MapPin size={12} className="text-[#D39858] mt-0.5 flex-shrink-0" />
                            <span className="truncate">{item.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {locationError && (
                    <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {locationError}
                    </p>
                  )}
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  {/* Address Label Chips */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                      Address Label
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Home", "Office", "Site / Warehouse", "Other"].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setAddrLabel(lbl)}
                          className={`text-xs px-3.5 py-1.5 font-bold rounded-tr-lg rounded-bl-lg transition-all ${
                            addrLabel === lbl
                              ? "bg-[#34150F] text-[#EACEAA] shadow-sm"
                              : "bg-[#EACEAA]/30 text-[#34150F] hover:bg-[#EACEAA]/60"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                        Address Line 1 (Flat, House No., Building, Street) *
                      </label>
                      <input
                        type="text"
                        value={addrLine1}
                        onChange={(e) => setAddrLine1(e.target.value)}
                        placeholder="e.g. Flat 402, Royal Residency, MG Road"
                        required
                        className="w-full bg-[#EACEAA]/20 text-[#34150F] placeholder-[#85431E]/40 px-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                        Address Line 2 (Area, Landmark, Colony) *
                      </label>
                      <input
                        type="text"
                        value={addrLine2}
                        onChange={(e) => setAddrLine2(e.target.value)}
                        placeholder="e.g. Near Metro Station / Behind Axis Bank"
                        required
                        className="w-full bg-[#EACEAA]/20 text-[#34150F] placeholder-[#85431E]/40 px-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        placeholder="Mumbai / Delhi"
                        required
                        className="w-full bg-[#EACEAA]/20 text-[#34150F] placeholder-[#85431E]/40 px-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        placeholder="Maharashtra / Delhi"
                        required
                        className="w-full bg-[#EACEAA]/20 text-[#34150F] placeholder-[#85431E]/40 px-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                        Pincode / Postal Code *
                      </label>
                      <input
                        type="text"
                        value={addrPincode}
                        onChange={(e) => setAddrPincode(e.target.value)}
                        placeholder="400001"
                        maxLength={6}
                        required
                        className="w-full bg-[#EACEAA]/20 text-[#34150F] placeholder-[#85431E]/40 px-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value="India"
                        disabled
                        className="w-full bg-[#EACEAA]/10 text-[#34150F]/70 px-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/10 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* ── Contact Details with WhatsApp Toggle ── */}
                  <div className="p-4 bg-[#EACEAA]/15 rounded-tr-xl rounded-bl-xl border border-[#34150F]/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-[#D39858]" />
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-[#34150F]">
                        Delivery Contact &amp; Updates
                      </h5>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                          Primary Phone Number *
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={addrPhone}
                            onChange={(e) => setAddrPhone(e.target.value)}
                            placeholder="+91 9876543210"
                            required
                            className="w-full bg-white text-[#34150F] placeholder-[#85431E]/40 pl-8 pr-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                          />
                          <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                          Alternative Phone Number (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={addrAltPhone}
                            onChange={(e) => setAddrAltPhone(e.target.value)}
                            placeholder="+91 9123456780"
                            className="w-full bg-white text-[#34150F] placeholder-[#85431E]/40 pl-8 pr-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                          />
                          <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">
                          Delivery Update Email (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={addrEmail}
                            onChange={(e) => setAddrEmail(e.target.value)}
                            placeholder="customer@example.com"
                            className="w-full bg-white text-[#34150F] placeholder-[#85431E]/40 pl-8 pr-3 py-2 rounded-tr-lg rounded-bl-lg text-xs border border-[#34150F]/15 focus:outline-none focus:border-[#D39858]"
                          />
                          <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Toggle */}
                    <div className="pt-2 border-t border-[#34150F]/10">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={addrHasWhatsapp}
                          onChange={(e) => setAddrHasWhatsapp(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded mt-0.5 border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                            addrHasWhatsapp
                              ? "bg-[#25D366] border-[#25D366]"
                              : "border-[#34150F]/30 group-hover:border-[#25D366]"
                          }`}
                        >
                          {addrHasWhatsapp && <Check size={11} className="text-white stroke-[3]" />}
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-[#34150F] flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[#128C7E] font-extrabold bg-[#25D366]/15 px-1.5 py-0.5 rounded text-[10px]">
                              <MessageSquare size={10} /> WhatsApp Active
                            </span>
                            Receive dispatch alerts &amp; tracking on WhatsApp
                          </span>
                          <p className="text-[11px] text-[#85431E]/70 mt-0.5">
                            Check this if your primary phone number is active on WhatsApp.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Set as Default Address */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addrIsDefault}
                      onChange={(e) => setAddrIsDefault(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                        addrIsDefault ? "bg-[#D39858] border-[#D39858]" : "border-[#34150F]/30"
                      }`}
                    >
                      {addrIsDefault && <Check size={11} className="text-[#34150F] stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold text-[#34150F]">Set as default delivery address</span>
                  </label>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-[#34150F]/10">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-6 py-2.5 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all disabled:opacity-50 shadow-md active:scale-95"
                    >
                      <Save size={13} /> {isLoading ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddressForm(false); resetAddressForm(); }}
                      className="flex items-center gap-2 bg-[#34150F]/10 text-[#34150F] font-bold px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#34150F]/20 transition-all"
                    >
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {addrLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#D39858] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-8 text-center border border-[#34150F]/6 shadow-sm">
                <MapPin size={36} className="text-[#D39858]/40 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#34150F] mb-1">No Saved Addresses</p>
                <p className="text-xs text-[#85431E]/70 mb-4">Add a delivery address for faster checkout &amp; order tracking.</p>
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="inline-flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all"
                >
                  <Plus size={13} /> Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white rounded-tr-2xl rounded-bl-2xl p-4 sm:p-5 border border-[#34150F]/8 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-black uppercase tracking-wider bg-[#34150F] text-[#EACEAA] px-2.5 py-0.5 rounded-tr-md rounded-bl-md">
                            {addr.label || "Home"}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-extrabold bg-[#D39858] text-[#34150F] px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                          {addr.hasWhatsapp && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-[#25D366]/15 text-[#128C7E] px-1.5 py-0.5 rounded">
                              <MessageSquare size={10} /> WhatsApp
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 my-2 text-xs">
                        <p className="font-bold text-[#34150F] leading-snug">
                          {addr.line1 || addr.addressLine1}
                        </p>
                        {(addr.line2 || addr.addressLine2) && (
                          <p className="text-[#85431E]/80">
                            {addr.line2 || addr.addressLine2}
                          </p>
                        )}
                        <p className="text-[#85431E] font-medium">
                          {addr.city}, {addr.state} — {addr.pincode || addr.postalCode}
                        </p>
                      </div>

                      {/* Contact information details */}
                      {(addr.phone || addr.email || addr.altPhone) && (
                        <div className="pt-2 mt-2 border-t border-[#34150F]/6 space-y-1 text-[11px] text-[#85431E]/90">
                          {addr.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone size={11} className="text-[#D39858] flex-shrink-0" />
                              <span className="font-semibold">{addr.phone}</span>
                              {addr.hasWhatsapp && (
                                <span className="text-[10px] text-[#128C7E] font-bold">(WhatsApp)</span>
                              )}
                            </p>
                          )}
                          {addr.altPhone && (
                            <p className="flex items-center gap-1.5 text-[#85431E]/70">
                              <Phone size={11} className="text-[#85431E]/50 flex-shrink-0" />
                              <span>Alt: {addr.altPhone}</span>
                            </p>
                          )}
                          {addr.email && (
                            <p className="flex items-center gap-1.5 text-[#85431E]/70">
                              <Mail size={11} className="text-[#D39858] flex-shrink-0" />
                              <span className="truncate">{addr.email}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-[#34150F]/6">
                      <button
                        type="button"
                        onClick={() => handleEditAddress(addr)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#34150F] hover:text-[#D39858] bg-[#EACEAA]/30 hover:bg-[#EACEAA]/60 px-2.5 py-1 rounded-tr-md rounded-bl-md transition-all"
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-tr-md rounded-bl-md transition-all"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ SECURITY ═══════════════ */}
        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-6 shadow-sm border border-[#34150F]/6">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest mb-5 flex items-center gap-2">
                <Lock size={14} className="text-[#D39858]" /> Change Password
              </h3>
              <div className="mb-4 p-3 bg-[#D39858]/8 border border-[#D39858]/25 rounded-tr-xl rounded-bl-xl text-xs text-[#34150F] flex items-start gap-2">
                <Mail size={13} className="text-[#D39858] mt-0.5 flex-shrink-0" />
                <p>A secure password reset link will be sent to <strong>{user?.email}</strong>.</p>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {[
                  { label: "New Password *", val: newPassword, set: setNewPassword, show: showNewPass, toggle: () => setShowNewPass((p) => !p) },
                  { label: "Confirm New Password *", val: confirmPassword, set: setConfirmPassword, show: showConfirmPass, toggle: () => setShowConfirmPass((p) => !p) },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">{f.label}</label>
                    <div className="relative">
                      <input type={f.show ? "text" : "password"} value={f.val}
                        onChange={(e) => f.set(e.target.value)} required placeholder="••••••••"
                        className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 pl-10 pr-11 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] transition-all" />
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                      <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#85431E]/60 hover:text-[#D39858]">
                        {f.show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
                {newPassword && newPassword.length < 8 && <p className="text-[10px] text-red-500">Password must be at least 8 characters.</p>}
                {confirmPassword && newPassword !== confirmPassword && <p className="text-[10px] text-red-500">Passwords do not match.</p>}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && <p className="text-[10px] text-emerald-600">✓ Passwords match</p>}
                <button type="submit" disabled={isLoading}
                  className="flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all duration-200 text-sm shadow-md active:scale-95 disabled:opacity-50">
                  <Shield size={14} /> {isLoading ? "Sending..." : "Send Password Reset Link"}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-100 rounded-tr-2xl rounded-bl-2xl p-6">
              <h3 className="font-black text-red-700 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle size={14} /> Session Management
              </h3>
              <p className="text-xs text-red-600/75 mb-4">Signing out will clear your session data and tokens from this device.</p>
              <button type="button" onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-tr-xl rounded-bl-xl transition-colors text-xs shadow-sm">
                <LogOut size={13} /> Sign Out of Account
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ ORDERS & PURCHASE ORDERS ═══════════════ */}
        {activeTab === "orders" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <h3 className="font-black text-[#34150F] text-[11px] sm:text-xs uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                <Package size={13} className="text-[#D39858]" /> Orders & Purchase Orders
              </h3>

              {isB2B && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/purchase-orders");
                    }}
                    className="text-[10px] sm:text-[11px] font-bold text-[#85431E] hover:text-[#34150F] flex items-center gap-1 transition-colors"
                  >
                    <span>Full PO Portal</span>
                    <ExternalLink size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/purchase-orders/create");
                    }}
                    className="flex items-center gap-1 bg-[#34150F] text-[#EACEAA] font-bold px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl text-[10px] sm:text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-2xs"
                  >
                    <Plus size={11} />
                    <span>Create PO</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sub-tab Filter Switcher */}
            {(isB2B || purchaseOrders.length > 0) && (
              <div className="flex items-center gap-1 bg-white/70 p-1 rounded-xl border border-[#34150F]/10 w-fit overflow-x-auto no-scrollbar">
                {[
                  { key: "ALL", label: `All (${orders.length + purchaseOrders.length})` },
                  { key: "RETAIL", label: `Retail (${orders.length})` },
                  { key: "PO", label: `PO (${purchaseOrders.length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setOrdersFilter(tab.key as any)}
                    className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                      ordersFilter === tab.key
                        ? "bg-[#34150F] text-[#EACEAA] shadow-2xs"
                        : "text-[#85431E] hover:text-[#34150F]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {ordersLoading ? (
              <div className="flex justify-center py-10 sm:py-16">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-[#D39858] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 && purchaseOrders.length === 0 ? (
              <div className="bg-white rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-6 sm:p-10 text-center border border-[#34150F]/6 shadow-2xs">
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl bg-[#EACEAA]/60 flex items-center justify-center mx-auto mb-3">
                  <Package size={28} className="text-[#D39858]/50" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-[#34150F] mb-1">No Orders or POs Yet</h4>
                <p className="text-[11px] sm:text-xs text-[#85431E] max-w-xs mx-auto mb-4">
                  Your retail orders and commercial purchase orders will appear here.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold px-4 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-xs shadow-2xs active:scale-95"
                  >
                    Shop Now <ChevronRight size={13} />
                  </button>
                  {isB2B && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate("/purchase-orders/create");
                      }}
                      className="inline-flex items-center gap-1.5 bg-[#EACEAA] text-[#34150F] border border-[#34150F]/20 font-bold px-4 py-2 rounded-tr-lg rounded-bl-lg sm:rounded-tr-xl sm:rounded-bl-xl hover:bg-[#D39858] transition-all text-xs"
                    >
                      <Plus size={12} /> Submit PO
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                
                {/* ─── B2B PURCHASE ORDERS ─── */}
                {(ordersFilter === "ALL" || ordersFilter === "PO") && purchaseOrders.length > 0 && (
                  <div className="space-y-2.5">
                    {ordersFilter === "ALL" && (
                      <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs font-black text-[#85431E] uppercase tracking-wider pt-0.5">
                        <FileText size={12} className="text-[#D39858]" />
                        <span>Commercial POs ({purchaseOrders.length})</span>
                      </div>
                    )}
                    {purchaseOrders.map((po) => (
                      <div
                        key={po.id}
                        className="bg-white rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-3.5 sm:p-5 shadow-2xs border border-[#34150F]/10 hover:shadow-xs transition-shadow space-y-2.5"
                      >
                        {/* PO Header */}
                        <div className="flex flex-wrap items-start justify-between gap-1.5 border-b border-[#34150F]/8 pb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase bg-[#34150F] text-[#EACEAA] px-1.5 py-0.2 rounded tracking-wider font-mono">
                                PO
                              </span>
                              <p className="text-xs font-black text-[#34150F] font-mono">
                                {po.poNumber}
                              </p>
                            </div>
                            <p className="text-[10px] text-[#85431E] font-mono mt-0.5">
                              Ref: <span className="font-bold text-[#34150F]">{po.quotationNumber}</span>
                            </p>
                            <p className="text-[9px] text-[#85431E]/70">
                              {new Date(po.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                po.status === "INVOICED"
                                  ? "bg-purple-100 text-purple-800 border-purple-300"
                                  : po.status === "DISPATCHED"
                                  ? "bg-teal-100 text-teal-800 border-teal-300"
                                  : po.status === "PACKING_LIST_GENERATED" || po.status === "PAYMENT_VERIFIED"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : po.status === "PAYMENT_ACKNOWLEDGED"
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : po.status === "PAYMENT_RECEIPT_SUBMITTED"
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : po.status === "REJECTED"
                                  ? "bg-red-100 text-red-800 border-red-300"
                                  : "bg-slate-100 text-slate-800 border-slate-300"
                              }`}
                            >
                              {po.status.replace(/_/g, " ")}
                            </span>
                            {po.dispatch && (
                              <p className="text-[9px] font-bold text-teal-800 mt-0.5 flex items-center justify-end gap-1">
                                <Truck size={10} /> {po.dispatch.carrierName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Financial and Items Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] bg-[#FAF5EE] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#34150F]/6">
                          <div>
                            <span className="text-[9px] text-[#85431E] block">Items</span>
                            <span className="font-bold text-[#34150F]">{po.items?.length || 0} Products</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#85431E] block">Total Amount</span>
                            <span className="font-bold font-mono text-[#34150F]">₹{Number(po.totalAmount).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#85431E] block">Advance ({po.advancePercentage}%)</span>
                            <span className="font-bold font-mono text-[#34150F]">₹{Number(po.advanceAmount).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#85431E] block">Balance Due</span>
                            <span className="font-bold font-mono text-amber-900">₹{Number(po.balanceAmount).toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            {po.packingList && (
                              <AsyncActionButton
                                mode="download"
                                onAction={() => downloadPackingListPdf(po.id, po.poNumber)}
                                idleIcon={<Download size={10} />}
                                idleLabel="Packing List"
                                loadingLabel="…"
                                successLabel="✓"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors"
                                variant="custom"
                              />
                            )}
                            {po.invoice && (
                              <AsyncActionButton
                                mode="download"
                                onAction={() => downloadPoInvoicePdf(po.id, po.invoice?.invoiceNumber)}
                                idleIcon={<Receipt size={10} />}
                                idleLabel="Invoice"
                                loadingLabel="…"
                                successLabel="✓"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-md transition-colors"
                                variant="custom"
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto">
                            {!["DISPATCHED", "INVOICED"].includes(po.status) && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!window.confirm(`Are you sure you want to cancel and delete Purchase Order "${po.poNumber}"?`)) return;
                                  try {
                                    await deletePurchaseOrderApi(po.id);
                                    setPurchaseOrders((prev) => prev.filter((p) => p.id !== po.id));
                                  } catch (err: any) {
                                    alert(err.message || "Failed to delete Purchase Order");
                                  }
                                }}
                                className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                                title="Cancel Purchase Order"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}

                            <AsyncActionButton
                              mode="view"
                              onAction={() => {
                                onClose();
                                navigate(`/purchase-orders/${po.id}`);
                              }}
                              idleLabel="View PO"
                              loadingLabel="Opening…"
                              idleIcon={<ChevronRight size={11} />}
                              className="inline-flex items-center gap-1 bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-[10.5px] px-3 py-1 rounded-lg transition-all shadow-2xs"
                              variant="custom"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ─── STANDARD RETAIL ORDERS ─── */}
                {(ordersFilter === "ALL" || ordersFilter === "RETAIL") && orders.length > 0 && (
                  <div className="space-y-2.5">
                    {ordersFilter === "ALL" && purchaseOrders.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs font-black text-[#85431E] uppercase tracking-wider pt-1.5 border-t border-[#34150F]/10">
                        <Package size={12} className="text-[#D39858]" />
                        <span>Online Orders ({orders.length})</span>
                      </div>
                    )}
                    {orders.map((order: any) => (
                      <div key={order.id || order._id} className="bg-white rounded-tr-xl rounded-bl-xl sm:rounded-tr-2xl sm:rounded-bl-2xl p-3.5 sm:p-5 shadow-2xs border border-[#34150F]/6 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-black text-[#34150F]">
                              Order #{(order.orderNumber || order.id || "—").toString().slice(-8).toUpperCase()}
                            </p>
                            <p className="text-[9.5px] sm:text-[10px] text-[#85431E]">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                : "—"}
                            </p>
                          </div>
                          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600 border-gray-200"
                          }`}>
                            {order.status || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-[#34150F]/5">
                          <p className="text-[10.5px] sm:text-xs text-[#85431E]">
                            {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs sm:text-sm font-black text-[#34150F]">
                            ₹{(order.totalAmount || order.total || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Filter specific empty state */}
                {ordersFilter === "PO" && purchaseOrders.length === 0 && (
                  <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-8 text-center border border-[#34150F]/6">
                    <p className="text-xs font-bold text-[#34150F]">No Purchase Orders found.</p>
                    <p className="text-[11px] text-[#85431E] mt-1">Accept an approved quotation to submit your first PO.</p>
                  </div>
                )}

                {ordersFilter === "RETAIL" && orders.length === 0 && (
                  <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-8 text-center border border-[#34150F]/6">
                    <p className="text-xs font-bold text-[#34150F]">No retail orders placed yet.</p>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* ═══════════════ CART ═══════════════ */}
        {activeTab === "cart" && (() => {
          const cartTotal = cart.reduce((s, i) => s + getEffectivePrice(i, user, i.qty, b2bCache).totalPrice, 0);
          const cartCount = cart.reduce((s, i) => s + i.qty, 0);
          return (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest flex items-center gap-2">
                  <ShoppingCart size={14} className="text-[#D39858]" /> My Cart
                  {cartCount > 0 && (
                    <span className="bg-[#D39858] text-[#34150F] text-[10px] font-black px-2 py-0.5 rounded-full">
                      {cartCount} item{cartCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </h3>
                {cart.length > 0 && (
                  <p className="text-xs font-bold text-[#34150F]">
                    Subtotal: <span className="text-[#D39858]">₹{cartTotal.toLocaleString("en-IN")}</span>
                  </p>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-10 text-center border border-[#34150F]/6 shadow-sm">
                  <div className="w-20 h-20 rounded-tr-2xl rounded-bl-2xl bg-[#EACEAA]/60 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart size={36} className="text-[#D39858]/50" />
                  </div>
                  <h4 className="text-sm font-black text-[#34150F] mb-2">Your Cart is Empty</h4>
                  <p className="text-xs text-[#85431E] max-w-xs mx-auto mb-5">
                    Browse our collection and add items to your cart.
                  </p>
                  <button type="button" onClick={onClose}
                    className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-sm shadow-md active:scale-95">
                    Shop Now <ChevronRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-white rounded-tr-2xl rounded-bl-2xl p-4 border border-[#34150F]/6 shadow-sm flex gap-4 items-start">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-tr-xl rounded-bl-xl flex-shrink-0 border border-[#34150F]/8"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-xs font-black text-[#34150F] leading-tight">{item.name}</h4>
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 p-0.5"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {item.category && (
                          <p className="text-[10px] text-[#85431E]/70 mb-2 uppercase tracking-wider">{item.category}</p>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          {/* Qty controls */}
                          <div className="flex items-center gap-2 bg-[#EACEAA]/50 rounded-tr-lg rounded-bl-lg px-2 py-1">
                            <button
                              type="button"
                              onClick={() => onChangeQty(item.id, -1)}
                              className="w-5 h-5 rounded-full bg-[#34150F]/12 hover:bg-[#34150F]/25 flex items-center justify-center transition-colors"
                            >
                              <Minus size={11} className="text-[#34150F]" />
                            </button>
                            <span className="text-xs font-black text-[#34150F] w-5 text-center">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => onChangeQty(item.id, 1)}
                              className="w-5 h-5 rounded-full bg-[#34150F]/12 hover:bg-[#34150F]/25 flex items-center justify-center transition-colors"
                            >
                              <Plus size={11} className="text-[#34150F]" />
                            </button>
                          </div>
                          {/* Line total */}
                          {(() => {
                            const eff = getEffectivePrice(item, user, item.qty, b2bCache);
                            return (
                              <div className="text-right">
                                {eff.originalPrice > eff.unitPrice && (
                                  <p className="text-[10px] text-[#85431E]/50 line-through">₹{(eff.originalPrice * item.qty).toLocaleString("en-IN")}</p>
                                )}
                                <p className="text-sm font-black text-[#34150F]">₹{eff.totalPrice.toLocaleString("en-IN")}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Cart Summary */}
                  <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 border border-[#34150F]/6 shadow-sm">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#85431E] font-semibold">Subtotal ({cartCount} items)</span>
                        <span className="text-[#34150F] font-bold">₹{cartTotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#85431E] font-semibold">Shipping</span>
                        <span className="text-emerald-600 font-bold">Calculated at checkout</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#85431E] font-semibold">GST{isB2B ? " (B2B Invoice)" : ""}</span>
                        <span className="text-[#34150F] font-bold">Applicable</span>
                      </div>
                      <div className="border-t border-[#34150F]/8 pt-2 flex justify-between">
                        <span className="text-sm font-black text-[#34150F]">Estimated Total</span>
                        <span className="text-sm font-black text-[#D39858]">₹{cartTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full bg-[#34150F] text-[#EACEAA] font-black py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all duration-200 text-sm shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={15} /> Proceed to Checkout
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full mt-2 text-xs font-bold text-[#85431E] hover:text-[#34150F] transition-colors py-1"
                    >
                      ← Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════════════ WISHLIST ═══════════════ */}
        {activeTab === "wishlist" && (() => {
          const wishlistedItems = ALL_PRODUCTS.filter((p) => wishlist.has(p.id));
          return (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest flex items-center gap-2">
                  <Heart size={14} className="text-red-500 fill-red-500" /> My Wishlist
                  {wishlist.size > 0 && (
                    <span className="bg-[#D39858] text-[#34150F] text-[10px] font-black px-2 py-0.5 rounded-full">
                      {wishlist.size} item{wishlist.size !== 1 ? "s" : ""}
                    </span>
                  )}
                </h3>
              </div>

              {wishlistedItems.length === 0 ? (
                <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-10 text-center border border-[#34150F]/6 shadow-sm">
                  <div className="w-20 h-20 rounded-tr-2xl rounded-bl-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                    <Heart size={36} className="text-red-400 fill-red-200" />
                  </div>
                  <h4 className="text-sm font-black text-[#34150F] mb-2">Your Wishlist is Empty</h4>
                  <p className="text-xs text-[#85431E] max-w-xs mx-auto mb-5">
                    Save your favorite products to your wishlist while shopping so you can easily find them later.
                  </p>
                  <button type="button" onClick={onClose}
                    className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-sm shadow-md active:scale-95">
                    Explore Products <ChevronRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistedItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-tr-2xl rounded-bl-2xl p-4 border border-[#34150F]/6 shadow-sm flex flex-col justify-between">
                      <div className="flex gap-4 items-start mb-3">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-tr-xl rounded-bl-xl flex-shrink-0 border border-[#34150F]/8"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-black text-[#34150F] leading-tight mb-1">{item.name}</h4>
                            <button
                              type="button"
                              onClick={() => onToggleWishlist(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Remove from wishlist"
                            >
                              <Heart size={16} className="fill-red-500" />
                            </button>
                          </div>
                          {item.category && (
                            <span className="inline-block text-[9px] font-bold bg-[#EACEAA]/40 text-[#85431E] px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                              {item.category}
                            </span>
                          )}
                          {(() => {
                            const eff = getEffectivePrice(item, user, 1, b2bCache);
                            const discount = eff.isB2B
                              ? eff.b2bDiscountPercent
                              : eff.originalPrice > eff.unitPrice
                              ? Math.round(((eff.originalPrice - eff.unitPrice) / eff.originalPrice) * 100)
                              : item.discount || 0;
                            return (
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-black text-[#34150F]">₹{eff.unitPrice.toLocaleString("en-IN")}</span>
                                {eff.originalPrice > eff.unitPrice && (
                                  <span className="text-[10px] text-[#85431E]/50 line-through">₹{eff.originalPrice.toLocaleString("en-IN")}</span>
                                )}
                                {eff.isB2B ? (
                                  <span className="text-[9px] font-black text-[#34150F] bg-[#D39858] px-1.5 py-0.5 rounded shadow-xs uppercase">
                                    B2B {discount}% OFF
                                  </span>
                                ) : discount > 0 ? (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {discount}% OFF
                                  </span>
                                ) : null}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddToCart(item)}
                        className="w-full bg-[#34150F] text-[#EACEAA] hover:bg-[#D39858] hover:text-[#34150F] font-bold py-2 px-4 rounded-tr-xl rounded-bl-xl transition-all duration-200 text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95"
                      >
                        <ShoppingCart size={14} /> Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════════════ NOTIFICATIONS ═══════════════ */}
        {activeTab === "notifications" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest flex items-center gap-2">
                <Bell size={14} className="text-[#D39858]" /> Notifications
              </h3>
              {notifications.some((n) => !n.isRead) && (
                <button
                  type="button"
                  onClick={async () => {
                    await fetchApi("/notifications/read-all", { method: "PATCH" });
                    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                  }}
                  className="text-xs font-bold text-[#85431E] hover:text-[#D39858] transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-tr-2xl rounded-bl-2xl p-4 flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-tr-lg rounded-bl-lg bg-[#34150F]/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-[#34150F]/10 rounded w-3/4" />
                      <div className="h-3 bg-[#34150F]/10 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-10 text-center border border-[#34150F]/6 shadow-sm">
                <div className="w-16 h-16 rounded-tr-2xl rounded-bl-2xl bg-[#EACEAA]/60 flex items-center justify-center mx-auto mb-4">
                  <Bell size={28} className="text-[#D39858]/50" />
                </div>
                <h4 className="text-sm font-black text-[#34150F] mb-1">All caught up!</h4>
                <p className="text-xs text-[#85431E]">No notifications right now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`flex gap-3 p-4 rounded-tr-2xl rounded-bl-2xl border transition-all ${
                      notif.isRead
                        ? "bg-white border-[#34150F]/6"
                        : "bg-[#D39858]/5 border-l-4 border-l-[#D39858] border-[#34150F]/6 shadow-sm"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-tr-lg rounded-bl-lg bg-[#34150F]/8 flex items-center justify-center flex-shrink-0">
                      <Bell size={16} className="text-[#85431E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold text-[#34150F] ${!notif.isRead ? "font-extrabold" : ""}`}>{notif.title}</p>
                      <p className="text-[11px] text-[#85431E] mt-0.5">{notif.message}</p>
                      <span className="text-[10px] text-[#85431E]/50 mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={async () => {
                          await fetchApi(`/notifications/${notif.id}/read`, { method: "PATCH" });
                          setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
                        }}
                        className="text-[#85431E] hover:text-[#D39858] transition-colors flex-shrink-0"
                        title="Mark as read"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ MY REVIEWS ═══════════════ */}
        {activeTab === "reviews" && (
          <div>
            <div className="mb-5">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest flex items-center gap-2">
                <Star size={14} className="text-[#D39858] fill-[#D39858]" /> My Reviews
              </h3>
            </div>
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 animate-pulse space-y-3">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-[#34150F]/10 rounded-tr-xl rounded-bl-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-[#34150F]/10 rounded w-3/4" />
                        <div className="h-3 bg-[#34150F]/10 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : myReviews.length === 0 ? (
              <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-10 text-center border border-[#34150F]/6 shadow-sm">
                <div className="w-16 h-16 rounded-tr-2xl rounded-bl-2xl bg-[#EACEAA]/60 flex items-center justify-center mx-auto mb-4">
                  <Star size={28} className="text-[#D39858]/50" />
                </div>
                <h4 className="text-sm font-black text-[#34150F] mb-1">No reviews yet</h4>
                <p className="text-xs text-[#85431E]">Share your experience — write a review on any product you've purchased.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myReviews.map((review: any) => (
                  <div key={review.id} className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 border border-[#34150F]/6 shadow-sm">
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-xs font-black text-[#34150F] mb-1">{review.productName || "Product"}</p>
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= review.rating ? "#D39858" : "none"}
                              stroke={s <= review.rating ? "#D39858" : "#85431E"}
                              strokeWidth={1.5}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-[#34150F]">{review.title}</p>
                        <p className="text-[11px] text-[#85431E] mt-1 leading-relaxed">{review.comment}</p>
                      </div>
                      <span className={`h-fit text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        review.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : review.status === "REJECTED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {review.status || "Pending"}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#85431E]/50">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

