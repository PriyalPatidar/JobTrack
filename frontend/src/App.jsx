
import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  CirclePlus,
  Search,
  Trash2,
  RefreshCw,
  LogOut,
} from "lucide-react";
import Auth from "./Auth";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const statuses = ["Applied", "Assessment", "Interview", "Offer", "Rejected"];

const emptyForm = {
  company: "",
  role: "",
  status: "Applied",
  applied_date: new Date().toISOString().slice(0, 10),
  deadline: "",
  interview_date: "",
  job_url: "",
  notes: "",
};

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("jobtrack_token") || ""
  );
  const [userEmail, setUserEmail] = useState("");
  const [applications, setApplications] = useState([]);
  const [dashboard, setDashboard] = useState({
    total: 0,
    interviews: 0,
    offers: 0,
    pending: 0,
  });
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(accessToken) {
    localStorage.setItem("jobtrack_token", accessToken);
    setToken(accessToken);
    setError("");
  }

  function handleLogout() {
    localStorage.removeItem("jobtrack_token");
    setToken("");
    setUserEmail("");
    setApplications([]);
    setDashboard({ total: 0, interviews: 0, offers: 0, pending: 0 });
    setShowForm(false);
    setError("");
  }

  async function apiFetch(path, options = {}) {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error("Session expire ho gaya. Dobara login karo.");
      }

      return response;
    } catch (err) {
      if (err.name === "TypeError" && err.message.toLowerCase().includes("fetch")) {
        throw new Error(`Backend server se connect nahi ho pa raha (${API}).`);
      }
      throw err;
    }
  }

  async function loadData() {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (query.trim()) params.set("q", query.trim());
      if (statusFilter) params.set("status", statusFilter);

      const [appsRes, dashRes] = await Promise.all([
        apiFetch(`/applications?${params.toString()}`),
        apiFetch("/dashboard"),
      ]);

      if (!appsRes.ok || !dashRes.ok) {
        throw new Error("Data load nahi hua. Retry karke dekho.");
      }

      setApplications(await appsRes.json());
      setDashboard(await dashRes.json());
    } catch (err) {
      setError(err.message || "Backend se connect nahi ho pa raha.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, query, statusFilter]);

  useEffect(() => {
    if (!token) return;

    apiFetch("/auth/me")
      .then(async (response) => {
        if (response.ok) {
          const user = await response.json();
          setUserEmail(user.email);
        }
      })
      .catch(() => {});
  }, [token]);

  const upcoming = useMemo(
    () =>
      applications.filter(
        (a) =>
          a.deadline &&
          a.deadline >= new Date().toISOString().slice(0, 10)
      ).length,
    [applications]
  );

  async function addApplication(e) {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        ...form,
        deadline: form.deadline || null,
        interview_date: form.interview_date || null,
        job_url: form.job_url || null,
        notes: form.notes || null,
      };

      const res = await apiFetch("/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        const detail = data.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : detail?.[0]?.msg || "Application save nahi hui."
        );
      }

      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Application save nahi hui.");
    }
  }

  async function changeStatus(app, status) {
    try {
      const res = await apiFetch(`/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Status update nahi hua.");

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeApplication(id) {
    if (!window.confirm("Is application ko delete karna hai?")) return;

    try {
      const res = await apiFetch(`/applications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Application delete nahi hui.");

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <BriefcaseBusiness size={21} />
          </span>
          <span>JobTrack</span>
        </div>

        <div className="side-label">WORKSPACE</div>
        <div className="nav-item active">
          <ChartNoAxesCombined size={18} /> Dashboard
        </div>
        <div className="nav-item">
          <BriefcaseBusiness size={18} /> Applications
        </div>

        <div className="sidebar-note">
          <div className="note-dot" />
          <div>
            <strong>Keep moving forward</strong>
            <p>One application at a time.</p>
          </div>
        </div>

        <div className="sidebar-footer">
          Your placement journey,
          <br />
          organized in one place.
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR CAREER WORKSPACE</p>
            <h1>Application dashboard</h1>
            <p className="subheading">
              Keep track of every opportunity and next step.
            </p>
            {userEmail && (
              <p className="subheading">Logged in as {userEmail}</p>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="primary-btn"
              onClick={() => setShowForm((v) => !v)}
            >
              <CirclePlus size={17} /> Add application
            </button>

            <button className="secondary-btn" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={loadData}>Retry</button>
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            label="Total applications"
            value={dashboard.total}
            icon={BriefcaseBusiness}
            tone="blue"
          />
          <StatCard
            label="Interviews"
            value={dashboard.interviews}
            icon={CalendarDays}
            tone="purple"
          />
          <StatCard
            label="Offers received"
            value={dashboard.offers}
            icon={ChartNoAxesCombined}
            tone="green"
          />
          <StatCard
            label="Upcoming deadlines"
            value={upcoming}
            icon={CalendarDays}
            tone="orange"
          />
        </section>

        {showForm && (
          <section className="panel form-panel">
            <div className="panel-heading">
              <div>
                <h2>Add a job application</h2>
                <p>Save the details so you can follow up later.</p>
              </div>
              <button
                className="text-btn"
                onClick={() => setShowForm(false)}
              >
                Close
              </button>
            </div>

            <form className="application-form" onSubmit={addApplication}>
              <label>
                Company name *
                <input
                  required
                  maxLength="120"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="e.g. Amazon"
                />
              </label>

              <label>
                Job role *
                <input
                  required
                  maxLength="120"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                  }
                  placeholder="e.g. SDE Intern"
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label>
                Applied date *
                <input
                  required
                  type="date"
                  value={form.applied_date}
                  onChange={(e) =>
                    setForm({ ...form, applied_date: e.target.value })
                  }
                />
              </label>

              <label>
                Deadline
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                />
              </label>

              <label>
                Interview date
                <input
                  type="date"
                  value={form.interview_date}
                  onChange={(e) =>
                    setForm({ ...form, interview_date: e.target.value })
                  }
                />
              </label>

              <label className="wide">
                Job link
                <input
                  type="url"
                  value={form.job_url}
                  onChange={(e) =>
                    setForm({ ...form, job_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </label>

              <label className="wide">
                Notes
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="Recruiter details, next steps, etc."
                />
              </label>

              <div className="form-actions">
                <button className="primary-btn" type="submit">
                  Save application
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => setForm(emptyForm)}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="panel applications-panel">
          <div className="panel-heading">
            <div>
              <h2>Your applications</h2>
              <p>Review and update your job search pipeline.</p>
            </div>
            <button
              className="icon-btn"
              onClick={loadData}
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company or role..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>COMPANY / ROLE</th>
                  <th>APPLIED ON</th>
                  <th>DEADLINE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      Loading applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <div className="empty-icon">
                        <BriefcaseBusiness size={22} />
                      </div>
                      <strong>No applications yet</strong>
                      <p>Add your first job application to get started.</p>
                      <button
                        className="text-btn"
                        onClick={() => setShowForm(true)}
                      >
                        + Add first application
                      </button>
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="company-cell">
                          <span className="company-avatar">
                            {app.company.slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <strong>{app.company}</strong>
                            <p>{app.role}</p>
                            {app.job_url && (
                              <a
                                href={app.job_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View job posting ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{app.applied_date || "—"}</td>
                      <td>{app.deadline || "—"}</td>
                      <td>
                        <select
                          className={`status-select status-${app.status.toLowerCase()}`}
                          value={app.status}
                          onChange={(e) =>
                            changeStatus(app, e.target.value)
                          }
                          aria-label={`Status for ${app.company}`}
                        >
                          {statuses.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          title="Delete application"
                          onClick={() => removeApplication(app.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              {applications.length} application
              {applications.length === 1 ? "" : "s"} shown
            </span>
            <span>JobTrack starter · Keep going ✨</span>
          </div>
        </section>

        <footer className="page-footer">
          Built for your next opportunity <span>•</span> JobTrack
        </footer>
      </main>
    </div>
  );
}
