import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projects as projectApi, tasks as taskApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { format, isPast } from "date-fns";

const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("kanban");
  const [taskModal, setTaskModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [filters, setFilters] = useState({ search: "", priority: "", assignee: "", overdue: false });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [error, setError] = useState("");

  const load = () =>
    projectApi.get(id)
      .then(r => setProject(r.data))
      .catch(() => navigate("/projects"))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const isAdmin = project?.myRole === "ADMIN";

  const createTask = async () => {
    if (!taskForm.title.trim()) return setError("Title required");
    try {
      await taskApi.create({ ...taskForm, projectId: id, assigneeId: taskForm.assigneeId || null });
      setTaskModal(false);
      setTaskForm({ title: "", description: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
      setError("");
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || "Failed to create task");
    }
  };

  const updateStatus = async (taskId, status) => {
    await taskApi.update(taskId, { status });
    load();
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    await taskApi.delete(taskId);
    load();
  };

  const addMember = async () => {
    if (!memberEmail.trim()) return setError("Email required");
    try {
      await projectApi.addMember(id, { email: memberEmail, role: memberRole });
      setMemberModal(false);
      setMemberEmail("");
      setMemberRole("MEMBER");
      setError("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add member");
    }
  };

  const updateMemberRole = async (userId, currentRole) => {
    const newRole = currentRole === "ADMIN" ? "MEMBER" : "ADMIN";
    if (!window.confirm(`Change this member to ${newRole}?`)) return;
    try {
      await projectApi.updateMemberRole(id, userId, newRole);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update role");
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this member?")) return;
    await projectApi.removeMember(id, userId);
    load();
  };

  const deleteProject = async () => {
    if (!window.confirm("Delete this entire project? This cannot be undone.")) return;
    await projectApi.delete(id);
    navigate("/projects");
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (!project) return null;

  // ✅ filteredTasks is now correctly used for tasksByStatus
  const filteredTasks = (project?.tasks || []).filter(task => {
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee && task.assigneeId !== filters.assignee) return false;
    if (filters.overdue && !(task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE")) return false;
    return true;
  });

  // ✅ Uses filteredTasks (was incorrectly using project.tasks before)
  const tasksByStatus = STATUSES.reduce((acc, s) => ({
    ...acc,
    [s]: filteredTasks.filter(t => t.status === s)
  }), {});

  const activeFilters = filters.search || filters.priority || filters.assignee || filters.overdue;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          {project.description && <p className="muted mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button className="btn-ghost btn-sm" onClick={() => { setError(""); setMemberModal(true); }}>
                + Member
              </button>
              <button className="btn-primary btn-sm" onClick={() => { setError(""); setTaskModal(true); }}>
                + Task
              </button>
              <button className="btn-danger btn-sm" onClick={deleteProject}>
                Delete Project
              </button>
            </>
          )}
          {!isAdmin && (
            <button className="btn-primary btn-sm" onClick={() => { setError(""); setTaskModal(true); }}>
              + Task
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: 24 }}>
        {["kanban", "members"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
            style={{ textTransform: "capitalize" }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── KANBAN TAB ── */}
      {tab === "kanban" && (
        <>
          {/* Filter Bar */}
          <div className="card" style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              placeholder="🔍 Search tasks…"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{ width: 200 }}
            />
            <select
              value={filters.priority}
              onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
              style={{ width: 140 }}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={filters.assignee}
              onChange={e => setFilters(f => ({ ...f, assignee: e.target.value }))}
              style={{ width: 160 }}
            >
              <option value="">All Members</option>
              {(project?.members || []).map(m => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={e => setFilters(f => ({ ...f, overdue: e.target.checked }))}
                style={{ width: "auto" }}
              />
              Overdue only
            </label>
            {activeFilters && (
              <button
                className="btn-ghost btn-sm"
                onClick={() => setFilters({ search: "", priority: "", assignee: "", overdue: false })}
              >
                ✕ Clear filters
              </button>
            )}
            {activeFilters && (
              <span className="muted" style={{ fontSize: 12, marginLeft: "auto" }}>
                {filteredTasks.length} of {project.tasks.length} tasks
              </span>
            )}
          </div>

          {/* Kanban Board */}
          <div className="kanban">
            {STATUSES.map(status => (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header">
                  <span>{status.replace("_", " ")}</span>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>
                    {tasksByStatus[status].length}
                  </span>
                </div>

                <div className="kanban-tasks">
                  {tasksByStatus[status].map(task => {
                    const over = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
                    return (
                      <div
                        key={task.id}
                        className="kanban-task"
                        style={over ? { borderColor: "var(--danger)" } : {}}
                      >
                        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
                          {task.title}
                        </div>

                        {task.description && (
                          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>
                            {task.description.length > 60
                              ? task.description.slice(0, 60) + "…"
                              : task.description}
                          </div>
                        )}

                        {task.assignee && (
                          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>
                            → {task.assignee.name}
                          </div>
                        )}

                        <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                          {task.dueDate && (
                            <span style={{ color: over ? "var(--danger)" : "var(--muted)", fontSize: 11 }}>
                              📅 {format(new Date(task.dueDate), "MMM d")}
                              {over && " ⚠"}
                            </span>
                          )}
                        </div>

                        {/* Status change buttons */}
                        <div className="flex gap-1 mt-2" style={{ flexWrap: "wrap" }}>
                          {STATUSES.filter(s => s !== status).map(s => (
                            <button
                              key={s}
                              className="btn-ghost btn-sm"
                              style={{ fontSize: 10, padding: "3px 7px" }}
                              onClick={() => updateStatus(task.id, s)}
                            >
                              → {s.replace("_", " ")}
                            </button>
                          ))}
                          {isAdmin && (
                            <button
                              className="btn-danger btn-sm"
                              style={{ fontSize: 10, padding: "3px 7px" }}
                              onClick={() => deleteTask(task.id)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {tasksByStatus[status].length === 0 && (
                    <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                      {activeFilters ? "No matches" : "Empty"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div style={{ maxWidth: 520 }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3>Team Members</h3>
              <span className="muted" style={{ fontSize: 13 }}>{project.members.length} member{project.members.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(project.members || []).map(m => (
                <div key={m.id} className="member-item justify-between">
                  <div className="flex items-center gap-3">
                    <div className="avatar">{m.user.name[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {m.user.name}
                        {m.user.id === user.id && (
                          <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>(you)</span>
                        )}
                      </div>
                      <div className="muted">{m.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                    {isAdmin && m.user.id !== user.id && (
                      <>
                        <button
                          className="btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: "3px 8px" }}
                          onClick={() => updateMemberRole(m.user.id, m.role)}
                        >
                          → {m.role === "ADMIN" ? "MEMBER" : "ADMIN"}
                        </button>
                        <button
                          className="btn-danger btn-sm"
                          style={{ fontSize: 11, padding: "3px 8px" }}
                          onClick={() => removeMember(m.user.id)}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TASK MODAL ── */}
      {taskModal && (
        <div className="modal-overlay" onClick={() => { setTaskModal(false); setError(""); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Task</h2>
            <div className="form-group">
              <label>Title *</label>
              <input
                value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Task title"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Optional details…"
                style={{ resize: "vertical" }}
              />
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select
                value={taskForm.assigneeId}
                onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {(project.members || []).map(m => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="actions">
              <button className="btn-ghost" onClick={() => { setTaskModal(false); setError(""); }}>Cancel</button>
              <button className="btn-primary" onClick={createTask}>Create Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBER MODAL ── */}
      {memberModal && (
        <div className="modal-overlay" onClick={() => { setMemberModal(false); setError(""); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Member</h2>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                placeholder="teammate@example.com"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="actions">
              <button className="btn-ghost" onClick={() => { setMemberModal(false); setError(""); }}>Cancel</button>
              <button className="btn-primary" onClick={addMember}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}