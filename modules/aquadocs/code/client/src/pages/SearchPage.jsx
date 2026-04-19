import { useState } from 'react';
import { searchService } from '../services/searchService';

const DOC_TYPES = ['', 'SOP', 'Permit', 'Report', 'Drawing', 'Contract', 'Policy', 'Manual', 'Specification'];
const DEPARTMENTS = ['', 'Operations', 'Engineering', 'Compliance', 'Finance', 'IT', 'HR', 'Legal'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [docType, setDocType] = useState('');
  const [department, setDepartment] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (docType) filters.doc_type = docType;
      if (department) filters.department = department;
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      const data = await searchService.internalSearch(query.trim(), filters, 20);
      setResults(data);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Document Search</h1>
      </div>

      <form onSubmit={handleSearch}>
        <div className="search-bar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all SAWS documents..."
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="filters-bar">
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="">All Document Types</option>
            {DOC_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.filter(Boolean).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="Date from"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="Date to"
          />
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {results && (
        <>
          <p style={{ marginBottom: 16, color: 'var(--saws-text-muted)' }}>
            {results.count} result{results.count !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>
          {results.results.length === 0 ? (
            <div className="empty-state">No documents found. Try different search terms or adjust filters.</div>
          ) : (
            results.results.map((doc) => (
              <div key={doc.chunk_id || doc.id} className="doc-card">
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">
                  {doc.docType && <span>{doc.docType}</span>}
                  {doc.department && <span>{doc.department}</span>}
                  {doc.source_file && (
                    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{doc.source_file}</span>
                  )}
                  {doc.page_number && <span>p. {doc.page_number}</span>}
                </div>
                {doc.excerpt && <div className="doc-excerpt">{doc.excerpt}&hellip;</div>}
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      window.location.href = `/chat?doc=${encodeURIComponent(doc.title)}`;
                    }}
                  >
                    Ask AI about this document
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {!results && !loading && (
        <div className="empty-state">Enter a search term to find SAWS documents.</div>
      )}
    </div>
  );
}
