import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FarmerProducts from "../components/dashboard/FarmerProducts";
import FarmerOrders from "../components/dashboard/FarmerOrders";
import FarmerAnalytics from "../components/dashboard/FarmerAnalytics";
import AddProductModal from "../components/dashboard/AddProductModal";
import AcceptOrderModal from "../components/dashboard/AcceptOrderModal";

const Plus = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
);

const Package = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
  </svg>
);

const IndianRupee = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" />
  </svg>
);

const Rocket = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const categories = [
  { id: 'vegetables', label: 'Vegetables', img: '🥦' },
  { id: 'fruits', label: 'Fruits', img: '🍎' },
  { id: 'milk', label: 'Milk & Dairy', img: '🥛' },
  { id: 'eggs', label: 'Fresh Eggs', img: '🥚' },
  { id: 'other', label: 'Other Harvests', img: '📦' }
];

export default function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ totalOrders: 0, revenue: 0, unitsSold: 0 });
  const [insights, setInsights] = useState({ topProducts: [], categoryBreakdown: [], demandTrends: [], rating: { average: 0, total: 0 }, repeatBuyers: [] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingAcceptOrder, setPendingAcceptOrder] = useState(null); // the order awaiting accept-modal
  const [isSuspended, setIsSuspended] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check suspension from localStorage first, then verify with server
  useEffect(() => {
    const stored = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
    if (stored?.blocked) setIsSuspended(true);
    // Re-check from server to get latest status
    api.get("/api/auth/me").then(({ data }) => {
      if (data?.blocked) {
        setIsSuspended(true);
        // Update cache
        try { localStorage.setItem("user", JSON.stringify({ ...stored, blocked: true })); } catch { }
      }
    }).catch(() => { });
  }, []);

  // Get logged-in user name from localStorage
  const farmerName = (() => {
    try { return JSON.parse(localStorage.getItem("user"))?.name || "Farmer"; } catch { return "Farmer"; }
  })();

  const getUnit = (category) => {
    switch (category?.toLowerCase()) {
      case "vegetables": case "fruits": return "Kg";
      case "milk": return "Litre";
      case "eggs": return "Unit";
      default: return "Unit";
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, anaRes, ordRes] = await Promise.all([
        api.get("/api/products/my"),
        api.get("/api/dashboard/farmer/enhanced"),
        api.get("/api/orders/farmer")
      ]);
      setProducts(prodRes?.data?.products || []);
      setOrders(ordRes?.data || []);

      const anaData = anaRes?.data || {};
      setInsights({
        topProducts: anaData.topProducts || [],
        categoryBreakdown: anaData.categoryBreakdown || [],
        demandTrends: anaData.demandTrends || [],
        rating: anaData.rating || { average: 0, total: 0 },
        repeatBuyers: anaData.repeatBuyers || [],
      });
      setAnalytics({
        totalOrders: Number(anaData.totalOrders || anaData.topProducts?.reduce((sum, p) => sum + p.orderCount, 0) || 0),
        revenue: Number(anaData.revenue || anaData.categoryBreakdown?.reduce((sum, c) => sum + c.revenue, 0) || 0),
        unitsSold: Number(anaData.unitsSold || anaData.categoryBreakdown?.reduce((sum, c) => sum + c.totalSold, 0) || 0),
      });
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      console.error(err);
      setError("Failed to sync some dashboard data, but your products are shown below.");
      try {
        const prodRes = await api.get("/api/products/my");
        setProducts(prodRes?.data?.products || []);
      } catch (e) {
        setError(`Crucial dashboard data inaccessible: ${e.response?.data?.message || e.message}. Please refresh.`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    toast((t) => (
      <span className="flex items-center gap-3">
        Delete this product?
        <button
          className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg"
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.delete(`/api/products/${id}`);
              setError(null);
              toast.success("Product removed");
              window.dispatchEvent(new Event('productsUpdated'));
              fetchData();
            } catch (err) {
              if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
              toast.error("Delete failed");
            }
          }}
        >Yes, Delete</button>
        <button className="text-xs font-bold px-2 py-1" onClick={() => toast.dismiss(t.id)}>Keep</button>
      </span>
    ), { duration: 6000 });
  };

  const handleAcceptDelivery = async (id) => {
    try {
      await api.patch(`/api/orders/${id}/accept-delivery`);
      toast.success("Delivery accepted!");
      fetchData();
    } catch (err) {
      toast.error("Failed to accept delivery");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/api/orders/${id}/status`, { status: status });
      toast.success(`Order ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
    }
  };

  /* ── Accept order modal ── */
  const handleOpenAcceptModal = (order) => setPendingAcceptOrder(order);
  const handleCloseAcceptModal = () => setPendingAcceptOrder(null);

  const handleConfirmAccept = async ({ farmerFulfillmentType, deliveryPartnerId, deliveryAddress }) => {
    if (!pendingAcceptOrder) return;
    try {
      await api.patch(`/api/orders/${pendingAcceptOrder._id}/status`, {
        status: "accepted",
        farmerFulfillmentType,
        deliveryPartnerId,
        deliveryAddress,
      });
      toast.success("Order accepted!");
      setPendingAcceptOrder(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept order");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <Navbar />

      {/* Main Header / Hero Section */}
      <div className="pt-20 pb-40 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #1e3a5f 70%, #0f172a 100%)' }}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl -ml-32 -mb-32" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-600/5 rounded-full blur-3xl" />

        {/* Suspension Banner */}
        {isSuspended && (
          <div className="relative z-20 max-w-7xl mx-auto px-6 pt-6">
            <div className="bg-red-500/20 border border-red-400/40 rounded-2xl px-6 py-5 flex items-start gap-4 backdrop-blur-sm">
              <span className="text-2xl flex-shrink-0">🚫</span>
              <div>
                <p className="text-white font-black text-base mb-1">Account Suspended</p>
                <p className="text-red-200 text-sm font-medium">You have received 3 or more buyer disputes. You cannot list or modify products until an admin reviews your account. Please contact support to appeal.</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 relative z-10 mt-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="flex items-center gap-6 md:gap-8">
              <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-[1.5rem] md:rounded-[2rem] bg-brand-500 flex items-center justify-center text-4xl md:text-5xl shadow-elevated animate-float">
                👨‍🌾
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                  Farmer Portal
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.1] mb-3 truncate">Welcome back, <span className="text-brand-400">{farmerName}</span></h1>
                <p className="text-white/50 font-medium text-base md:text-lg">Your farm is looking healthy. Here's your performance summary.</p>
              </div>
            </div>

            {!isSuspended && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white font-black px-8 md:px-10 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-black/30 hover:-translate-y-1 active:scale-95 group whitespace-nowrap self-start lg:self-center"
              >
                <Plus className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform" />
                LIST NEW PRODUCE
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          {[
            { label: "Total Revenue", value: `₹${analytics.revenue.toLocaleString()}`, icon: <IndianRupee className="w-6 h-6 md:w-7 md:h-7" />, color: "text-brand-600", bg: "bg-brand-50", border: "border-brand-100" },
            { label: "Active Orders", value: analytics.totalOrders, icon: <Package className="w-6 h-6 md:w-7 md:h-7" />, color: "text-accent-600", bg: "bg-accent-50", border: "border-accent-100" },
            { label: "Units Harvested", value: analytics.unitsSold, icon: <Rocket className="w-6 h-6 md:w-7 md:h-7" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-premium border border-slate-100 flex flex-row items-center gap-4 md:gap-8 group hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 min-w-0">
              <div className={`w-12 h-12 md:w-16 md:h-16 flex-shrink-0 ${stat.bg} ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                {stat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{stat.label}</p>
                <p className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter truncate">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs - Modern Underline Style */}
        <div className="flex border-b border-slate-200 mb-12 gap-12 px-2 overflow-x-auto no-scrollbar">
          {[
            { id: "products", label: "Inventory" },
            { id: "orders", label: "Recent Orders" },
            { id: "analytics", label: "Insights" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-black tracking-widest uppercase transition-all relative ${activeTab === tab.id
                ? "text-brand-600"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-500 rounded-t-full animate-fade-in" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "products" && (
            <FarmerProducts
              products={products}
              getUnit={getUnit}
              handleDelete={handleDelete}
              setShowAddForm={setShowAddForm}
            />
          )}

          {activeTab === "orders" && (
            <FarmerOrders
              orders={orders}
              handleAcceptDelivery={handleAcceptDelivery}
              handleUpdateStatus={handleUpdateStatus}
              onAcceptOrder={handleOpenAcceptModal}
            />
          )}

          {activeTab === "analytics" && (
            <FarmerAnalytics insights={insights} />
          )}
        </div>
      </div>

      {/* Add Product Sidebar / Drawer */}
      {!isSuspended && (
        <AddProductModal
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          getUnit={getUnit}
          fetchData={fetchData}
          categories={categories}
        />
      )}

      {/* Accept Order Modal */}
      {pendingAcceptOrder && (
        <AcceptOrderModal
          order={pendingAcceptOrder}
          onClose={handleCloseAcceptModal}
          onConfirm={handleConfirmAccept}
        />
      )}
    </div>
  );
}
