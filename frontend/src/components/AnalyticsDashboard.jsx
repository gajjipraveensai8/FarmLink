import React from "react";

export default function AnalyticsDashboard({ stats }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Farm Analytics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalProducts}</div>
          <div className="text-gray-500">Products Listed</div>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
          <div className="text-gray-500">Orders Received</div>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <div className="text-2xl font-bold text-emerald-600">₹{stats.totalRevenue}</div>
          <div className="text-gray-500">Total Revenue</div>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
          <div className="text-gray-500">Avg. Rating</div>
        </div>
      </div>
    </div>
  );
}
