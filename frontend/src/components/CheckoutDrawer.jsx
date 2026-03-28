import { useState, useEffect } from "react";
import api from "../api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

export default function CheckoutDrawer({ isOpen, onClose }) {
    const { cart, total, removeItem, updateQty, clearCart } = useCartStore();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();



    const [deliveryType, setDeliveryType] = useState("delivery");
    const [deliveryFee, setDeliveryFee] = useState(25); // Default flat fee
    const [deliveryAddress, setDeliveryAddress] = useState(() => {
        try { return JSON.parse(localStorage.getItem("user"))?.address || ""; } catch { return ""; }
    });

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        if (deliveryType === "delivery" && !deliveryAddress.trim()) {
            toast.error("Please enter your delivery address.");
            setLoading(false);
            return;
        }

        try {
            const orderItems = cart.map(i => ({
                productId: i.productId,
                quantity: i.quantity
            }));

            const res = await api.post("/api/orders", {
                items: orderItems,
                deliveryType: deliveryType,
                deliveryFee: deliveryType === "delivery" ? deliveryFee : 0,
                deliveryAddress: deliveryType === "delivery" ? deliveryAddress.trim() : undefined,
            });

            if (res?.data?.success) {
                toast.success("Order placed successfully!", {
                    icon: '🚀',
                    style: { borderRadius: '12px', background: '#0C831F', color: '#fff' }
                });

                // Clear Cart
                await clearCart();

                // Refresh products in discovery
                window.dispatchEvent(new Event('productsUpdated'));

                onClose();
                navigate("/my-orders");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "";

            // 🔥 CRITICAL: Handle Stale Cart (Product Not Found)
            if (err.response?.status === 404 && msg.includes("Product not found")) {
                const staleId = msg.split(": ").pop();
                toast.error(`Removed stale item from bag: ${staleId}`, { duration: 4000 });

                // Auto-cleanup stale ID
                removeItem(staleId);
            } else {
                toast.error(msg || "Failed to place order");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300">
            <div
                className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Checkout</h2>
                        <p className="text-sm font-bold text-gray-400">{cart.length} items in your bag</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20">
                            <span className="text-6xl mb-4">🛒</span>
                            <h3 className="text-xl font-black text-gray-900">Your bag is empty</h3>
                            <p className="text-gray-400 font-medium px-10">Add some fresh farm products to get started!</p>
                            <button
                                onClick={onClose}
                                className="mt-8 px-8 py-3 bg-yellow-400 rounded-xl font-black text-yellow-900 shadow-lg shadow-yellow-100"
                            >
                                GO SHOPPING
                            </button>
                        </div>
                    ) : (
                        <>
                            {cart.map((item) => (
                                <div key={item.productId} className="flex gap-4 group">
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100">
                                        📦
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-gray-900 truncate pr-2 uppercase text-sm tracking-tight">{item.name}</h4>
                                            <button
                                                onClick={() => removeItem(item.productId)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="font-black text-green-600">₹{item.price * item.quantity}</p>
                                            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                                                <button
                                                    onClick={() => updateQty(item.productId, -1)}
                                                    className="w-6 h-6 flex items-center justify-center font-bold text-gray-400 hover:text-gray-900 hover:bg-white rounded-md transition-all"
                                                >-</button>
                                                <span className="w-8 text-center text-xs font-black text-gray-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQty(item.productId, 1)}
                                                    className="w-6 h-6 flex items-center justify-center font-bold text-gray-400 hover:text-gray-900 hover:bg-white rounded-md transition-all"
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Delivery Options */}
                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Fulfillment Method</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setDeliveryType("delivery")}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 ${deliveryType === "delivery"
                                            ? "border-brand-500 bg-brand-50/50"
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                            }`}
                                    >
                                        <span className="text-2xl">🚚</span>
                                        <div className="text-left">
                                            <p className={`text-xs font-black ${deliveryType === "delivery" ? "text-brand-700" : "text-gray-900"}`}>DELIVERY</p>
                                            <p className="text-[9px] font-bold text-gray-400">Farmer will deliver</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setDeliveryType("pickup")}
                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 ${deliveryType === "pickup"
                                            ? "border-accent-500 bg-accent-50/50"
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                            }`}
                                    >
                                        <span className="text-2xl">🧺</span>
                                        <div className="text-left">
                                            <p className={`text-xs font-black ${deliveryType === "pickup" ? "text-accent-700" : "text-gray-900"}`}>PICKUP</p>
                                            <p className="text-[9px] font-bold text-gray-400">Go to the farm</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Delivery address input — shown when delivery is chosen */}
                                {deliveryType === "delivery" && (
                                    <div className="mt-4">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                            📍 Your Delivery Address <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={deliveryAddress}
                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                            placeholder="e.g. 42 MG Road, 2nd Floor, Bangalore 560001"
                                            rows={2}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm placeholder-gray-300
                                                       focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-all resize-none"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">This address is shared with the delivery agent.</p>
                                    </div>
                                )}

                                {deliveryType === "pickup" && (
                                    <div className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                                        <div className="text-xl">📍</div>
                                        <div>
                                            <p className="text-xs font-black text-blue-900 uppercase">FARMER LOCATION</p>
                                            <p className="text-[10px] font-medium text-blue-700 mt-0.5 leading-relaxed">Exact location will be shared in your order history after placing the order.</p>
                                        </div>
                                    </div>
                                )}
                                {deliveryType === "delivery" && (
                                    <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                                        <div className="text-base">⚡</div>
                                        <p className="text-[10px] font-medium text-emerald-700 leading-relaxed">Delivery is pending farmer's check. You will only pay if the farmer accepts.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-6 bg-white border-t border-gray-100 space-y-4">
                        <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>₹{total}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                <span>{deliveryType === "delivery" ? "Delivery Fee" : "Service Fee"}</span>
                                <span className="text-emerald-600">₹{deliveryType === "delivery" ? deliveryFee : 0}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                <p className="text-2xl font-black text-gray-900 tracking-tighter">₹{total + (deliveryType === "delivery" ? deliveryFee : 0)}</p>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Total Amount</p>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="w-full bg-[#0C831F] hover:bg-[#096e1a] text-white py-5 rounded-2xl font-black text-xl tracking-tighter transition-all active:scale-95 shadow-xl shadow-green-100 disabled:opacity-50"
                        >
                            {loading ? "PLACING ORDER..." : "PLACE ORDER"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
