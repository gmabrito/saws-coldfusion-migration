import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transmittalService } from '../services/api';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const response = await transmittalService.search(keyword.trim());
      setResults(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  function isEligibleForDisposition(dispositionDate) {
    if (!dispositionDate) return false;
    return new Date(dispositionDate) <= new Date();
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Search Records</h2>
        </div>
        <p style={{ color: '#6c757d', marginBottom: '16px', fontSize: '14px' }}>
          Search for boxes by keyword to find potentially relevant records needed for
          business or legal matters.
        </p>

        <form onSubmit={handleSearch}>
          <div className="search-bar">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword to search box descriptions, keywords, and box numbers..."
              autoFocus
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !keyword.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Searching records...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="empty-state">
            <p>No records found matching your search.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="alert alert-info" style={{ marginTop: '8px' }}>
              Found {results.length} matching box{results.length !== 1 ? 'es' : ''}.
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Box Number</th>
                    <th>Description</th>
                    <th>Department</th>
                    <th>Retention Code</th>
                    <th>Retention Date</th>
                    <th>Disposition Date</th>
                    <th>Location</th>
                    <th>Keywords</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((box) => (
                    <tr
                      key={box.BoxID}
                      className="clickable"
                      onClick={() => navigate(`/transmittals/${box.TransmittalID}`)}
                    >
                      <td style={{ fontWeight: 600 }}>{box.BoxNumber}</td>
                      <td>{box.Description}</td>
                      <td>{box.DepartmentName}</td>
                      <td>
                        {box.RetentionCode}
                        <br />
                        <small style={{ color: '#6c757d' }}>{box.RetentionCodeDescription}</small>
                      </td>
                      <td>{formatDate(box.RetentionDate)}</td>
                      <td>
                        {formatDate(box.DispositionDate)}
                        {isEligibleForDisposition(box.DispositionDate) && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: '11px',
                              color: '#dc3545',
                              fontWeight: 600,
                              marginTop: '2px'
                            }}
                          >
                            ELIGIBLE FOR DISPOSITION
                          </span>
                        )}
                      </td>
                      <td>{box.Location || '-'}</td>
                      <td>{box.Keywords || '-'}</td>
                      <td>
                        <span className={`badge badge-${box.TransmittalStatus?.toLowerCase().replace(' ', '-')}`}>
                          {box.TransmittalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
