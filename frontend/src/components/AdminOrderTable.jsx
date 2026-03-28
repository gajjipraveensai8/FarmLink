// frontend/src/components/AdminOrderTable.jsx
import React from "react";

export default function AdminOrderTable({ orders }) {
  return (
    <table className="min-w-full bg-white border">
      <thead>
        <tr>
          <th className="p-2 border">Order ID</th>
          <th className="p-2 border">Buyer</th>
          <th className="p-2 border">Farmer</th>
          <th className="p-2 border">Status</th>
          <th className="p-2 border">Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order._id}>
            <td className="p-2 border">{order._id}</td>
            <td className="p-2 border">{order.buyer?.name || "-"}</td>
            <td className="p-2 border">{order.farmer?.name || "-"}</td>
            <td className="p-2 border">{order.status}</td>
            <td className="p-2 border">₹{order.totalAmount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
