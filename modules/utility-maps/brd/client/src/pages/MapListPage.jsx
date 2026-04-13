import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { mapService } from '../services/api';

export default function MapListPage() {
  const { isAdmin } = useAuth();
  const [maps, setMaps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMaps();
  }, [categoryFilter, searchTerm]);

  const fetchCategories = async () => {
    try {
      const res = await mapService.getCategories();
      setCategories(res.data);
    } catch (err) {
      // Categories are optional for display
    }
  };

  const fetchMaps = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await mapService.getAll(params);
      setMaps(res.data);
    } catch (err) {
      setError('Failed to load maps');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#005A87' }}>Utility Maps</h2>
        {isAdmin && <Link to="/maps/new" className="btn btn-primary">Add Map</Link>}
      </div>

      <div className="filters">
        <div className="form-group">
          <label>Category</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.CategoryID} value={cat.CategoryID}>{cat.CategoryName}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search maps by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading maps...</p>
      ) : maps.length === 0 ? (
        <p>No maps found.</p>
      ) : (
        <div className="map-grid">
          {maps.map((map) => (
            <Link to={`/maps/${map.MapID}`} key={map.MapID} className="map-card">
              <div className="map-card-header">
                <h3>{map.Title}</h3>
              </div>
              <div className="map-card-body">
                <div className="map-meta">
                  <span className="badge-category">{map.CategoryName}</span>
                  <span>{map.Area}</span>
                </div>
                <p className="map-description">
                  {map.Description ? (map.Description.length > 120 ? map.Description.slice(0, 120) + '...' : map.Description) : 'No description available.'}
                </p>
              </div>
              <div className="map-card-footer">
                <span>Updated: {new Date(map.LastUpdated).toLocaleDateString()}</span>
                <span>{map.FileType || 'PDF'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
