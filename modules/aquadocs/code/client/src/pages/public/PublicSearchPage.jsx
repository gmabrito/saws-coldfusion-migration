import { useState } from 'react';
import { searchService } from '../../services/searchService';

export default function PublicSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchService.publicSearch(query.trim(), 10);
      setResults(data);
    } catch (err) {
      setError('Search is temporarily unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="public-hero">
        <h1>SAWS Document Search</h1>
        <p>
          Search San Antonio Water System public documents, policies, and technical resources.
        </p>
        <form onSubmit={handleSearch} className="search-bar" style={{ maxWidth: 600, margin: '0 auto' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      <div className="app-content">
        {error && <div className="alert alert-danger">{error}</div>}

        {results && (
          <>
            <p style={{ marginBottom: 16, color: 'var(--saws-text-muted)' }}>
              {results.count} result{results.count !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>

            {results.results.length === 0 ? (
              <div className="empty-state">
                No documents found. Try different search terms.
              </div>
            ) : (
              results.results.map((doc) => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-title">{doc.title || doc.id}</div>
                  <div className="doc-meta">
                    {doc.docType && <span>{doc.docType}</span>}
                    {doc.department && <span>{doc.department}</span>}
                    {doc.score != null && (
                      <span>Score: {(doc.score * 100).toFixed(0)}%</span>
                    )}
                  </div>
                  {doc.excerpt && (
                    <div className="doc-excerpt">{doc.excerpt}&hellip;</div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {!results && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--saws-text-muted)' }}>
            Enter a search term above to find SAWS documents.
          </div>
        )}

        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 13, color: 'var(--saws-text-muted)' }}>
          SAWS staff?{' '}
          <a href="/.auth/login/aad">Sign in with your SAWS account</a>{' '}
          for full document access and AI-assisted search.
        </div>
      </div>
    </>
  );
}
