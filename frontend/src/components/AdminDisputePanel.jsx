// frontend/src/components/AdminDisputePanel.jsx
import React from "react";
import { resolveDispute } from "../api/admin";

export default function AdminDisputePanel({ disputes, setDisputes }) {
  const handleResolve = async (id) => {
    const status = prompt("Enter new status (resolved/rejected):");
    const note = prompt("Enter resolution note:");
    await resolveDispute(id, status, note);
    setDisputes(ds => ds.map(d => d._id === id ? { ...d, status, resolutionNote: note } : d));
  };
  return (
    <table className="min-w-full bg-white border">
      <thead>
        <tr>
          <th className="p-2 border">Dispute ID</th>
          <th className="p-2 border">Order</th>
          <th className="p-2 border">Raised By</th>
          <th className="p-2 border">Status</th>
          <th className="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {disputes.map(dispute => (
          <tr key={dispute._id}>
            <td className="p-2 border">{dispute._id}</td>
            <td className="p-2 border">{dispute.order?._id || "-"}</td>
            <td className="p-2 border">{dispute.raisedBy?.name || "-"}</td>
            <td className="p-2 border">{dispute.status}</td>
            <td className="p-2 border">
              <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleResolve(dispute._id)}>Resolve</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
