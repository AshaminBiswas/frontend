import { useState, useEffect, Component, ReactNode, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AuthModal } from '../components/auth/AuthModal';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { CartDrawer } from '../components/cart/CartDrawer';
import { SearchOverlay } from '../components/search/SearchOverlay';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { getAllProductsApi } from '../services/productService';
import { PageSkeleton } from '../components/common/PageSkeleton';
import { lazyWithRetry } from '../utils/lazyWithRetry';

// ─── Code-Split Page Routes with lazyWithRetry() ─────────────────────────────

const HomePage = lazyWithRetry(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProductsCatalogPage = lazyWithRetry(() => import('../pages/ProductsCatalogPage').then((m) => ({ default: m.ProductsCatalogPage })));
const ProductDetailPage = lazyWithRetry(() => import('../pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CategoriesPage = lazyWithRetry(() => import('../pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const CategoryProductsPage = lazyWithRetry(() => import('../pages/CategoryProductsPage').then((m) => ({ default: m.CategoryProductsPage })));
const MaterialProductsPage = lazyWithRetry(() => import('../pages/MaterialProductsPage').then((m) => ({ default: m.MaterialProductsPage })));
const CartPage = lazyWithRetry(() => import('../pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazyWithRetry(() => import('../pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazyWithRetry(() => import('../pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const ProfilePage = lazyWithRetry(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AppointmentsPage = lazyWithRetry(() => import('../pages/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })));
const RequestQuotePage = lazyWithRetry(() => import('../pages/RequestQuotePage').then((m) => ({ default: m.RequestQuotePage })));
const CustomerQuoteApprovalPage = lazyWithRetry(() => import('../pages/CustomerQuoteApprovalPage').then((m) => ({ default: m.CustomerQuoteApprovalPage })));

const NotFoundPage = lazyWithRetry(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const WishlistPage = lazyWithRetry(() => import('../pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const BestSellersPage = lazyWithRetry(() => import('../pages/BestSellersPage').then((m) => ({ default: m.BestSellersPage })));
const NewArrivalsPage = lazyWithRetry(() => import('../pages/NewArrivalsPage').then((m) => ({ default: m.NewArrivalsPage })));
const OffersPage = lazyWithRetry(() => import('../pages/OffersPage').then((m) => ({ default: m.OffersPage })));
const NotificationsPage = lazyWithRetry(() => import('../pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const TrackOrderPage = lazyWithRetry(() => import('../pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const AboutPage = lazyWithRetry(() => import('../pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazyWithRetry(() => import('../pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PolicyPage = lazyWithRetry(() => import('../pages/PolicyPage').then((m) => ({ default: m.PolicyPage })));
const PrivacyPolicyPage = lazyWithRetry(() => import('../pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const RefundPolicyPage = lazyWithRetry(() => import('../pages/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage })));
const ShippingPolicyPage = lazyWithRetry(() => import('../pages/ShippingPolicyPage').then((m) => ({ default: m.ShippingPolicyPage })));
const TermsOfServicePage = lazyWithRetry(() => import('../pages/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })));
const FaqPage = lazyWithRetry(() => import('../pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const WarrantyClaimPage = lazyWithRetry(() => import('../pages/WarrantyClaimPage').then((m) => ({ default: m.WarrantyClaimPage })));

// Error Boundary Component to prevent white screens on reload
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('[PRC Frontend ErrorBoundary]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EACEAA] flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
          <div className="bg-[#f5e8d4] p-8 rounded-tr-3xl rounded-bl-3xl border border-[rgba(52,21,15,0.12)] max-w-md shadow-xl space-y-4">
            <h2 className="text-xl font-extrabold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>
              Unable to load view
            </h2>
            <p className="text-xs text-[#85431E] leading-relaxed">
              We encountered a temporary network issue during page reload. Please click below to refresh the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="bg-[#34150F] text-[#EACEAA] font-bold text-xs px-6 py-3 rounded-tr-xl rounded-bl-xl hover:bg-[#D39858] hover:text-[#34150F] transition-all shadow-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { GlobalNotificationListener } from '../components/common/GlobalNotificationListener';

function AppContent() {
  const { cart, cartOpen, setCartOpen, addToCart, removeFromCart, changeQty, cartCount } = useCart();
  const { wishlist, wishlistItems, toggleWishlist, wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Preload products in background
  useEffect(() => {
    getAllProductsApi(100);
  }, []);

  const handleSelectCategory = (categoryName: string) => {
    const slug = categoryName.toLowerCase().trim().replace(/\s+/g, '-');
    navigate(`/category/${slug}`);
  };

  const handleClearCart = () => {
    cart.forEach((item) => removeFromCart(item.id));
  };

  return (
    <div className="min-h-screen bg-[#EACEAA] flex flex-col justify-between overflow-x-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <ScrollToTop />
      
      {/* Real-time Push Notifications */}
      <GlobalNotificationListener />

      <div>
        <Header
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          setCartOpen={setCartOpen}
          onAddToCart={addToCart}
        />

        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Core routes */}
              <Route path="/" element={<HomePage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} onSelectCategory={handleSelectCategory} />} />
              <Route path="/products" element={<ProductsCatalogPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/bestsellers" element={<BestSellersPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/new-arrivals" element={<NewArrivalsPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/offers" element={<OffersPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/offer" element={<OffersPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/product/:id" element={<ProductDetailPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/categories" element={<CategoriesPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/category/:slug" element={<CategoryProductsPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/categories/:slug" element={<CategoryProductsPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/material/:slug" element={<MaterialProductsPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/materials/:slug" element={<MaterialProductsPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
              <Route path="/cart" element={<CartPage cart={cart} onRemoveFromCart={removeFromCart} onChangeQty={changeQty} />} />
              <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} wishlistItems={wishlistItems} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} />} />
              <Route path="/checkout" element={<CheckoutPage cart={cart} onClearCart={handleClearCart} />} />
              <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
              <Route path="/profile/*" element={<ProfilePage cart={cart} onRemoveFromCart={removeFromCart} onChangeQty={changeQty} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} />} />
              <Route path="/services/appointments" element={<AppointmentsPage />} />
              <Route path="/request-quote" element={<RequestQuotePage />} />
              <Route path="/quote/:token" element={<CustomerQuoteApprovalPage />} />
              <Route path="/quotation/view/:token" element={<CustomerQuoteApprovalPage />} />





              {/* Navigation routes */}
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/track-order" element={<TrackOrderPage />} />
              <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Policy & FAQ Routes */}
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/faqs" element={<FaqPage />} />
              <Route path="/warranty-claim" element={<WarrantyClaimPage />} />
              <Route path="/policy/warranty" element={<WarrantyClaimPage />} />
              <Route path="/policy/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/policy/returns" element={<RefundPolicyPage />} />
              <Route path="/policy/refund" element={<RefundPolicyPage />} />
              <Route path="/policy/shipping" element={<ShippingPolicyPage />} />
              <Route path="/policy/terms" element={<TermsOfServicePage />} />
              <Route path="/policy/:slug" element={<PolicyPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>

      <Footer />

      {/* Cart Drawer */}
      {cartOpen && (
        <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={changeQty} />
      )}

      {/* Native Mobile App Bottom Navigation Bar */}
      <MobileBottomNav
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Global / Mobile Search Overlay */}
      {searchOpen && (
        <SearchOverlay
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClose={() => setSearchOpen(false)}
          onAddToCart={addToCart}
        />
      )}

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

