import React from "react";
import { WriteReviewForm } from "../ReviewComponents";
import DisputePanel from "../DisputePanel";
import FarmerReviewsInline from "./FarmerReviewsInline";

const Package = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 16h.01" /><path d="M12 16h.01" /><path d="M8 16h.01" /><path d="M3 3h18v18H3z" /><path d="M3 9h18" />
    </svg>
);

const ChevronDown = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const MapPin = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

const XCircle = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
    </svg>
);

export default function BuyerOrderCard({
    order,
    expandedOrder,
    setExpandedOrder,
    getStatusColor,
    handleRemoveItem,
    handleCancelOrder,
    fetchOrders
}) {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden group hover:shadow-elevated transition-shadow duration-500">
            <div className="p-8 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-100 group-hover:bg-brand-50 transition-colors">
                        <Package className="w-8 h-8 group-hover:text-brand-500 transition-colors" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ref: {order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-base font-bold text-slate-900">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{order.totalAmount.toFixed(0)}</p>
                    </div>
                    <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${getStatusColor(order.status)}`}>
                        <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${getStatusColor(order.status).split(' ')[1].replace('text-', 'bg-')}`} />
                            {order.status}
                        </span>
                    </div>
                    <button
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-brand-50 hover:text-brand-600 transition-all border border-slate-100 ${expandedOrder === order._id ? 'rotate-180 bg-brand-50 text-brand-600' : ''}`}
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {expandedOrder === order._id && (
                <div className="px-10 pb-10 pt-4 border-t border-slate-50 animate-fade-in bg-slate-50/30">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Harvest Items</h4>
                            <div className="space-y-3">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-xl">
                                                {item.product?.category === 'vegetables' ? '🥦' : '📦'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{item.product?.name || 'Unavailable Item'}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-slate-900 tracking-tighter">₹{(item.priceAtPurchase * item.quantity).toFixed(0)}</span>
                                            {order.status === "placed" && (
                                                <button
                                                    onClick={() => handleRemoveItem(order._id, item.product?._id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    title="Remove item"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Logistics Info Card */}
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Logistics</h4>
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.deliveryType === 'delivery' ? 'bg-brand-50 text-brand-600' : 'bg-accent-50 text-accent-600'}`}>
                                        {order.deliveryType}
                                    </span>
                                </div>

                                {order.deliveryType === 'delivery' ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Delivery Fee</span>
                                            <span className="font-black text-emerald-600">₹{order.deliveryFee || 0}</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                            <p className="text-xs font-bold text-slate-700">
                                                {order.deliveryAcceptedByFarmer ? "✅ Farmer accepted delivery" : "⏳ Pending farmer acceptance"}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-2xl bg-accent-50 border border-accent-100">
                                            <p className="text-[10px] font-black text-accent-700 uppercase tracking-widest mb-1">Pickup Information</p>
                                            <p className="text-xs font-bold text-accent-900 leading-relaxed italic">
                                                "Please visit the farm to collect your harvest. Show your Order ID at the entrance."
                                            </p>
                                            {order.items[0]?.product?.location && (
                                                <button
                                                    onClick={() => window.open(`https://www.google.com/maps?q=${order.items[0].product.location.coordinates[1]},${order.items[0].product.location.coordinates[0]}`, '_blank')}
                                                    className="mt-3 flex items-center gap-2 text-[10px] font-black text-accent-600 uppercase hover:underline"
                                                >
                                                    <MapPin className="w-3 h-3" /> Get Directions
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {order.status === "delivered" && (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                    <WriteReviewForm
                                        orderId={order._id}
                                        farmerId={order.items[0]?.product?.farmer}
                                        onDone={() => fetchOrders()}
                                    />
                                    {order.items[0]?.product?.farmer && (
                                        <div className="pt-4 border-t border-slate-100">
                                            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">What Other Buyers Say</h5>
                                            <FarmerReviewsInline farmerId={order.items[0].product.farmer} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {["delivered", "disputed"].includes(order.status) && (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <DisputePanel
                                        orderId={order._id}
                                        againstUserId={order.items[0]?.product?.farmer}
                                        existingDispute={order.dispute}
                                        onDisputeCreated={() => fetchOrders()}
                                    />
                                </div>
                            )}

                            {order.status === "placed" && (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center text-2xl mb-4">🏠</div>
                                    <h4 className="text-lg font-black text-slate-900 mb-2 mt-2 uppercase tracking-tighter">Order Processing</h4>
                                    <p className="text-sm font-medium text-slate-400 mb-8 max-w-xs">The farmer is preparing your fresh harvest. You can cancel if it hasn't been accepted yet.</p>
                                    <button
                                        onClick={() => handleCancelOrder(order._id)}
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 font-black text-[10px] tracking-widest uppercase transition-all active:scale-95 border border-slate-100"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        REQUEST CANCELLATION
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
