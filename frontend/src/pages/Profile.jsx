import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const client = axios.create({ baseURL: (import.meta.env.VITE_API_URL || "") + "/api" });
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function Profile() {
  const { user, login } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || "" });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [nameMsg, setNameMsg] = useState({ text: "", error: false });
  const [passMsg, setPassMsg] = useState({ text: "", error: false });
  const [nameLoading, setNameLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const updateName = async (e) => {
    e.preventDefault();
    setNameMsg({ text: "", error: false });
    setNameLoading(true);
    try {
      const res = await client.put("/auth/profile", { name: nameForm.name });
      // Update user in localStorage
      const token = localStorage.getItem("token");
      setNameMsg({ text: "Name updated successfully!", error: false });
    } catch (err) {
      setNameMsg({ text: err.response?.data?.error || "Failed to update name", error: true });
    } finally {
      setNameLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ text: "", error: false });

    if (passForm.newPassword !== passForm.confirmPassword) {
      return setPassMsg({ text: "New passwords don't match", error: true });
    }
    if (passForm.newPassword.length < 6) {
      return setPassMsg({ text: "Password must be at least 6 characters", error: true });
    }

    setPassLoading(true);
    try {
      await client.put("/auth/profile", {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      setPassMsg({ text: "Password updated successfully!", error: false });
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPassMsg({ text: err.response?.data?.error || "Failed to update password", error: true });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profile Settings</h1>
      </div>

      <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Account Info */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
              <div className="muted">{user?.email}</div>
            </div>
          </div>

          {/* Update Name */}
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Update Name</h3>
          <form onSubmit={updateName}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                value={nameForm.name}
                onChange={e => setNameForm({ name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>
            {nameMsg.text && (
              <p style={{ color: nameMsg.error ? "var(--danger)" : "var(--success)", fontSize: 13, marginBottom: 10 }}>
                {nameMsg.error ? "✕ " : "✓ "}{nameMsg.text}
              </p>
            )}
            <button type="submit" className="btn-primary" disabled={nameLoading}>
              {nameLoading ? "Saving…" : "Save Name"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Change Password</h3>
          <form onSubmit={updatePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passForm.currentPassword}
                onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passForm.newPassword}
                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passForm.confirmPassword}
                onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat new password"
                required
              />
            </div>
            {passMsg.text && (
              <p style={{ color: passMsg.error ? "var(--danger)" : "var(--success)", fontSize: 13, marginBottom: 10 }}>
                {passMsg.error ? "✕ " : "✓ "}{passMsg.text}
              </p>
            )}
            <button type="submit" className="btn-primary" disabled={passLoading}>
              {passLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}