import React, { useState } from "react";
import { FULFILLMENT_LABELS } from "../../utils/constants";

export default function FarmerOrders({ orders, handleAcceptDelivery, handleUpdateStatus, onAcceptOrder }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-32 text-center border border-slate-100 shadow-sm">
        <div className="text-7xl mb-8 opacity-40">📦</div>
        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight uppercase">No Harvest Orders</h3>
        <p className="text-slate-400 font-medium max-w-sm mx-auto mb-10">When buyers order your products, they will appear here for you to manage.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fulfillment</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {paginatedOrders.map(order => (
            <tr key={order._id} className="hover:bg-slate-50/30 transition-colors group">

              {/* Order ID + Date */}
              <td className="px-8 py-6">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 tracking-tight">#{order._id.slice(-6).toUpperCase()}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </td>

              {/* Buyer */}
              <td className="px-8 py-6">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{order.buyer?.name}</span>
                  <span className="text-[10px] font-medium text-slate-400">{order.buyer?.email}</span>
                  {order.buyer?.phone && (
                    <span className="text-[10px] font-medium text-slate-400">📞 {order.buyer.phone}</span>
                  )}
                </div>
              </td>

              {/* Total + delivery type */}
              <td className="px-8 py-6">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 tracking-tighter">₹{order.totalAmount}</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{order.deliveryType}</span>
                </div>
              </td>

              {/* Fulfillment type */}
              <td className="px-8 py-5">
                {order.farmerFulfillmentType ? (
                  <div className="flex flex-col gap-1">
                    {(() => {
                      const f = FULFILLMENT_LABELS[order.farmerFulfillmentType];
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border ${f.color}`}>
                          {f.emoji} {f.label}
                        </span>
                      );
                    })()}
                    {order.farmerFulfillmentType === "agent_deliver" && order.deliveryPartner && (
                      <span className="text-[10px] text-slate-500">🚴 {order.deliveryPartner.name}</span>
                    )}
                    {order.deliveryAddress && (
                      <span className="text-[10px] text-slate-400 max-w-[120px] truncate" title={order.deliveryAddress}>
                        📍 {order.deliveryAddress}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Pending acceptance</span>
                )}
              </td>

              {/* Status badge */}
              <td className="px-8 py-6">
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  order.status === 'placed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  order.status === 'accepted' ? 'bg-brand-50 text-brand-600 border-brand-100' :
                  order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                  'bg-slate-50 text-slate-500 border-slate-100'
                }`}>
                  {order.status}
                </span>
              </td>

              {/* Action buttons */}
              <td className="px-8 py-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Accept order — opens the Accept modal */}
                  {order.status === 'placed' && (
                    <button
                      onClick={() => onAcceptOrder(order)}
                      className="px-4 py-2 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-sm"
                    >
                      ✅ Accept Order
                    </button>
                  )}

                  {/* Old accept delivery button (legacy delivery-type orders) */}
                  {order.deliveryType === 'delivery' && !order.deliveryAcceptedByFarmer && order.status !== 'cancelled' && order.status !== 'placed' && (
                    <button
                      onClick={() => handleAcceptDelivery(order._id)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-sm transition-all"
                    >
                      Accept Delivery
                    </button>
                  )}

                  {/* Pack / Deliver buttons */}
                  {['accepted', 'packed'].includes(order.status) && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, order.status === 'accepted' ? 'packed' : 'delivered')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                    >
                      {order.status === 'accepted' ? 'Mark Packed' : 'Mark Delivered'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} orders
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
