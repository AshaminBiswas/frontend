import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Search, Heart, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  cartCount: number;
  wishlistCount?: number;
  onOpenSearch?: () => void;
  onOpenCart?: () => void;
}

export function MobileBottomNav({
  cartCount,
  wishlistCount = 0,
  onOpenSearch,
  onOpenCart,
}: MobileBottomNavProps) {
  const location = useLocation();
  const { isAuthenticated, openAuthModal } = useAuth();
  const pathname = location.pathname;

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      to: '/',
      active: isActive('/'),
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Grid,
      to: '/categories',
      active: isActive('/category') || isActive('/categories'),
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      onClick: onOpenSearch,
      active: false,
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: Heart,
      to: '/wishlist',
      active: isActive('/wishlist'),
      badge: wishlistCount > 0 ? (wishlistCount > 99 ? '99+' : wishlistCount) : null,
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      to: '/cart',
      onClick: onOpenCart,
      active: isActive('/cart'),
      badge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : null,
    },
    {
      id: 'account',
      label: isAuthenticated ? 'Account' : 'Login',
      icon: UserIcon,
      to: isAuthenticated ? '/profile' : undefined,
      onClick: !isAuthenticated ? () => openAuthModal('login') : undefined,
      active: isActive('/profile'),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#34150F]/95 backdrop-blur-md border-t border-[#EACEAA]/15 shadow-[0_-4px_20px_rgba(0,0,0,0.25)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = item.active;

          const content = (
            <div className="relative flex flex-col items-center justify-center w-full py-1">
              <div
                className={`relative p-1 rounded-xl transition-all duration-200 ${
                  isItemActive
                    ? 'text-[#D39858] scale-110'
                    : 'text-[#EACEAA]/70 hover:text-[#EACEAA]'
                }`}
              >
                <Icon size={18} strokeWidth={isItemActive ? 2.5 : 1.75} />

                {/* Badge Indicator */}
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-[#D39858] text-[#34150F] text-[9px] font-black min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[9px] font-bold tracking-tight transition-colors duration-200 mt-0.5 ${
                  isItemActive ? 'text-[#D39858]' : 'text-[#EACEAA]/60'
                }`}
              >
                {item.label}
              </span>
            </div>
          );

          if (item.onClick && !item.to) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="flex-1 flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.to || '/'}
              onClick={item.onClick}
              className="flex-1 flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
