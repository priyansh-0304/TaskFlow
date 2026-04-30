import React, { useEffect, useState } from "react";
import { projects as projectApi, tasks as taskApi } from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from "recharts";

const COLORS = { TODO: "#6b6b8a", IN_PROGRESS: "#6ab4f7", REVIEW: "#c46af7", DONE: "#6af7a2" };
const PRIORITY_COLORS = { LOW: "#8af7a2", MEDIUM: "#f7e16a", HIGH: "#f7a26a", URGENT: "#f76a6a" };

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([taskApi.dashboard(), projectApi.list(), taskApi.my()])
      .then(([s, p, t]) => { setStats(s.data); setProjects(p.data); setMyTasks(t.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics…</div>;

  const statusData = (stats?.byStatus || []).map(s => ({
    name: s.status.replace("_", " "),
    value: s._count.status,
    color: COLORS[s.status]
  }));

  const priorityData = ["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => ({
    name: p,
    count: myTasks.filter(t => t.priority === p).length,
    color: PRIORITY_COLORS[p]
  }));

  const projectTaskData = projects.map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    tasks: p._count?.tasks || 0,
    members: p._count?.members || 0,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics</h1>
      </div>

      {/* Stat summary */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { num: stats?.projectCount, label: "Projects", color: "var(--accent)" },
          { num: stats?.total, label: "Total Tasks", color: "var(--accent2)" },
          { num: stats?.overdue, label: "Overdue", color: "var(--danger)" },
          { num: stats?.myPendingTasks, label: "My Pending", color: "#6ab4f7" },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-num" style={{ color: s.color }}>{s.num ?? 0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Tasks by Status Pie */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* My Tasks by Priority */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>My Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tasks per Project */}
      <div className="card">
        <h3 style={{ marginBottom: 20, fontSize: 15 }}>Tasks per Project</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={projectTaskData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
            <Bar dataKey="tasks" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Tasks" />
            <Bar dataKey="members" fill="var(--accent2)" radius={[4, 4, 0, 0]} name="Members" />
            <Legend wrapperStyle={{ color: "var(--muted)", fontSize: 13 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}