import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User as UserIcon, ShoppingCart, Menu, X, LogIn, Bell, Heart, Building2, Sparkles } from 'lucide-react';
import { NAV_LINKS } from '../../data/products';
import { CategoryDropdown } from './CategoryDropdown';
import { ProductsDropdown } from './ProductsDropdown';
import { MaterialsDropdown } from './MaterialsDropdown';
import { SearchDropdown } from '../search/SearchDropdown';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isB2BUser } from '../../utils/pricing';
import { notificationService } from '../../services/notificationService';

interface HeaderProps {
  cartCount: number;
  wishlistCount?: number;
  menuOpen: boolean;
  setMenuOpen: (o: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (o: boolean) => void;
  setCartOpen: (o: boolean) => void;
  onAddToCart: (p: Product) => void;
}

export function Header({
  cartCount,
  wishlistCount = 0,
  menuOpen,
  setMenuOpen,
  searchQuery,
  setSearchQuery,
  searchOpen,
  setSearchOpen,
  setCartOpen,
  onAddToCart,
}: HeaderProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  const isB2B = isB2BUser(user);
  const visibleNavLinks = NAV_LINKS.filter((link) => link !== 'B2B / Bulk' || isB2B);

  // Poll unread notification count every 60s for authenticated users


  useEffect(() => {
    if (!isAuthenticated) { setNotifCount(0); return; }
    const fetchCount = async () => {
      const res = await notificationService.getAll({ limit: 1 });
      if (res.success && res.data) setNotifCount(res.data.unreadCount ?? 0);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <>
      {/* ── Mobile Drawer Backdrop ── */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 1999 }}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile Drawer (slides in from left) ── */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] sm:w-[300px] bg-[#1e0a06] md:hidden flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ zIndex: 2000 }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#34150F] border-b border-[#EACEAA]/10 flex-shrink-0">
          <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-baseline gap-1">
            <span className="text-[#D39858] font-extrabold text-xl tracking-tight" style={{ fontFamily: "'Gilda Display', serif" }}>PRC</span>
            <span className="text-[#EACEAA] font-semibold text-base tracking-wide">Hardware</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="text-[#EACEAA]/70 hover:text-[#D39858] transition-colors p-1 rounded-lg hover:bg-[#EACEAA]/10"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Nav Links — scrollable */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="flex flex-col">
            {visibleNavLinks.map((link) => {
              if (link === 'By Category') return <CategoryDropdown key={link} onSelectCategory={(cat) => { navigate(`/products?category=${encodeURIComponent(cat)}`); setMenuOpen(false); }} />;
              if (link === 'Products') return <ProductsDropdown key={link} onSelectProduct={(prod) => { navigate(`/products?search=${encodeURIComponent(prod)}`); setMenuOpen(false); }} />;
              if (link === 'By Materials') return <MaterialsDropdown key={link} onSelectMaterial={(mat) => { navigate(`/products?material=${encodeURIComponent(mat)}`); setMenuOpen(false); }} />;
              let route = `/products?search=${encodeURIComponent(link)}`;
              if (link === 'B2B / Bulk') route = '/request-quote';
              if (link === 'Best Sellers') route = '/bestsellers';
              if (link === 'New Arrivals') route = '/new-arrivals';
              if (link === 'Offers') route = '/offers';
              return (
                <li key={link}>
                  <Link
                    to={route}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center text-sm font-semibold px-5 py-3.5 transition-all duration-200 border-b border-[#EACEAA]/6 last:border-0 ${
                      link === 'B2B / Bulk'
                        ? 'text-[#D39858] bg-[#D39858]/10 font-bold'
                        : 'text-[#EACEAA]/80 hover:text-[#D39858] hover:bg-[#EACEAA]/5'
                    }`}
                  >
                    {link === 'B2B / Bulk' ? (
                      <span className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2">
                          <Building2 size={16} />
                          <span>B2B / Bulk Orders</span>
                        </span>
                        <span className="bg-[#D39858] text-[#34150F] text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Wholesale
                        </span>
                      </span>
                    ) : (
                      link
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Drawer Footer — Cart, Wishlist, Notifications */}
        <div className="flex-shrink-0 border-t border-[#EACEAA]/10 px-5 py-4 bg-[#34150F]/60">
          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-[#D39858] text-[#34150F] font-bold text-xs py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA] transition-all active:scale-95 shadow relative"
            >
              <ShoppingCart size={15} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#34150F] text-[#EACEAA] text-[10px] font-bold min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 bg-[#EACEAA]/10 text-[#EACEAA] font-bold text-xs py-2.5 rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/20 transition-all active:scale-95 border border-[#EACEAA]/20 relative"
            >
              <Heart size={15} />
              Wishlist
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D39858] text-[#34150F] text-[10px] font-bold min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            {isAuthenticated && (
              <Link
                to="/notifications"
                onClick={() => setMenuOpen(false)}
                className="relative w-10 h-10 flex items-center justify-center bg-[#EACEAA]/10 text-[#EACEAA] rounded-tr-xl rounded-bl-xl hover:bg-[#EACEAA]/20 border border-[#EACEAA]/20 transition-all active:scale-95"
              >
                <Bell size={16} />
                {notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#D39858] text-[#34150F] text-[10px] font-bold min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>

      <header className="z-40 bg-[#34150F] shadow-md flex-shrink-0 relative">
        {/* Top bar */}
        <div className="px-3 sm:px-4 md:px-8 lg:px-16 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
          {/* Hamburger + Logo */}
          <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="md:hidden text-[#EACEAA] hover:text-[#D39858] transition-colors p-1 -ml-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-baseline gap-1 group cursor-pointer">
              <span className="text-[#D39858] font-extrabold text-xl sm:text-2xl tracking-tight transition-transform duration-300 group-hover:scale-105" style={{ fontFamily: "'Gilda Display', serif" }}>PRC</span>
              <span className="text-[#EACEAA] font-semibold text-base sm:text-lg tracking-wide">Hardware</span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 justify-center mx-6 lg:mx-12 relative">
            <div className="relative w-full max-w-xs lg:max-w-md transition-all duration-300">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search products, materials..."
                className="w-full bg-[#EACEAA]/15 text-[#EACEAA] placeholder-[#EACEAA]/50 pl-4 pr-10 py-2 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/20 focus:outline-none focus:border-[#D39858] transition-all duration-300 focus:shadow-lg focus:bg-[#EACEAA]/20"
              />
              {searchQuery ? (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EACEAA]/60 hover:text-[#D39858] transition-colors p-0.5" aria-label="Clear search">
                  <X size={14} />
                </button>
              ) : (
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D39858] pointer-events-none" />
              )}
              {searchOpen && (
                <SearchDropdown searchQuery={searchQuery} setSearchQuery={setSearchQuery} onClose={() => setSearchOpen(false)} onAddToCart={onAddToCart} />
              )}
            </div>
          </div>

          {/* Icons — use gap-2 on mobile to fit 320px screens */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto md:ml-0">
            <button
              type="button"
              className="md:hidden text-[#EACEAA] hover:text-[#D39858] transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Account */}
            {isAuthenticated ? (
              <Link to="/profile" className="flex items-center gap-1 sm:gap-1.5 bg-[#EACEAA]/15 hover:bg-[#D39858]/20 border border-[#EACEAA]/20 px-2 sm:px-3 py-1.5 rounded-tr-xl rounded-bl-xl transition-all duration-200 text-xs text-[#EACEAA] hover:text-[#D39858]">
                <UserIcon size={15} className="text-[#D39858]" />
                <span className="font-bold hidden sm:inline">{user?.firstName || 'Account'}</span>
                {isB2B && (
                  <span className="bg-[#D39858] text-[#34150F] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider hidden xs:inline">
                    B2B
                  </span>
                )}
              </Link>
            ) : (
              <button type="button" onClick={() => openAuthModal('login')} className="flex items-center gap-1 sm:gap-1.5 bg-[#D39858] hover:bg-[#EACEAA] text-[#34150F] font-bold px-2 sm:px-3 py-1.5 rounded-tr-xl rounded-bl-xl transition-all duration-200 text-xs shadow-md active:scale-95">
                <LogIn size={14} />
                <span className="hidden xs:inline hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Notification Bell — only when authenticated, hidden on mobile */}
            {isAuthenticated && (
              <Link to="/notifications" className="relative hidden md:inline-flex text-[#EACEAA] hover:text-[#D39858] transition-colors hover:scale-110 active:scale-95 duration-200" aria-label="Notifications">
                <Bell size={20} />
                {notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#D39858] text-[#34150F] text-[10px] font-bold min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center leading-none shadow-md">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist Link — hidden on mobile */}
            <Link to="/wishlist" className="relative hidden md:inline-flex text-[#EACEAA] hover:text-[#D39858] transition-colors hover:scale-110 active:scale-95 duration-200" aria-label="Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D39858] text-[#34150F] text-[10px] font-bold min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center leading-none shadow-md">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart — hidden on mobile */}
            <Link to="/cart" className="relative hidden md:inline-flex text-[#EACEAA] hover:text-[#D39858] transition-colors hover:scale-110 active:scale-95 duration-200" aria-label="Shopping Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D39858] text-[#34150F] text-[10px] font-bold min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center leading-none shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar (full-width expandable) */}
        {searchOpen && (
          <div className="md:hidden px-3 sm:px-4 pb-3 animate-in fade-in slide-in-from-top-2 duration-200 relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, materials..."
                className="w-full bg-[#EACEAA]/15 text-[#EACEAA] placeholder-[#EACEAA]/50 pl-4 pr-10 py-2.5 rounded-tr-xl rounded-bl-xl text-sm border border-[#EACEAA]/30 focus:outline-none focus:border-[#D39858]"
                autoFocus
              />
              {searchQuery ? (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EACEAA]/60 hover:text-[#D39858] p-0.5">
                  <X size={16} />
                </button>
              ) : (
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D39858]" />
              )}
            </div>
            <SearchDropdown searchQuery={searchQuery} setSearchQuery={setSearchQuery} onClose={() => setSearchOpen(false)} onAddToCart={onAddToCart} />
          </div>
        )}

        {/* Desktop Nav — inline, hidden on mobile */}
        <nav className="hidden md:block border-t border-[#EACEAA]/10">
          <ul className="flex flex-row items-center justify-between px-4 md:px-8 lg:px-16 py-0 overflow-visible relative">
            {visibleNavLinks.map((link) => {
              if (link === 'By Category') return <CategoryDropdown key={link} onSelectCategory={(cat) => { navigate(`/products?category=${encodeURIComponent(cat)}`); setMenuOpen(false); }} />;
              if (link === 'Products') return <ProductsDropdown key={link} onSelectProduct={(prod) => { navigate(`/products?search=${encodeURIComponent(prod)}`); setMenuOpen(false); }} />;
              if (link === 'By Materials') return <MaterialsDropdown key={link} onSelectMaterial={(mat) => { navigate(`/products?material=${encodeURIComponent(mat)}`); setMenuOpen(false); }} />;
              let route = `/products?search=${encodeURIComponent(link)}`;
              if (link === 'B2B / Bulk') route = '/request-quote';
              if (link === 'Best Sellers') route = '/bestsellers';
              if (link === 'New Arrivals') route = '/new-arrivals';
              if (link === 'Offers') route = '/offers';
              return (
                <li key={link}>
                  <Link
                    to={route}
                    onClick={() => setMenuOpen(false)}
                    className={`relative flex items-center gap-1.5 whitespace-nowrap text-sm px-3.5 py-2.5 transition-all duration-200 w-auto text-center group ${
                      link === 'B2B / Bulk'
                        ? 'text-[#D39858] font-bold bg-[#D39858]/10 rounded-tr-xl rounded-bl-xl border border-[#D39858]/30 shadow-xs'
                        : 'text-[#EACEAA]/80 hover:text-[#D39858] font-medium'
                    }`}
                  >
                    {link === 'B2B / Bulk' && <Building2 size={13} className="text-[#D39858]" />}
                    <span>{link}</span>
                    {link === 'B2B / Bulk' && (
                      <span className="bg-[#D39858] text-[#34150F] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    )}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-3/4 h-0.5 bg-[#D39858] transition-all duration-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
    </>
  );
}
