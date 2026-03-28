// frontend/src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { fetchUsers, fetchOrders, fetchDisputes } from "../api/admin";
import AdminUserTable from "../components/AdminUserTable";
import AdminOrderTable from "../components/AdminOrderTable";
import AdminDisputePanel from "../components/AdminDisputePanel";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [tab, setTab] = useState("users");

  useEffect(() => {
    fetchUsers().then(r => setUsers(r.data));
    fetchOrders().then(r => setOrders(r.data));
    fetchDisputes().then(r => setDisputes(r.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="flex gap-4 mb-6">
        <button className={`px-4 py-2 rounded ${tab === "users" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setTab("users")}>Users</button>
        <button className={`px-4 py-2 rounded ${tab === "orders" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setTab("orders")}>Orders</button>
        <button className={`px-4 py-2 rounded ${tab === "disputes" ? "bg-blue-600 text-white" : "bg-gray-200"}`} onClick={() => setTab("disputes")}>Disputes</button>
      </div>
      {tab === "users" && <AdminUserTable users={users} setUsers={setUsers} />}
      {tab === "orders" && <AdminOrderTable orders={orders} />}
      {tab === "disputes" && <AdminDisputePanel disputes={disputes} setDisputes={setDisputes} />}
    </div>
  );
}
