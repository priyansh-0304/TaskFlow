import React, { useEffect, useState } from "react";
import { tasks as taskApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { format, isPast } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([taskApi.dashboard(), taskApi.my()])
      .then(([s, t]) => { setStats(s.data); setMyTasks(t.data); })
      .finally(() => setLoading(false));
  }, []);

  const statusColor = { TODO: "#6b6b8a", IN_PROGRESS: "#6ab4f7", REVIEW: "#c46af7", DONE: "#6af7a2" };

  if (loading) return <div className="loading">Loading dashboard…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Good day, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="muted mt-1">Here's what's happening across your projects</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { num: stats?.projectCount ?? 0, label: "Projects", color: "var(--accent)" },
          { num: stats?.total ?? 0, label: "Total Tasks", color: "var(--accent2)" },
          { num: stats?.myPendingTasks ?? 0, label: "My Pending", color: "#6ab4f7" },
          { num: stats?.overdue ?? 0, label: "Overdue", color: "var(--danger)" },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {stats?.byStatus?.length > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Tasks by Status</h3>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {stats.byStatus.map(s => (
              <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor[s.status] || "#6b6b8a" }} />
                <span style={{ fontSize: 13 }}>{s.status.replace("_", " ")}</span>
                <span style={{ fontFamily: "Syne", fontWeight: 700, color: statusColor[s.status] }}>{s._count.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: 16, fontSize: 18 }}>My Assigned Tasks</h2>
      {myTasks.length === 0 ? (
        <div className="empty"><h3>No tasks assigned to you</h3><p>You'll see your tasks here when you get assigned.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {myTasks.map(task => {
            const over = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
            return (
              <div key={task.id} className={`task-item${over ? " overdue" : ""}`}>
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    {task.project?.name} · {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "No due date"}
                    {over && " · ⚠ Overdue"}
                  </div>
                </div>
                <span className={`badge badge-${task.status}`}>{task.status.replace("_", " ")}</span>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}