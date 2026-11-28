import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { http } from '../hooks/useApi.js';

const STATUS_COLORS = {
  pending: { bg: '#fffbeb', color: '#92400e', border: '#fcd34d', label: 'Pending' },
  accepted: { bg: '#f0fdf4', color: '#15803d', border: '#86efac', label: 'Accepted' },
  rejected: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: 'Rejected' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 12px',
        borderRadius: 999,
        fontSize: '.82rem',
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState(null); // id of report being acted on

  const token = sessionStorage.getItem('adminToken');

  const authHeaders = useCallback(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate('/admin', { replace: true });
    }
  }, [token, navigate]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await http.get('/admin/reports', authHeaders());
      setReports(res.data.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        sessionStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
        return;
      }
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, navigate]);

  useEffect(() => {
    if (token) fetchReports();
  }, [token, fetchReports]);

  // Accept / Reject
  const handleAction = async (id, action) => {
    setActing(id);
    try {
      const res = await http.patch(`/admin/reports/${id}`, { action }, authHeaders());
      setReports((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
    } catch (err) {
      if (err?.response?.status === 401) {
        sessionStorage.removeItem('adminToken');
        navigate('/admin', { replace: true });
        return;
      }
      alert('Action failed. Please try again.');
    } finally {
      setActing(null);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await http.post('/admin/logout', {}, authHeaders());
    } catch {
      // ignore
    }
    sessionStorage.removeItem('adminToken');
    navigate('/admin', { replace: true });
  };

  const filtered =
    filter === 'all' ? reports : reports.filter((r) => (r.status || 'pending') === filter);

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => (r.status || 'pending') === 'pending').length,
    accepted: reports.filter((r) => r.status === 'accepted').length,
    rejected: reports.filter((r) => r.status === 'rejected').length,
  };

  if (!token) return null;

  return (
    <PageShell className="cs-admin">
      {/* Header bar */}
      <div className="cs-admin__header">
        <div>
          <h1 className="cs-title" style={{ margin: 0 }}>
            Admin Dashboard
          </h1>
          <p className="cs-muted" style={{ margin: '4px 0 0' }}>
            Review and manage scam reports
          </p>
        </div>
        <button className="cs-btn cs-btn--ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Stats cards */}
      <div className="cs-admin__stats">
        <div className="cs-admin__stat cs-admin__stat--total">
          <span className="cs-admin__stat-num">{counts.all}</span>
          <span className="cs-admin__stat-label">Total Reports</span>
        </div>
        <div className="cs-admin__stat cs-admin__stat--pending">
          <span className="cs-admin__stat-num">{counts.pending}</span>
          <span className="cs-admin__stat-label">Pending</span>
        </div>
        <div className="cs-admin__stat cs-admin__stat--accepted">
          <span className="cs-admin__stat-num">{counts.accepted}</span>
          <span className="cs-admin__stat-label">Accepted</span>
        </div>
        <div className="cs-admin__stat cs-admin__stat--rejected">
          <span className="cs-admin__stat-num">{counts.rejected}</span>
          <span className="cs-admin__stat-label">Rejected</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="cs-admin__filters">
        {['all', 'pending', 'accepted', 'rejected'].map((f) => (
          <button
            key={f}
            className={`cs-chip${filter === f ? ' is-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
          </button>
        ))}
        <button
          className="cs-btn cs-btn--ghost"
          onClick={fetchReports}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="cs-formerr">{error}</div>}

      {/* Loading */}
      {loading && !reports.length && (
        <div className="cs-empty">
          <p>Loading reports…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="cs-empty">
          <p style={{ fontSize: '2.5rem', margin: 0 }}>📋</p>
          <p>
            {filter === 'all'
              ? 'No reports submitted yet.'
              : `No ${filter} reports found.`}
          </p>
        </div>
      )}

      {/* Report cards */}
      <div className="cs-admin__list">
        {filtered.map((report) => (
          <div key={report.id} className="cs-admin__report">
            <div className="cs-admin__report-header">
              <StatusBadge status={report.status || 'pending'} />
              <span className="cs-admin__report-channel">
                {report.channel?.toUpperCase()}
              </span>
              <span className="cs-admin__report-date">
                {new Date(report.receivedAt).toLocaleString()}
              </span>
            </div>

            <div className="cs-admin__report-body">
              <p className="cs-admin__report-id">
                <strong>ID:</strong>{' '}
                <code>{report.id}</code>
              </p>
              <div className="cs-admin__report-message">
                <strong>Scam Message:</strong>
                <p>{report.message}</p>
              </div>
              {report.contact && (
                <p>
                  <strong>Contact Info:</strong> {report.contact}
                </p>
              )}
              {report.reviewedAt && (
                <p className="cs-muted" style={{ fontSize: '.9rem' }}>
                  Reviewed on {new Date(report.reviewedAt).toLocaleString()} by{' '}
                  <strong>{report.reviewedBy}</strong>
                </p>
              )}
            </div>

            {/* Actions – only show for pending reports */}
            {(report.status || 'pending') === 'pending' && (
              <div className="cs-admin__report-actions">
                <button
                  className="cs-btn cs-btn--primary"
                  disabled={acting === report.id}
                  onClick={() => handleAction(report.id, 'accept')}
                >
                  ✓ Accept
                </button>
                <button
                  className="cs-btn cs-btn--danger"
                  disabled={acting === report.id}
                  onClick={() => handleAction(report.id, 'reject')}
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
