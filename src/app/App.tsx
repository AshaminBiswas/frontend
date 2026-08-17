import { useState, useEffect, Component, ReactNode } from 'react';
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

// Eagerly imported pages for instantaneous, zero-error reloading across all routes
import { HomePage } from '../pages/HomePage';
import { ProductsCatalogPage } from '../pages/ProductsCatalogPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { CategoryProductsPage } from '../pages/CategoryProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderSuccessPage } from '../pages/OrderSuccessPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { RequestQuotePage } from '../pages/RequestQuotePage';
import { CustomerQuoteApprovalPage } from '../pages/CustomerQuoteApprovalPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { WishlistPage } from '../pages/WishlistPage';
import { BestSellersPage } from '../pages/BestSellersPage';
import { NewArrivalsPage } from '../pages/NewArrivalsPage';
import { OffersPage } from '../pages/OffersPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { TrackOrderPage } from '../pages/TrackOrderPage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { PolicyPage } from '../pages/PolicyPage';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { RefundPolicyPage } from '../pages/RefundPolicyPage';
import { ShippingPolicyPage } from '../pages/ShippingPolicyPage';
import { TermsOfServicePage } from '../pages/TermsOfServicePage';
import { FaqPage } from '../pages/FaqPage';
import { WarrantyClaimPage } from '../pages/WarrantyClaimPage';

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

  // Preload all products dynamically on first website load
  useEffect(() => {
    getAllProductsApi(100);
  }, []);

  const handleSelectCategory = (categoryName: string) => {
    const slug = categoryName.toLowerCase().trim().replace(/\s+/g, '-');
    navigate(`/category/${slug}`);
  };

  const handleClearCart = () => {
    cart.forEach(item => removeFromCart(item.id));
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
