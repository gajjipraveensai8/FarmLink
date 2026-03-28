import { useState, useEffect, useCallback, useRef } from "react";
import useQueryParams from "../hooks/useQueryParams";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Skeleton from "../components/Skeleton";
import MarketplaceSearch from "../components/MarketplaceSearch";
import { getUserRole, isAuthenticated } from "../utils/auth";
import { toast } from "react-hot-toast";
import { useCartStore } from "../store/cartStore";
import { useProductStore } from "../store/productStore";
import { useGeolocation } from "../hooks/useGeolocation";
import { CATEGORIES } from "../utils/constants";

// Blinkit Style Inline SVG
const ChevronRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);

export default function ProductDiscovery() {
  const role = getUserRole();
  const loggedIn = isAuthenticated();
  const isBuyer = role !== "farmer" && loggedIn;

  const { get: qp, setParams } = useQueryParams({
    sort: "freshest",
    page: "1",
  });

  const q = qp("q") || "";
  const category = qp("category");
  const sort = qp("sort", "freshest");
  const page = Number(qp("page", "1")) || 1;
  const queryLng = qp("lng") || null;
  const queryLat = qp("lat") || null;
  const queryRadius = qp("radius") || "50";

  const [radius, setRadius] = useState(queryRadius || "50");
  const { lng, setLng, lat, setLat, geoLoading, requestLocation, clearLocation } = useGeolocation();

  const { products, loading, error, farmerCount, fetchProducts, fetchFarmerCount } = useProductStore();

  useEffect(() => {
    fetchProducts({ q, category, sort, page, lng, lat, radius });
  }, [q, category, sort, page, lng, lat, radius, fetchProducts]);

  useEffect(() => {
    fetchFarmerCount();
  }, [fetchFarmerCount]);

  useEffect(() => {
    setLng(queryLng);
    setLat(queryLat);
    setRadius(queryRadius);
  }, [queryLng, queryLat, queryRadius, setLng, setLat]);

  const addItem = useCartStore((state) => state.addItem);

  const addToCart = useCallback((product, qty) => {
    if (!product?._id) return;
    try {
      addItem(product, qty);

      toast.success(`Added ${product.name} to cart!`, {
        icon: '🛒',
        style: {
          borderRadius: '12px',
          background: '#16a34a',
          color: '#fff',
          fontWeight: 'bold'
        }
      });
    } catch (err) {
      console.error("Cart update error:", err);
      toast.error("Failed to update cart");
    }
  }, [addItem]);

  const handleSearch = useCallback((queryText, nextRadius) => {
    const normalizedRadius = String(nextRadius || "50");
    setRadius(normalizedRadius);
    setParams({
      q: queryText?.trim() || null,
      radius: normalizedRadius,
      page: "1",
    });
  }, [setParams]);

  const handleUseLocation = useCallback(() => {
    requestLocation((coords) => {
      setParams({ lng: coords.lng, lat: coords.lat, page: "1" });
      toast.success("Location applied. Showing nearby farms.");
    });
  }, [requestLocation, setParams]);

  const clearLocationFilter = useCallback(() => {
    clearLocation();
    setParams({ lng: null, lat: null, page: "1" });
    toast.success("Nearby filter cleared");
  }, [clearLocation, setParams]);



  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-20 font-sans">
      <Navbar />

      {/* Hero Section - Professional Banner */}
      <div className="max-w-[1400px] mx-auto px-6 mt-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-900 h-64 md:h-80 flex items-center shadow-elevated">
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }} />

          <div className="relative z-10 px-12 md:px-20 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-[10px] font-black uppercase tracking-widest mb-6 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              Now Delivering Fresh
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-6 animate-slide-up">
              Straight from the <span className="text-brand-400">Farm</span> <br />
              to your <span className="text-accent-400">Doorstep</span>
            </h1>
            <p className="text-brand-100/70 text-sm md:text-base font-medium max-w-md mb-8 animate-fade-in delay-200">
              Support local farmers and get the freshest organic produce delivered in minutes. Quality you can trust, speed you'll love.
            </p>
          </div>

          {/* Floating Image/Icon */}
          <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden lg:block animate-float">
            <div className="text-[12rem] drop-shadow-2xl grayscale-[0.2] hover:grayscale-0 transition-all duration-700 cursor-default">🧺</div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-12 pb-20">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Sidebar - Category List */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-28 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Categories</h2>
                <div className="w-8 h-px bg-slate-100" />
              </div>

              <nav className="space-y-2">
                {CATEGORIES.map(cat => {
                  const isActive = (category === cat.id || (cat.id === 'all' && !category));
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setParams({ category: cat.id === 'all' ? null : cat.id, page: '1' })}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-100 -translate-y-0.5'
                        : 'hover:bg-white hover:shadow-md hover:shadow-slate-100 text-slate-500'
                        }`}
                    >
                      <span className={`text-2xl transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{cat.img}</span>
                      <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-brand-600'}`}>{cat.label}</span>
                      {isActive && <ChevronRight className="ml-auto w-4 h-4 text-brand-300" />}
                    </button>
                  );
                })}
              </nav>

              {/* Farmer Count Card in Sidebar */}
              <div className="mt-12 p-5 bg-accent-50 rounded-2xl border border-accent-100">
                <p className="text-[10px] font-black text-accent-700 uppercase tracking-widest mb-1">Impact</p>
                <p className="text-xs font-bold text-accent-900 leading-tight">
                  Supporting <span className="text-accent-600">{farmerCount != null ? `${farmerCount}+` : "local"}</span> farmers in your area
                </p>
                <div className="mt-3 flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-accent-200 flex items-center justify-center text-[8px] font-bold">+{farmerCount != null ? Math.max(0, farmerCount - 3) : 12}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <main className="flex-grow">
            <div className="mb-6">
              <MarketplaceSearch
                initialQuery={q}
                initialRadius={radius}
                onSearch={handleSearch}
                onUseLocation={handleUseLocation}
                geoLoading={geoLoading}
              />

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold border border-brand-100">
                  Verified Local Farms
                </span>
                <span className="px-3 py-1.5 rounded-full bg-accent-50 text-accent-700 text-[11px] font-bold border border-accent-100">
                  Freshness Tracking by Harvest Date
                </span>
                <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                  Delivery Radius Filter
                </span>
              </div>

              {lng && lat ? (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 mb-4">
                  <p className="text-xs font-semibold text-emerald-800">
                    Nearby mode active • Radius: {radius} km
                  </p>
                  <button
                    onClick={clearLocationFilter}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    Clear nearby filter
                  </button>
                </div>
              ) : null}
            </div>

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
                  {category ? category.replace('-', ' ') : "Marketplace"}
                </h2>
                <p className="text-sm font-medium text-slate-400 mt-1">Showing the freshest picks from vetted local farms</p>
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm self-start md:self-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort Pick</span>
                <select
                  value={sort}
                  onChange={(e) => setParams({ sort: e.target.value })}
                  className="bg-transparent text-sm font-bold text-brand-600 focus:outline-none cursor-pointer pr-2"
                >
                  <option value="freshest">Freshest</option>
                  <option value="price_low">Budget Friendly</option>
                  <option value="price_high">Premium Quality</option>
                </select>
              </div>
            </header>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-3xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-24 text-center border border-slate-100 shadow-sm">
                <div className="text-7xl mb-8 animate-float">📦</div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">Harvest is coming soon</h2>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">We couldn't find any products in this category right now. Check back in a few hours!</p>
                <button
                  onClick={() => setParams({ category: null })}
                  className="mt-8 px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all active:scale-95"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                {products.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    onAddToCart={addToCart}
                    isBuyer={isBuyer}
                  />
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
