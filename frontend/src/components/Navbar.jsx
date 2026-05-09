import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getUserRole } from "../utils/auth";
import NotificationBell from "./NotificationBell";
import CheckoutDrawer from "./CheckoutDrawer";
import { useAuth } from "../contexts/AuthContext";
import { useCartStore } from "../store/cartStore";

// Inline SVGs
const SearchIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const CartIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const MenuIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();
  const { isAuthenticated, logout } = useAuth();
  const loggedIn = isAuthenticated;

  const [searchValue, setSearchValue] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { total: cartTotal, count: cartCount, fetchCart } = useCartStore();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  const menuRef = useRef(null);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenuOpen]);

  // Load cart from backend on initial mount if authenticated
  useEffect(() => {
    if (loggedIn && role !== "farmer" && role !== "delivery_partner") {
      fetchCart();
    }
  }, [loggedIn, role, fetchCart]);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchValue.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 shadow-sm" ref={menuRef}>
        {/* Main bar */}
        <div className="h-16 sm:h-20 flex items-center">
          <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-8">

            {/* Brand/Logo */}
            <Link to="/" className="flex items-center gap-2 group transition-transform active:scale-95 flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-100 group-hover:rotate-6 transition-all">
                <span className="text-lg sm:text-xl">🚜</span>
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-lg sm:text-xl font-black text-brand-600 leading-none">Farm</span>
                <span className="text-lg sm:text-xl font-black text-accent-500 leading-none">Fresh</span>
              </div>
            </Link>

            {/* Search Bar — desktop only */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-grow max-w-xl relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                <SearchIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder='Search "organic milk", "fresh tomatoes"...'
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-brand-300 focus:ring-4 focus:ring-brand-50 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </form>

            {/* Right section */}
            <div className="flex items-center gap-2 sm:gap-4">

              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center gap-6">
                {loggedIn ? (
                  <>
                    <Link
                      to={role === "farmer" ? "/farmer-dashboard" : role === "delivery_partner" ? "/deliveries" : "/my-orders"}
                      className="text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors whitespace-nowrap"
                    >
                      {role === "farmer" ? "Farmer Portal" : role === "delivery_partner" ? "My Deliveries" : "My Orders"}
                    </Link>

                    <Link to="/profile" className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-lg shadow-sm hover:scale-105 transition-transform">
                      {role === 'farmer' ? '👨‍🌾' : '👤'}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors">Sign In</Link>
                )}
              </div>

              {/* Cart Button */}
              {role !== "farmer" && role !== "delivery_partner" && (
                <button
                  id="cart-btn"
                  onClick={() => setCheckoutOpen(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white rounded-2xl px-3 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 transition-all active:scale-95 shadow-lg shadow-brand-100 group"
                >
                  <div className="relative">
                    <CartIcon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-accent-500 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-600">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold tracking-tight hidden sm:inline">₹{cartTotal}</span>
                </button>
              )}

              {/* Hamburger — mobile only */}
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel — slide down */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu-panel"
            className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-4 shadow-lg"
          >
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder='Search fresh produce...'
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-50 focus:outline-none transition-all"
                autoFocus
              />
            </form>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-1">
              <Link
                to="/marketplace"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
              >
                🛍️ Marketplace
              </Link>

              {loggedIn ? (
                <>
                  <Link
                    to={role === "farmer" ? "/farmer-dashboard" : role === "delivery_partner" ? "/deliveries" : "/my-orders"}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                  >
                    {role === "farmer" ? "👨‍🌾 Farmer Portal" : role === "delivery_partner" ? "🚚 My Deliveries" : "📦 My Orders"}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left w-full"
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                  >
                    🔑 Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors"
                  >
                    ✨ Create Account
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </nav>

      <CheckoutDrawer isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
