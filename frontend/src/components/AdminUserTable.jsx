// frontend/src/components/AdminUserTable.jsx
import React from "react";
import { blockUser, unblockUser, approveFarmer, rejectFarmer } from "../api/admin";

export default function AdminUserTable({ users, setUsers }) {
  const handleBlock = async (id) => {
    await blockUser(id);
    setUsers(users => users.map(u => u._id === id ? { ...u, blocked: true } : u));
  };
  const handleUnblock = async (id) => {
    await unblockUser(id);
    setUsers(users => users.map(u => u._id === id ? { ...u, blocked: false } : u));
  };
  const handleApprove = async (id) => {
    await approveFarmer(id);
    setUsers(users => users.map(u => u._id === id ? { ...u, verificationStatus: "verified" } : u));
  };
  const handleReject = async (id) => {
    const note = prompt("Enter rejection note:");
    await rejectFarmer(id, note);
    setUsers(users => users.map(u => u._id === id ? { ...u, verificationStatus: "rejected", verificationNote: note } : u));
  };
  return (
    <table className="min-w-full bg-white border">
      <thead>
        <tr>
          <th className="p-2 border">Name</th>
          <th className="p-2 border">Email</th>
          <th className="p-2 border">Role</th>
          <th className="p-2 border">Status</th>
          <th className="p-2 border">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user._id} className={user.blocked ? "bg-red-100" : ""}>
            <td className="p-2 border">{user.name}</td>
            <td className="p-2 border">{user.email}</td>
            <td className="p-2 border">{user.role}</td>
            <td className="p-2 border">{user.blocked ? "Blocked" : "Active"}</td>
            <td className="p-2 border flex gap-2">
              {!user.blocked ? (
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleBlock(user._id)}>Block</button>
              ) : (
                <button className="bg-green-500 text-white px-2 py-1 rounded" onClick={() => handleUnblock(user._id)}>Unblock</button>
              )}
              {user.role === "farmer" && user.verificationStatus === "pending" && (
                <>
                  <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleApprove(user._id)}>Approve</button>
                  <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleReject(user._id)}>Reject</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
