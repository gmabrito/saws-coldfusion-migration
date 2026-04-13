import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { mapService } from '../services/api';

export default function MapDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMap();
  }, [id]);

  const fetchMap = async () => {
    try {
      const res = await mapService.getById(id);
      setMap(res.data);
    } catch (err) {
      setError('Failed to load map details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this map?')) return;
    try {
      await mapService.remove(id);
      navigate('/maps');
    } catch (err) {
      setError('Failed to delete map');
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!map) return <div className="page"><p>Map not found.</p></div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{map.Title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/maps" className="btn btn-secondary btn-sm">Back to Maps</Link>
          {isAdmin && (
            <>
              <Link to={`/maps/${id}/edit`} className="btn btn-warning btn-sm">Edit</Link>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <div className="label">Category</div>
          <div className="value">
            <span className="badge-category">{map.CategoryName}</span>
          </div>
        </div>
        <div className="detail-item">
          <div className="label">Area</div>
          <div className="value">{map.Area}</div>
        </div>
        <div className="detail-item">
          <div className="label">File Type</div>
          <div className="value">{map.FileType || 'PDF'}</div>
        </div>
        <div className="detail-item">
          <div className="label">Last Updated</div>
          <div className="value">{new Date(map.LastUpdated).toLocaleDateString()}</div>
        </div>
        <div className="detail-item">
          <div className="label">Created By</div>
          <div className="value">{map.CreatedBy}</div>
        </div>
        <div className="detail-item">
          <div className="label">Created Date</div>
          <div className="value">{new Date(map.CreatedDate).toLocaleDateString()}</div>
        </div>
      </div>

      {map.Description && (
        <>
          <h3>Description</h3>
          <p style={{ marginBottom: 20, lineHeight: 1.6 }}>{map.Description}</p>
        </>
      )}

      {map.FileUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Map File</h3>
          <a href={map.FileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: 8 }}>
            View / Download Map
          </a>
        </div>
      )}
    </div>
  );
}
