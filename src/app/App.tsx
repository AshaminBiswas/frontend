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
import { getAllProductsApi } from '../services/productService';
import { PageSkeleton } from '../components/common/PageSkeleton';

// ─── Code-Split Page Routes with React.lazy() ─────────────────────────────────

const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProductsCatalogPage = lazy(() => import('../pages/ProductsCatalogPage').then((m) => ({ default: m.ProductsCatalogPage })));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const CategoryProductsPage = lazy(() => import('../pages/CategoryProductsPage').then((m) => ({ default: m.CategoryProductsPage })));
const MaterialProductsPage = lazy(() => import('../pages/MaterialProductsPage').then((m) => ({ default: m.MaterialProductsPage })));
const CartPage = lazy(() => import('../pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('../pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AppointmentsPage = lazy(() => import('../pages/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage })));
const RequestQuotePage = lazy(() => import('../pages/RequestQuotePage').then((m) => ({ default: m.RequestQuotePage })));
const CustomerQuoteApprovalPage = lazy(() => import('../pages/CustomerQuoteApprovalPage').then((m) => ({ default: m.CustomerQuoteApprovalPage })));
const CustomerPoListPage = lazy(() => import('../pages/CustomerPoListPage').then((m) => ({ default: m.CustomerPoListPage })));
const CreatePurchaseOrderPage = lazy(() => import('../pages/CreatePurchaseOrderPage').then((m) => ({ default: m.CreatePurchaseOrderPage })));
const CustomerPoDetailPage = lazy(() => import('../pages/CustomerPoDetailPage').then((m) => ({ default: m.CustomerPoDetailPage })));
const PoSubmissionsListPage = lazy(() => import('../pages/PoSubmissionsListPage').then((m) => ({ default: m.PoSubmissionsListPage })));
const CreatePoSubmissionPage = lazy(() => import('../pages/CreatePoSubmissionPage').then((m) => ({ default: m.CreatePoSubmissionPage })));
const PoSubmissionDetailPage = lazy(() => import('../pages/PoSubmissionDetailPage').then((m) => ({ default: m.PoSubmissionDetailPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const WishlistPage = lazy(() => import('../pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const BestSellersPage = lazy(() => import('../pages/BestSellersPage').then((m) => ({ default: m.BestSellersPage })));
const NewArrivalsPage = lazy(() => import('../pages/NewArrivalsPage').then((m) => ({ default: m.NewArrivalsPage })));
const OffersPage = lazy(() => import('../pages/OffersPage').then((m) => ({ default: m.OffersPage })));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const TrackOrderPage = lazy(() => import('../pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('../pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PolicyPage = lazy(() => import('../pages/PolicyPage').then((m) => ({ default: m.PolicyPage })));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const RefundPolicyPage = lazy(() => import('../pages/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage })));
const ShippingPolicyPage = lazy(() => import('../pages/ShippingPolicyPage').then((m) => ({ default: m.ShippingPolicyPage })));
const TermsOfServicePage = lazy(() => import('../pages/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })));
const FaqPage = lazy(() => import('../pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const WarrantyClaimPage = lazy(() => import('../pages/WarrantyClaimPage').then((m) => ({ default: m.WarrantyClaimPage })));

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
              <Route path="/purchase-orders" element={<CustomerPoListPage />} />
              <Route path="/purchase-orders/create" element={<CreatePurchaseOrderPage />} />
              <Route path="/purchase-orders/:id" element={<CustomerPoDetailPage />} />
              <Route path="/po-submissions" element={<PoSubmissionsListPage />} />
              <Route path="/po-submissions/new" element={<CreatePoSubmissionPage />} />
              <Route path="/po-submissions/create" element={<CreatePoSubmissionPage />} />
              <Route path="/po-submissions/:id" element={<PoSubmissionDetailPage />} />

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
