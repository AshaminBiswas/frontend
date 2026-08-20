import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  User, Mail, Phone, Building2, FileText, Shield,
  Edit3, Save, X, LogOut, ChevronRight, Package,
  Heart, Bell, Star, CheckCircle2, AlertCircle,
  Lock, Eye, EyeOff, ArrowLeft, MapPin, Plus, Trash2,
  ShoppingCart, Minus, Truck, Download, Receipt, ExternalLink,
  FileSpreadsheet, Upload,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { fetchApi } from "../../services/api";
import { CartItem, Product } from "../../types";
import { SUPER_SAVER_PRODUCTS, VALUE_MONEY_PRODUCTS, BEST_SELLER_PRODUCTS } from "../../data/products";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { B2BQuotationManager } from "../b2b/B2BQuotationManager";
import { isB2BUser, getEffectivePrice } from "../../utils/pricing";
import { useB2BPricing } from "../../hooks/useB2BPricing";
import {
  CustomerPurchaseOrder,
  getCustomerPurchaseOrdersApi,
  downloadPackingListPdf,
  downloadPoInvoicePdf,
  deletePurchaseOrderApi,
} from "../../services/poService";
import {
  CustomerPoSubmission,
  getMyPoSubmissionsApi,
  downloadAcknowledgementApi,
} from "../../services/poSubmissionsService";
import { AsyncActionButton } from "../common/AsyncActionButton";

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

type ProfileTab = "overview" | "edit" | "quotes" | "po" | "security" | "orders" | "addresses" | "cart" | "wishlist" | "notifications" | "reviews";

interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
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
    if (tabParam && ["overview", "edit", "quotes", "po", "orders", "addresses", "cart", "wishlist", "notifications", "reviews", "security"].includes(tabParam)) {
      return tabParam;
    }
    return "overview";
  });

  useEffect(() => {
    if (tabParam && ["overview", "edit", "quotes", "po", "orders", "addresses", "cart", "wishlist", "notifications", "reviews", "security"].includes(tabParam)) {
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

  /* ── PO Submissions (Intake) ── */
  const [poSubmissions, setPoSubmissions] = useState<CustomerPoSubmission[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poFilter, setPoFilter] = useState<string>("ALL");
  const [poSearch, setPoSearch] = useState<string>("");

  /* ── Orders & Purchase Orders ── */
  const [orders, setOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<CustomerPurchaseOrder[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<"ALL" | "RETAIL" | "PO">("ALL");
  const [ordersLoading, setOrdersLoading] = useState(false);

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
  const [addrLabel, setAddrLabel] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");

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
    if (activeTab !== "orders") return;
    setOrdersLoading(true);

    Promise.all([
      fetchApi("/orders/my").then((res) => {
        if (res.success && Array.isArray(res.data)) return res.data;
        if (res.success && res.data?.orders) return res.data.orders;
        return [];
      }).catch(() => []),
      getCustomerPurchaseOrdersApi().then((res) => res.items || []).catch(() => []),
    ]).then(([fetchedOrders, fetchedPos]) => {
      setOrders(fetchedOrders);
      setPurchaseOrders(fetchedPos);
    }).finally(() => {
      setOrdersLoading(false);
    });
  }, [activeTab]);

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
    if (!phone.trim()) { setErrorMsg("Phone number is required."); return; }
    if (accountType === "b2b") {
      if (!companyName.trim()) { setErrorMsg("Company / Firm Name is required for B2B accounts."); return; }
      if (!gstin.trim()) { setErrorMsg("GSTIN is required for B2B accounts."); return; }
      if (gstin.trim().length !== 15) { setErrorMsg("GSTIN must be exactly 15 characters."); return; }
    }
    setIsLoading(true);
    const res = await updateUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      // If B2C, explicitly clear any existing business fields
      companyName: accountType === "b2b" ? companyName.trim() : "",
      gstin: accountType === "b2b" ? gstin.trim() : "",
    });
    setIsLoading(false);
    if (res.success) { setSuccessMsg("Profile updated successfully!"); setTimeout(clearFeedback, 4000); }
    else { setErrorMsg(res.message || "Failed to update profile."); }
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

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsLoading(true);
    const res = await fetchApi("/users/addresses", {
      method: "POST",
      body: JSON.stringify({ label: addrLabel, line1: addrLine1, city: addrCity, state: addrState, pincode: addrPincode }),
    });
    setIsLoading(false);
    if (res.success) {
      setShowAddressForm(false);
      setAddrLabel(""); setAddrLine1(""); setAddrCity(""); setAddrState(""); setAddrPincode("");
      const fresh = await fetchApi("/users/addresses");
      if (fresh.success && Array.isArray(fresh.data)) setAddresses(fresh.data);
    } else {
      setErrorMsg(res.error?.message || "Failed to add address.");
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

  // Fetch PO Submissions when tab selected or on overview (B2B only)
  useEffect(() => {
    if (!isB2B) return;
    if (activeTab !== "po" && activeTab !== "overview") return;
    setPoLoading(true);
    getMyPoSubmissionsApi()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setPoSubmissions(res.data);
        else setPoSubmissions([]);
      })
      .catch(() => setPoSubmissions([]))
      .finally(() => setPoLoading(false));
  }, [activeTab, isB2B]);

  const TABS: { key: ProfileTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <User size={15} /> },
    { key: "edit", label: "Edit Profile", icon: <Edit3 size={15} /> },
    ...(isB2B
      ? [
          { key: "po" as ProfileTab, label: "Purchase Orders (PO)", icon: <FileSpreadsheet size={15} />, badge: poSubmissions.length },
          { key: "quotes" as ProfileTab, label: "My Quotations", icon: <FileText size={15} /> },
        ]
      : []),
    { key: "orders", label: "My Orders", icon: <Package size={15} /> },
    { key: "cart", label: "My Cart", icon: <ShoppingCart size={15} />, badge: cart.reduce((s, i) => s + i.qty, 0) },
    { key: "wishlist", label: "Wishlist", icon: <Heart size={15} />, badge: wishlist.size },
    { key: "addresses", label: "Addresses", icon: <MapPin size={15} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={15} /> },
    { key: "reviews", label: "My Reviews", icon: <Star size={15} /> },
    { key: "security", label: "Security", icon: <Shield size={15} /> },
  ];

  /* ── PO Filtered List Helper ── */
  const filteredPoSubmissions = poSubmissions.filter((po) => {
    if (poFilter !== "ALL" && po.status !== poFilter) return false;
    if (poSearch.trim()) {
      const q = poSearch.toLowerCase();
      return (
        po.customerPoNumber.toLowerCase().includes(q) ||
        po.submissionNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

      <div className="relative max-w-5xl mx-auto px-4 py-8 pb-16">

        {/* Back button */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 text-[#85431E] hover:text-[#34150F] font-bold text-sm mb-8 transition-colors group"
        >
          <ArrowLeft size={17} className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Back to Store</span>
        </button>

        {/* ── HERO CARD ── */}
        <div className="relative bg-gradient-to-br from-[#34150F] via-[#4a1e0d] to-[#6b2f12] rounded-tr-3xl rounded-bl-3xl p-6 md:p-8 mb-6 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
            <div className="absolute top-3 right-8 w-40 h-40 rounded-full border-4 border-[#EACEAA]" />
            <div className="absolute bottom-3 right-24 w-24 h-24 rounded-full border-2 border-[#EACEAA]" />
            <div className="absolute top-20 right-4 w-14 h-14 rounded-full border-2 border-[#EACEAA]" />
          </div>

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-tr-2xl rounded-bl-2xl bg-gradient-to-br from-[#D39858] to-[#85431E] flex items-center justify-center shadow-2xl border-4 border-[#EACEAA]/20">
                <span className="text-[#34150F] font-black text-3xl md:text-4xl" style={{ fontFamily: "'Gilda Display', serif" }}>
                  {getInitials()}
                </span>
              </div>
              {user?.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-2 border-[#34150F] flex items-center justify-center shadow">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              )}
            </div>

            {/* Identity Info */}
            <div className="flex-1 min-w-0">
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
              className="flex items-center gap-2 text-red-300 hover:text-red-100 bg-red-900/30 hover:bg-red-900/60 border border-red-500/30 px-4 py-2 rounded-tr-xl rounded-bl-xl transition-all duration-200 text-xs font-bold flex-shrink-0"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-tr-xl rounded-bl-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === t.key
                  ? "bg-[#34150F] text-[#EACEAA] shadow-lg"
                  : "bg-white/70 text-[#85431E] hover:bg-white border border-[#34150F]/10"
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`ml-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => switchTab("po")}
                      className="flex items-center justify-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold text-xs py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#85431E] transition-all shadow-xs"
                    >
                      <FileSpreadsheet size={13} /> Purchase Orders (PO) →
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTab("quotes")}
                      className="flex items-center justify-center gap-1.5 bg-[#EACEAA] text-[#34150F] border border-[#34150F]/20 font-bold text-xs py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] transition-all shadow-xs"
                    >
                      <FileText size={13} /> Quotations →
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
                  ...(isB2B ? [
                    { icon: <FileSpreadsheet size={13} />, label: "My Purchase Orders (PO)", action: () => switchTab("po") },
                    { icon: <FileText size={13} />, label: "My Project Quotations", action: () => switchTab("quotes") },
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

        {/* ═══════════════ PURCHASE ORDERS (PO INTAKE & STATUS - B2B ONLY) ═══════════════ */}
        {activeTab === "po" && (
          !isB2B ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#34150F]/10 shadow-sm text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#EACEAA]/60 flex items-center justify-center mx-auto text-[#34150F]">
                <FileSpreadsheet size={32} className="text-[#D39858]" />
              </div>
              <h3 className="text-xl font-black text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                B2B Purchase Orders (Exclusive)
              </h3>
              <p className="text-xs text-[#85431E] leading-relaxed">
                Purchase Order submission, catalog mapping, and official Order Acknowledgements are exclusive features for our B2B commercial & wholesale partners.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => switchTab("edit")}
                  className="inline-flex items-center gap-2 bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl transition-all shadow-md"
                >
                  <Building2 size={15} />
                  <span>Add Business Details to Activate</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#34150F]/10 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D39858] uppercase tracking-wider">
                  <FileSpreadsheet size={14} />
                  <span>Purchase Order Intake & Acknowledgements</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#34150F] mt-1" style={{ fontFamily: "'Gilda Display', serif" }}>
                  Purchase Orders
                </h2>
                <p className="text-xs text-[#85431E] mt-0.5">
                  Submit native ERP purchase order PDFs (SAP, Tally, Zoho) or structured forms, track engineering SKU mapping, and download formal Order Acknowledgements.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/po-submissions");
                  }}
                  className="bg-[#EACEAA]/40 hover:bg-[#D39858]/30 text-[#34150F] font-bold text-xs px-4 py-3 rounded-xl transition-all border border-[#34150F]/15 flex items-center gap-2"
                >
                  <ExternalLink size={15} />
                  <span>Full PO Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/po-submissions/new");
                  }}
                  className="bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={15} />
                  <span>+ Submit Purchase Order</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-[#34150F]/10 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#85431E]">Total Submissions</span>
                <p className="text-xl font-black text-[#34150F] mt-1">{poSubmissions.length}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#34150F]/10 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-amber-700">Under Review</span>
                <p className="text-xl font-black text-amber-700 mt-1">
                  {poSubmissions.filter((p) => p.status === "SUBMITTED" || p.status === "UNDER_REVIEW").length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#34150F]/10 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Approved</span>
                <p className="text-xl font-black text-emerald-700 mt-1">
                  {poSubmissions.filter((p) => p.status === "APPROVED").length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#34150F]/10 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-teal-700">Acknowledged</span>
                <p className="text-xl font-black text-teal-700 mt-1">
                  {poSubmissions.filter((p) => p.status === "ACKNOWLEDGED").length}
                </p>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Search by PO # or Ref..."
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#34150F]/15 rounded-xl text-xs text-[#34150F] focus:outline-none focus:border-[#D39858]"
                />
                <FileSpreadsheet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#85431E]/60" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: "ALL", label: "All" },
                  { key: "SUBMITTED", label: "Under Review" },
                  { key: "CHANGES_REQUESTED", label: "Action Required" },
                  { key: "APPROVED", label: "Approved" },
                  { key: "ACKNOWLEDGED", label: "Acknowledged" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setPoFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      poFilter === f.key
                        ? "bg-[#34150F] text-[#EACEAA] shadow-sm"
                        : "bg-white text-[#85431E] border border-[#34150F]/10 hover:border-[#D39858]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions List */}
            {poLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#34150F]/10">
                <div className="w-8 h-8 border-2 border-[#D39858] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#85431E]">Loading your purchase orders...</p>
              </div>
            ) : filteredPoSubmissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#34150F]/10 space-y-3">
                <FileSpreadsheet size={40} className="text-[#D39858]/40 mx-auto" />
                <h4 className="text-base font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
                  No Purchase Orders Found
                </h4>
                <p className="text-xs text-[#85431E] max-w-sm mx-auto">
                  {poFilter !== "ALL" || poSearch
                    ? "No submissions match your search/filter criteria."
                    : "Upload your existing ERP PO PDF or fill out our structured form."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/po-submissions/new");
                  }}
                  className="inline-flex items-center gap-1.5 bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-5 py-2.5 rounded-tr-xl rounded-bl-xl transition-all shadow-sm"
                >
                  <Plus size={14} />
                  <span>Submit Purchase Order</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredPoSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 border border-[#34150F]/10 hover:border-[#D39858] shadow-sm transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-[#34150F] bg-[#EACEAA]/70 px-2.5 py-0.5 rounded-lg">
                          {sub.submissionNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          sub.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          sub.status === 'ACKNOWLEDGED' ? 'bg-teal-50 text-teal-800 border-teal-300' :
                          sub.status === 'CHANGES_REQUESTED' ? 'bg-orange-50 text-orange-800 border-orange-300' :
                          sub.status === 'REJECTED' ? 'bg-red-50 text-red-800 border-red-300' :
                          'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {sub.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[#85431E] uppercase">PO Number</span>
                        <h4 className="text-sm font-black text-[#34150F] truncate">{sub.customerPoNumber}</h4>
                      </div>

                      <div className="p-2.5 bg-[#FAF5EE] rounded-xl text-xs space-y-1 text-[#85431E]">
                        <div className="flex justify-between">
                          <span className="text-[11px]">Mode:</span>
                          <span className="font-bold text-[#34150F]">{sub.sourceType === 'PDF_UPLOAD' ? 'PDF Upload' : 'Structured Form'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[11px]">Order Value:</span>
                          <span className="font-mono font-bold text-[#34150F]">
                            {sub.mappedTotal
                              ? `₹${Number(sub.mappedTotal).toLocaleString('en-IN')}`
                              : sub.statedTotal
                              ? `₹${Number(sub.statedTotal).toLocaleString('en-IN')}`
                              : 'Under Review'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[11px]">Submitted:</span>
                          <span className="font-medium text-[#34150F]">
                            {new Date(sub.submittedAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#34150F]/10 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate(`/po-submissions/${sub.id}`);
                        }}
                        className="text-xs font-bold text-[#34150F] hover:text-[#D39858] inline-flex items-center gap-1"
                      >
                        <span>View Timeline</span>
                        <ChevronRight size={14} />
                      </button>

                      {sub.acknowledgement && (
                        <AsyncActionButton
                          mode="download"
                          idleLabel="Ack PDF"
                          loadingLabel="..."
                          successLabel="✓"
                          variant="custom"
                          size="sm"
                          className="px-2.5 py-1 bg-[#34150F] hover:bg-[#D39858] hover:text-[#34150F] text-[#EACEAA] font-bold text-[11px] rounded-lg transition-colors"
                          onAction={async () => {
                            await downloadAcknowledgementApi(sub.id, sub.acknowledgement!.ackNumber);
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* ═══════════════ B2B QUOTATIONS (EXCLUSIVE) ═══════════════ */}
        {activeTab === "quotes" && (
          <B2BQuotationManager onGoToProfileEdit={() => switchTab("edit")} />
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
                <p className="text-[10px] font-bold text-[#85431E] uppercase tracking-wider mb-3">Account Type</p>

                {/* B2C / B2B Toggle */}
                <div className="flex gap-2 mb-4">
                  {(["b2c", "b2b"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setAccountType(type);
                        // Clear B2B fields when switching to B2C
                        if (type === "b2c") { setCompanyName(""); setGstin(""); }
                      }}
                      className={`flex-1 py-2 rounded-tr-xl rounded-bl-xl text-xs font-black uppercase tracking-wider border-2 transition-all duration-200 ${
                        accountType === type
                          ? type === "b2b"
                            ? "bg-[#34150F] text-[#EACEAA] border-[#34150F] shadow-md"
                            : "bg-[#D39858] text-[#34150F] border-[#D39858] shadow-md"
                          : "bg-transparent text-[#85431E] border-[#34150F]/20 hover:border-[#34150F]/40"
                      }`}
                    >
                      {type === "b2c" ? "B2C — Personal / Retail" : "B2B — Business / Wholesale"}
                    </button>
                  ))}
                </div>

                {/* B2C Info Banner */}
                {accountType === "b2c" && (
                  <div className="p-3 bg-[#EACEAA]/40 border border-[#34150F]/10 rounded-tr-xl rounded-bl-xl text-xs text-[#85431E] flex items-start gap-2">
                    <span className="mt-0.5">ℹ️</span>
                    <span>B2C accounts purchase at standard retail pricing. No company details required.</span>
                  </div>
                )}

                {/* B2B Fields — only shown & required when B2B selected */}
                {accountType === "b2b" && (
                  <div className="space-y-4">
                    <div className="p-3 bg-[#34150F]/6 border border-[#34150F]/12 rounded-tr-xl rounded-bl-xl text-xs text-[#34150F] flex items-start gap-2">
                      <Building2 size={13} className="text-[#D39858] mt-0.5 flex-shrink-0" />
                      <span>B2B accounts get bulk pricing and GST invoices. Company name and GSTIN are <strong>required</strong>.</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                        Company / Firm Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Acme Hardware Pvt Ltd" required={accountType === "b2b"}
                          className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 pl-10 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] focus:bg-[#EACEAA]/50 transition-all" />
                        <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1.5">
                        GSTIN <span className="text-red-500">*</span>{" "}
                        <span className="text-[#34150F]/40 font-normal">(15 characters)</span>
                      </label>
                      <div className="relative">
                        <input type="text" value={gstin}
                          onChange={(e) => setGstin(e.target.value.toUpperCase())}
                          placeholder="27AAAAA0000A1Z5" maxLength={15} required={accountType === "b2b"}
                          className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 pl-10 pr-4 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] focus:bg-[#EACEAA]/50 transition-all font-mono" />
                        <FileText size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D39858]" />
                      </div>
                      {gstin && gstin.length !== 15 && <p className="text-[10px] text-red-500 mt-1">{gstin.length}/15 characters entered</p>}
                      {gstin && gstin.length === 15 && <p className="text-[10px] text-emerald-600 mt-1">✓ Valid GSTIN length</p>}
                    </div>
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
              <button type="button" onClick={() => setShowAddressForm(!showAddressForm)}
                className="flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-sm">
                <Plus size={13} /> Add Address
              </button>
            </div>

            {showAddressForm && (
              <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 shadow-sm border border-[#34150F]/6">
                <h4 className="font-black text-[#34150F] text-xs uppercase tracking-widest mb-4">New Address</h4>
                <form onSubmit={handleAddAddress} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Label (e.g. Home)", val: addrLabel, set: setAddrLabel, ph: "Home / Office" },
                      { label: "Address Line", val: addrLine1, set: setAddrLine1, ph: "123, MG Road" },
                      { label: "City", val: addrCity, set: setAddrCity, ph: "Mumbai" },
                      { label: "State", val: addrState, set: setAddrState, ph: "Maharashtra" },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">{f.label}</label>
                        <input type="text" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} required
                          className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 px-3 py-2 rounded-tr-lg rounded-bl-lg text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] transition-all" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#85431E] mb-1">Pincode</label>
                      <input type="text" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value)} placeholder="400001" maxLength={6} required
                        className="w-full bg-[#EACEAA]/30 text-[#34150F] placeholder-[#85431E]/40 px-3 py-2 rounded-tr-lg rounded-bl-lg text-sm border border-[#34150F]/12 focus:outline-none focus:border-[#D39858] transition-all" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={isLoading}
                      className="flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-5 py-2 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all disabled:opacity-50">
                      <Save size={13} /> {isLoading ? "Saving..." : "Save Address"}
                    </button>
                    <button type="button" onClick={() => setShowAddressForm(false)}
                      className="flex items-center gap-2 bg-[#34150F]/10 text-[#34150F] font-bold px-4 py-2 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#34150F]/20 transition-all">
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
                <p className="text-xs text-[#85431E]/70">Add a delivery address for faster checkout.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="bg-white rounded-tr-2xl rounded-bl-2xl p-4 border border-[#34150F]/6 shadow-sm relative">
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-[#D39858] text-[#34150F] px-2 py-0.5 rounded-full">Default</span>
                    )}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-tr-lg rounded-bl-lg bg-[#EACEAA]/60 flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-[#D39858]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-[#34150F] uppercase tracking-wider mb-0.5">{addr.label}</p>
                        <p className="text-xs text-[#85431E]">{addr.line1}</p>
                        <p className="text-xs text-[#85431E]">{addr.city}, {addr.state} — {addr.pincode}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeleteAddress(addr.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 size={11} /> Delete
                    </button>
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
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black text-[#34150F] text-xs uppercase tracking-widest flex items-center gap-2">
                <Package size={14} className="text-[#D39858]" /> Orders & Purchase Orders
              </h3>

              {isB2B && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/purchase-orders");
                    }}
                    className="text-[11px] font-bold text-[#85431E] hover:text-[#34150F] flex items-center gap-1 transition-colors"
                  >
                    <span>Full PO Portal</span>
                    <ExternalLink size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate("/purchase-orders/create");
                    }}
                    className="flex items-center gap-1.5 bg-[#34150F] text-[#EACEAA] font-bold px-3.5 py-1.5 rounded-tr-xl rounded-bl-xl text-xs hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-sm"
                  >
                    <Plus size={13} />
                    <span>Create New PO</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sub-tab Filter Switcher (if user is B2B or has any POs) */}
            {(isB2B || purchaseOrders.length > 0) && (
              <div className="flex items-center gap-2 bg-white/70 p-1.5 rounded-2xl border border-[#34150F]/10 w-fit">
                {[
                  { key: "ALL", label: `All (${orders.length + purchaseOrders.length})` },
                  { key: "RETAIL", label: `Retail Orders (${orders.length})` },
                  { key: "PO", label: `B2B Purchase Orders (${purchaseOrders.length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setOrdersFilter(tab.key as any)}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${
                      ordersFilter === tab.key
                        ? "bg-[#34150F] text-[#EACEAA] shadow-sm"
                        : "text-[#85431E] hover:text-[#34150F]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {ordersLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#D39858] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 && purchaseOrders.length === 0 ? (
              <div className="bg-white rounded-tr-2xl rounded-bl-2xl p-10 text-center border border-[#34150F]/6 shadow-sm">
                <div className="w-20 h-20 rounded-tr-2xl rounded-bl-2xl bg-[#EACEAA]/60 flex items-center justify-center mx-auto mb-4">
                  <Package size={36} className="text-[#D39858]/50" />
                </div>
                <h4 className="text-sm font-black text-[#34150F] mb-2">No Orders or POs Yet</h4>
                <p className="text-xs text-[#85431E] max-w-xs mx-auto mb-5">
                  Your standard retail orders and B2B purchase orders will appear here.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 bg-[#34150F] text-[#EACEAA] font-bold px-6 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all text-sm shadow-md active:scale-95"
                  >
                    Shop Now <ChevronRight size={15} />
                  </button>
                  {isB2B && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate("/purchase-orders/create");
                      }}
                      className="inline-flex items-center gap-2 bg-[#EACEAA] text-[#34150F] border border-[#34150F]/20 font-bold px-5 py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] transition-all text-sm"
                    >
                      <Plus size={14} /> Submit PO
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* ─── B2B PURCHASE ORDERS ─── */}
                {(ordersFilter === "ALL" || ordersFilter === "PO") && purchaseOrders.length > 0 && (
                  <div className="space-y-3">
                    {ordersFilter === "ALL" && (
                      <div className="flex items-center gap-2 text-xs font-black text-[#85431E] uppercase tracking-wider pt-1">
                        <FileText size={13} className="text-[#D39858]" />
                        <span>B2B Commercial Purchase Orders ({purchaseOrders.length})</span>
                      </div>
                    )}
                    {purchaseOrders.map((po) => (
                      <div
                        key={po.id}
                        className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 shadow-sm border border-[#34150F]/10 hover:shadow-md transition-shadow space-y-3"
                      >
                        {/* PO Header */}
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#34150F]/8 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase bg-[#34150F] text-[#EACEAA] px-2 py-0.5 rounded tracking-wider font-mono">
                                PO
                              </span>
                              <p className="text-xs font-black text-[#34150F] font-mono">
                                {po.poNumber}
                              </p>
                            </div>
                            <p className="text-[11px] text-[#85431E] font-mono mt-0.5">
                              Ref Quotation: <span className="font-bold text-[#34150F]">{po.quotationNumber}</span>
                            </p>
                            <p className="text-[10px] text-[#85431E]/70 mt-0.5">
                              Submitted: {new Date(po.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
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
                              <p className="text-[10px] font-bold text-teal-800 mt-1 flex items-center justify-end gap-1">
                                <Truck size={11} /> {po.dispatch.carrierName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Financial and Items Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#FAF5EE] p-3 rounded-xl border border-[#34150F]/6">
                          <div>
                            <span className="text-[10px] text-[#85431E] block">Items</span>
                            <span className="font-bold text-[#34150F]">{po.items?.length || 0} Products</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#85431E] block">Total Amount</span>
                            <span className="font-bold font-mono text-[#34150F]">₹{Number(po.totalAmount).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#85431E] block">Advance ({po.advancePercentage}%)</span>
                            <span className="font-bold font-mono text-[#34150F]">₹{Number(po.advanceAmount).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#85431E] block">Balance Due</span>
                            <span className="font-bold font-mono text-amber-900">₹{Number(po.balanceAmount).toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            {po.packingList && (
                              <AsyncActionButton
                                mode="download"
                                onAction={() => downloadPackingListPdf(po.id, po.poNumber)}
                                idleIcon={<Download size={11} />}
                                idleLabel="Packing List"
                                loadingLabel="Preparing…"
                                successLabel="Downloaded!"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors"
                                variant="custom"
                              />
                            )}
                            {po.invoice && (
                              <AsyncActionButton
                                mode="download"
                                onAction={() => downloadPoInvoicePdf(po.id, po.invoice?.invoiceNumber)}
                                idleIcon={<Receipt size={11} />}
                                idleLabel="Tax Invoice"
                                loadingLabel="Preparing…"
                                successLabel="Downloaded!"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg transition-colors"
                                variant="custom"
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
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
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                title="Cancel / Delete Purchase Order"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}

                            <AsyncActionButton
                              mode="view"
                              onAction={() => {
                                onClose();
                                navigate(`/purchase-orders/${po.id}`);
                              }}
                              idleLabel="View PO & Receipts"
                              loadingLabel="Opening…"
                              idleIcon={<ChevronRight size={13} />}
                              className="inline-flex items-center gap-1.5 bg-[#34150F] hover:bg-[#D39858] text-[#EACEAA] hover:text-[#34150F] font-bold text-xs px-4 py-1.5 rounded-xl transition-all shadow-sm"
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
                  <div className="space-y-3">
                    {ordersFilter === "ALL" && purchaseOrders.length > 0 && (
                      <div className="flex items-center gap-2 text-xs font-black text-[#85431E] uppercase tracking-wider pt-2 border-t border-[#34150F]/10">
                        <Package size={13} className="text-[#D39858]" />
                        <span>Online Retail Orders ({orders.length})</span>
                      </div>
                    )}
                    {orders.map((order: any) => (
                      <div key={order.id || order._id} className="bg-white rounded-tr-2xl rounded-bl-2xl p-5 shadow-sm border border-[#34150F]/6">
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div>
                            <p className="text-xs font-black text-[#34150F] mb-0.5">
                              Order #{(order.orderNumber || order.id || "—").toString().slice(-8).toUpperCase()}
                            </p>
                            <p className="text-[10px] text-[#85431E]">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                : "—"}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                            STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600 border-gray-200"
                          }`}>
                            {order.status || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#85431E]">
                            {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-sm font-black text-[#34150F]">
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

