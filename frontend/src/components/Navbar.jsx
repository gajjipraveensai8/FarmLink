import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getUserRole } from "../utils/auth";
import NotificationBell from "./NotificationBell";
import CheckoutDrawer from "./CheckoutDrawer";
import { useAuth } from "../contexts/AuthContext";
import { useCartStore } from "../store/cartStore";

// Inline SVGs for Blinkit Style
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

const LocationIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
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

  const { total: cartTotal, count: cartCount, fetchCart } = useCartStore();

  // Load cart from backend on initial mount if authenticated
  useEffect(() => {
    if (loggedIn && role !== "farmer" && role !== "delivery_partner") {
      fetchCart();
    }
  }, [loggedIn, role, fetchCart]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 h-20 flex items-center shadow-sm">
        <div className="max-w-[1400px] mx-auto w-full px-6 flex items-center justify-between gap-8">

          {/* Brand/Logo */}
          <Link to="/" className="flex items-center gap-2 group transition-transform active:scale-95">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-100 group-hover:rotate-6 transition-all">
              <span className="text-xl">🚜</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-black text-brand-600 leading-none">Farm</span>
              <span className="text-xl font-black text-accent-500 leading-none">Fresh</span>
            </div>
          </Link>

          {/* Search Bar - Professional & Centered */}
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

          {/* Actions */}
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden lg:flex items-center gap-6">
              {loggedIn ? (
                <>
                  <Link
                    to={role === "farmer" ? "/farmer-dashboard" : "/my-orders"}
                    className="text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors"
                  >
                    {role === "farmer" ? "Farmer Portal" : "My Orders"}
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

            {/* Cart Button - Premium Design */}
            {role !== "farmer" && (
              <button
                onClick={() => setCheckoutOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white rounded-2xl px-5 py-2.5 flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-brand-100 group"
              >
                <div className="relative">
                  <CartIcon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-accent-500 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-600">
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-start leading-none pr-1">
                  <span className="text-sm font-bold tracking-tight">₹{cartTotal}</span>
                </div>
              </button>
            )}
          </div>

        </div>
      </nav>

      <CheckoutDrawer isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
