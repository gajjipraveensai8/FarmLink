import { useState, useEffect, useCallback } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { SubscriptionsList } from "../components/SubscriptionComponents";
import BuyerOrderCard from "../components/dashboard/BuyerOrderCard";

export default function BuyerOrders() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/orders/my");
      setOrders(res?.data?.orders || []);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError("Failed to load your orders. Let's try again.");
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancelOrder = async (id) => {
    toast((t) => (
      <span className="flex items-center gap-3">
        Cancel this order?
        <button
          className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg"
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.patch(`/api/orders/${id}/cancel`, { reason: "User cancelled" });
              setError(null);
              toast.success("Order cancelled");
              fetchOrders();
            } catch (err) {
              if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
              toast.error(err.response?.data?.message || "Cancellation failed");
            }
          }}
        >Yes, Cancel</button>
        <button className="text-xs font-bold px-2 py-1" onClick={() => toast.dismiss(t.id)}>Keep</button>
      </span>
    ), { duration: 6000 });
  };

  const handleRemoveItem = async (orderId, productId) => {
    toast((t) => (
      <span className="flex items-center gap-3">
        Remove this item?
        <button
          className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg"
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await api.delete(`/api/orders/${orderId}/items/${productId}`);
              toast.success("Item removed");
              fetchOrders();
            } catch (err) {
              toast.error(err.response?.data?.message || "Failed to remove item");
            }
          }}
        >Yes, Remove</button>
        <button className="text-xs font-bold px-2 py-1" onClick={() => toast.dismiss(t.id)}>Keep</button>
      </span>
    ), { duration: 6000 });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "placed": return "bg-blue-50 text-blue-600 border-blue-100";
      case "packed": return "bg-accent-50 text-accent-600 border-accent-100";
      case "accepted": return "bg-brand-50 text-brand-600 border-brand-100";
      case "delivered": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "cancelled": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <Navbar />

      <div className="bg-brand-900 pt-16 pb-32 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-[2rem] bg-accent-500 flex items-center justify-center text-5xl shadow-elevated animate-float">
              🛒
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                Order Tracking
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">Your <span className="text-brand-400">Orders</span></h1>
              <p className="text-brand-100/60 font-medium text-lg">Manage your purchases and subscriptions from local farms.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-16">
        {/* Navigation Tabs - Modern Underline Style */}
        <div className="flex bg-white/50 backdrop-blur-md border border-white rounded-[2.5rem] p-2 mb-12 shadow-premium overflow-hidden">
          {[
            { id: "orders", label: "Harvest Orders" },
            { id: "subscriptions", label: "Farm Updates" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-grow py-4 rounded-[2rem] text-sm font-black tracking-widest uppercase transition-all duration-300 ${activeTab === tab.id
                ? "bg-brand-600 text-white shadow-lg shadow-brand-100"
                : "text-slate-400 hover:text-brand-600"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "orders" ? (
          <div className="space-y-8">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse shadow-sm border border-slate-50" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-32 text-center border border-slate-100 shadow-sm">
                <div className="text-7xl mb-8 opacity-40">📦</div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase">Empty Basket</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10">You haven't placed any orders yet. The harvest is waiting for you in the marketplace!</p>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="px-10 py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-100 hover:bg-brand-700 active:scale-95"
                >
                  Go to Marketplace
                </button>
              </div>
            ) : (
              orders.map(order => (
                <BuyerOrderCard
                  key={order._id}
                  order={order}
                  expandedOrder={expandedOrder}
                  setExpandedOrder={setExpandedOrder}
                  getStatusColor={getStatusColor}
                  handleRemoveItem={handleRemoveItem}
                  handleCancelOrder={handleCancelOrder}
                  fetchOrders={fetchOrders}
                />
              ))
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-10">
            <SubscriptionsList />
          </div>
        )}
      </div>
    </div>
  );
}
