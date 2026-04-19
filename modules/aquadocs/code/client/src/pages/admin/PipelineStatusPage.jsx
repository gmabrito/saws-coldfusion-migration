import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PipelineStatusPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/internal/admin/pipeline')
      .then((r) => setRuns(r.data.runs || []))
      .catch(() => setError('Failed to load pipeline runs.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading pipeline status...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Pipeline Status</h1>
      </div>

      <div className="card">
        <div className="card-header">Recent Pipeline Runs</div>

        {runs.length === 0 ? (
          <div className="empty-state">No pipeline runs found.</div>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="pipeline-run">
              <div>
                <div className="run-id">{run.run_id}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {new Date(run.started_at).toLocaleString()}
                  {run.completed_at && (
                    <span style={{ marginLeft: 8, color: 'var(--saws-text-muted)' }}>
                      &rarr; {new Date(run.completed_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="run-stats">
                <span><strong>{run.docs_scanned ?? '—'}</strong> scanned</span>
                <span><strong>{run.docs_indexed ?? '—'}</strong> indexed</span>
                <span><strong>{run.embed_rows ?? '—'}</strong> chunks</span>
                {run.errors > 0 && (
                  <span style={{ color: 'var(--saws-red)' }}>
                    <strong>{run.errors}</strong> errors
                  </span>
                )}
              </div>
              <div>
                <span
                  className={`badge ${
                    run.status === 'success'
                      ? 'badge-indexed'
                      : run.status === 'running'
                      ? 'badge-pending'
                      : 'badge-error'
                  }`}
                >
                  {run.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
