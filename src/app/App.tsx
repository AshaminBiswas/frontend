import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/auth/AuthModal';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ScrollToTop } from '../components/common/ScrollToTop';

// Pages — eagerly loaded (core)
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
import { NotFoundPage } from '../pages/NotFoundPage';

// Pages — lazy loaded (new)
const WishlistPage = lazy(() =>
  import('../pages/WishlistPage').then(m => ({ default: m.WishlistPage }))
);
const BestSellersPage = lazy(() =>
  import('../pages/BestSellersPage').then(m => ({ default: m.BestSellersPage }))
);
const NewArrivalsPage = lazy(() =>
  import('../pages/NewArrivalsPage').then(m => ({ default: m.NewArrivalsPage }))
);
const OffersPage = lazy(() =>
  import('../pages/OffersPage').then(m => ({ default: m.OffersPage }))
);
const NotificationsPage = lazy(() =>
  import('../pages/NotificationsPage').then(m => ({ default: m.NotificationsPage }))
);
const TrackOrderPage = lazy(() =>
  import('../pages/TrackOrderPage').then(m => ({ default: m.TrackOrderPage }))
);
const AboutPage = lazy(() =>
  import('../pages/AboutPage').then(m => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import('../pages/ContactPage').then(m => ({ default: m.ContactPage }))
);
const PolicyPage = lazy(() =>
  import('../pages/PolicyPage').then(m => ({ default: m.PolicyPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('../pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage }))
);
const RefundPolicyPage = lazy(() =>
  import('../pages/RefundPolicyPage').then(m => ({ default: m.RefundPolicyPage }))
);
const ShippingPolicyPage = lazy(() =>
  import('../pages/ShippingPolicyPage').then(m => ({ default: m.ShippingPolicyPage }))
);
const TermsOfServicePage = lazy(() =>
  import('../pages/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage }))
);
const FaqPage = lazy(() =>
  import('../pages/FaqPage').then(m => ({ default: m.FaqPage }))
);
const WarrantyClaimPage = lazy(() =>
  import('../pages/WarrantyClaimPage').then(m => ({ default: m.WarrantyClaimPage }))
);

const CartDrawer = lazy(() =>
  import('../components/cart/CartDrawer').then(m => ({ default: m.CartDrawer }))
);

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#EACEAA]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-[#34150F] rounded-tr-2xl rounded-bl-2xl animate-pulse" />
        <p className="text-[#85431E] text-sm font-semibold" style={{ fontFamily: "'Nunito', sans-serif" }}>Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { cart, cartOpen, setCartOpen, addToCart, removeFromCart, changeQty, cartCount } = useCart();
  const { wishlist, wishlistItems, toggleWishlist, wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectCategory = (categoryName: string) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
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

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Core routes */}
            <Route path="/" element={<HomePage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} onSelectCategory={handleSelectCategory} />} />
            <Route path="/products" element={<ProductsCatalogPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/bestsellers" element={<BestSellersPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/new-arrivals" element={<NewArrivalsPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/offers" element={<OffersPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/product/:id" element={<ProductDetailPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:slug" element={<CategoryProductsPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/categories/:slug" element={<CategoryProductsPage onAddToCart={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/cart" element={<CartPage cart={cart} onRemoveFromCart={removeFromCart} onChangeQty={changeQty} />} />
            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} wishlistItems={wishlistItems} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} onClearCart={handleClearCart} />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/profile/*" element={<ProfilePage cart={cart} onRemoveFromCart={removeFromCart} onChangeQty={changeQty} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAddToCart={addToCart} />} />
            <Route path="/services/appointments" element={<AppointmentsPage />} />
            <Route path="/request-quote" element={<RequestQuotePage />} />

            {/* New routes */}
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* Dedicated Policy Routes */}
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
      </div>

      <Footer />

      {/* Cart Drawer */}
      {cartOpen && (
        <Suspense fallback={null}>
          <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onQty={changeQty} />
        </Suspense>
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
