import React from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
//import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar">
      <span className="navbar-logo">Task<span>Flow</span></span>
      <div className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Dashboard</NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Projects</NavLink>
      </div>
      <div className="flex items-center gap-3">
        <NavLink to="/profile" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
            {user?.name}
        </NavLink>
        <button className="btn-ghost btn-sm" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
      <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}