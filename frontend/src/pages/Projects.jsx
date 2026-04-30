import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { projects as projectApi } from "../api/client";
import { format } from "date-fns";

export default function Projects() {
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const load = () => projectApi.list().then(r => setProjectList(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return setError("Name required");
    try {
      await projectApi.create(form);
      setShowModal(false);
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || "Failed to create");
    }
  };

  if (loading) return <div className="loading">Loading projects…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projectList.length === 0 ? (
        <div className="empty">
          <h3>No projects yet</h3>
          <p>Create your first project to get started.</p>
          <button className="btn-primary mt-3" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="grid-2">
          {projectList.map(p => (
            <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: "none" }}>
              <div className="card" style={{ cursor: "pointer", transition: "border-color 0.2s", borderColor: "var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <h3 style={{ fontSize: 17 }}>{p.name}</h3>
                  <span className={`badge badge-${p.myRole}`}>{p.myRole}</span>
                </div>
                {p.description && <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{p.description}</p>}
                <div className="flex gap-3 muted" style={{ fontSize: 12 }}>
                  <span>👥 {p._count?.members || 0} members</span>
                  <span>✅ {p._count?.tasks || 0} tasks</span>
                  <span>📅 {format(new Date(p.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Project</h2>
            <div className="form-group">
              <label>Project Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Marketing Campaign" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Optional description…" style={{ resize: "vertical" }} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="actions">
              <button className="btn-ghost" onClick={() => { setShowModal(false); setError(""); }}>Cancel</button>
              <button className="btn-primary" onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}