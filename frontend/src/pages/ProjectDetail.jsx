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
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
  const [memberEmail, setMemberEmail] = useState("");
  const [error, setError] = useState("");

  const load = () => projectApi.get(id).then(r => setProject(r.data)).catch(() => navigate("/projects")).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const isAdmin = project?.myRole === "ADMIN";

  const createTask = async () => {
    if (!taskForm.title.trim()) return setError("Title required");
    try {
      await taskApi.create({ ...taskForm, projectId: id, assigneeId: taskForm.assigneeId || null });
      setTaskModal(false);
      setTaskForm({ title: "", description: "", assigneeId: "", priority: "MEDIUM", dueDate: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || "Failed");
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
    try {
      await projectApi.addMember(id, { email: memberEmail, role: "MEMBER" });
      setMemberModal(false);
      setMemberEmail("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add member");
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm("Remove this member?")) return;
    await projectApi.removeMember(id, userId);
    load();
  };

  const deleteProject = async () => {
    if (!window.confirm("Delete this entire project?")) return;
    await projectApi.delete(id);
    navigate("/projects");
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (!project) return null;

  const tasksByStatus = STATUSES.reduce((acc, s) => ({ ...acc, [s]: (project.tasks || []).filter(t => t.status === s) }), {});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          {project.description && <p className="muted mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button className="btn-ghost btn-sm" onClick={() => { setError(""); setMemberModal(true); }}>+ Member</button>
              <button className="btn-primary btn-sm" onClick={() => { setError(""); setTaskModal(true); }}>+ Task</button>
              <button className="btn-danger btn-sm" onClick={deleteProject}>Delete Project</button>
            </>
          )}
          {!isAdmin && <button className="btn-primary btn-sm" onClick={() => { setError(""); setTaskModal(true); }}>+ Task</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: 24 }}>
        {["kanban", "members"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={tab === t ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
            style={{ textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      {tab === "kanban" && (
        <div className="kanban">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <span>{status.replace("_", " ")}</span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{tasksByStatus[status].length}</span>
              </div>
              <div className="kanban-tasks">
                {tasksByStatus[status].map(task => {
                  const over = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
                  return (
                    <div key={task.id} className="kanban-task" style={over ? { borderColor: "var(--danger)" } : {}}>
                      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{task.title}</div>
                      {task.assignee && <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>→ {task.assignee.name}</div>}
                      <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {task.dueDate && <span style={{ color: over ? "var(--danger)" : "var(--muted)", fontSize: 11 }}>{format(new Date(task.dueDate), "MMM d")}</span>}
                      </div>
                      <div className="flex gap-1 mt-2" style={{ flexWrap: "wrap" }}>
                        {STATUSES.filter(s => s !== status).map(s => (
                          <button key={s} className="btn-ghost btn-sm" style={{ fontSize: 10, padding: "3px 7px" }}
                            onClick={() => updateStatus(task.id, s)}>→ {s.replace("_", " ")}</button>
                        ))}
                        {isAdmin && <button className="btn-danger btn-sm" style={{ fontSize: 10, padding: "3px 7px" }} onClick={() => deleteTask(task.id)}>✕</button>}
                      </div>
                    </div>
                  );
                })}
                {tasksByStatus[status].length === 0 && <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "12px 0" }}>Empty</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "members" && (
        <div style={{ maxWidth: 500 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Team Members</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(project.members || []).map(m => (
                <div key={m.id} className="member-item justify-between">
                  <div className="flex items-center gap-3">
                    <div className="avatar">{m.user.name[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{m.user.name}</div>
                      <div className="muted">{m.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${m.role}`}>{m.role}</span>
                    {isAdmin && m.user.id !== user.id && (
                      <button className="btn-danger btn-sm" style={{ fontSize: 11, padding: "3px 8px" }}
                        onClick={() => removeMember(m.user.id)}>Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {taskModal && (
        <div className="modal-overlay" onClick={() => setTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Task</h2>
            <div className="form-group"><label>Title</label><input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" /></div>
            <div className="form-group"><label>Description</label><textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional…" style={{ resize: "vertical" }} /></div>
            <div className="form-group">
              <label>Assign To</label>
              <select value={taskForm.assigneeId} onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))}>
                <option value="">Unassigned</option>
                {(project.members || []).map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
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

      {/* Member Modal */}
      {memberModal && (
        <div className="modal-overlay" onClick={() => setMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Member</h2>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="teammate@example.com" />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="actions">
              <button className="btn-ghost" onClick={() => { setMemberModal(false); setError(""); }}>Cancel</button>
              <button className="btn-primary" onClick={addMember}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}