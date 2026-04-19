import { useState, useEffect } from 'react';
import axios from 'axios';

const DOC_TYPES = ['', 'SOP', 'Permit', 'Report', 'Drawing', 'Contract', 'Policy', 'Manual', 'Specification'];
const DEPARTMENTS = ['', 'Operations', 'Engineering', 'Compliance', 'Finance', 'IT', 'HR', 'Legal'];
const LIMIT = 25;

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [docType, setDocType] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (docType) params.doc_type = docType;
    if (department) params.department = department;

    axios.get('/api/internal/admin/documents', { params })
      .then((r) => {
        setDocs(r.data.documents || []);
        setTotal(r.data.total || 0);
      })
      .catch(() => setError('Failed to load documents.'))
      .finally(() => setLoading(false));
  }, [page, docType, department]);

  const totalPages = Math.ceil(total / LIMIT);

  function statusBadgeClass(status) {
    if (status === 'indexed') return 'badge-indexed';
    if (status === 'error') return 'badge-error';
    return 'badge-pending';
  }

  return (
    <div>
      <div className="page-header">
        <h1>Documents</h1>
        <span style={{ color: 'var(--saws-text-muted)', fontSize: 14 }}>
          {total.toLocaleString()} total
        </span>
      </div>

      <div className="filters-bar">
        <select value={docType} onChange={(e) => { setDocType(e.target.value); setPage(1); }}>
          <option value="">All Document Types</option>
          {DOC_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {DEPARTMENTS.filter(Boolean).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Department</th>
                <th>Status</th>
                <th>Chunks</th>
                <th>Indexed</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--saws-text-muted)' }}>
                    No documents found.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </td>
                    <td>{doc.doc_type}</td>
                    <td>{doc.department}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(doc.embedding_status)}`}>
                        {doc.embedding_status}
                      </span>
                    </td>
                    <td>{doc.chunk_count ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>
                      {doc.indexed_at ? new Date(doc.indexed_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(1)} disabled={page === 1}>&laquo;</button>
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>&lsaquo;</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>&rsaquo;</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>&raquo;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
