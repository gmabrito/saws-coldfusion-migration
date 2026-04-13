import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mapService } from '../services/api';

export default function MapFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    area: '',
    description: '',
    fileUrl: '',
    fileType: 'PDF',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);

  useEffect(() => {
    fetchCategories();
    if (isEdit) fetchMap();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await mapService.getCategories();
      setCategories(res.data);
    } catch (err) {
      // Non-critical
    }
  };

  const fetchMap = async () => {
    try {
      const res = await mapService.getById(id);
      const map = res.data;
      setFormData({
        title: map.Title || '',
        categoryId: map.CategoryID || '',
        area: map.Area || '',
        description: map.Description || '',
        fileUrl: map.FileUrl || '',
        fileType: map.FileType || 'PDF',
      });
    } catch (err) {
      setError('Failed to load map data');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await mapService.update(id, formData);
        navigate(`/maps/${id}`);
      } else {
        const res = await mapService.create(formData);
        navigate(`/maps/${res.data.mapId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} map`);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h2>{isEdit ? 'Edit Map' : 'Add New Map'}</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="categoryId">Category *</label>
            <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required>
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.CategoryID} value={cat.CategoryID}>{cat.CategoryName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="area">Area *</label>
            <input id="area" name="area" value={formData.area} onChange={handleChange} required
              placeholder="e.g., North Side, Downtown, Service Area 3" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange}
            placeholder="Describe the map contents, coverage area, and purpose" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fileUrl">File URL *</label>
            <input id="fileUrl" name="fileUrl" value={formData.fileUrl} onChange={handleChange} required
              placeholder="https://internal/maps/..." />
          </div>
          <div className="form-group">
            <label htmlFor="fileType">File Type</label>
            <select id="fileType" name="fileType" value={formData.fileType} onChange={handleChange}>
              <option>PDF</option>
              <option>GIS</option>
              <option>CAD</option>
              <option>Image</option>
              <option>Shapefile</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Map' : 'Add Map')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(isEdit ? `/maps/${id}` : '/maps')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
