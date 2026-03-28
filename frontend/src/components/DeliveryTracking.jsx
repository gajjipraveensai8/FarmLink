import React from "react";

export default function DeliveryTracking({ order }) {
  // Example: show delivery status, driver, ETA
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">Delivery Tracking</h3>
      <div className="flex flex-col gap-2">
        <div><span className="font-semibold">Status:</span> {order.deliveryStatus || "Pending"}</div>
        <div><span className="font-semibold">Driver:</span> {order.driverName || "Assigned soon"}</div>
        <div><span className="font-semibold">ETA:</span> {order.eta || "--"}</div>
      </div>
    </div>
  );
}
