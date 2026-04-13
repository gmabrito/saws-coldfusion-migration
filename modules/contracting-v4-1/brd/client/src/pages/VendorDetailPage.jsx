import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { vendorService } from '../services/api';

// Ref: BRD 6.1 - view vendor profiles, reset passwords

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchVendor = async () => {
      setLoading(true);
      try {
        const data = await vendorService.getById(id);
        setVendor(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load vendor');
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  const handleResetPassword = async () => {
    if (!window.confirm('Are you sure you want to reset this vendor\'s password?')) return;
    setResetting(true);
    setSuccess('');
    setError('');
    try {
      const data = await vendorService.resetPassword(id);
      setSuccess(`Password reset successfully. Temporary password: ${data.temporaryPassword}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove vendor "${vendor.BusinessName}"?`)) return;
    try {
      await vendorService.remove(id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove vendor');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading vendor details...</div>;
  }

  if (error && !vendor) {
    return (
      <div>
        <div className="alert alert-error">{error}</div>
        <Link to="/" className="btn btn-secondary">Back to Search</Link>
      </div>
    );
  }

  if (!vendor) return null;

  const statusClass = vendor.Status === 'Active' ? 'badge-active'
    : vendor.Status === 'Inactive' ? 'badge-inactive'
    : 'badge-pending';

  return (
    <div>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="action-bar">
          <h2 className="card-title" style={{ marginBottom: 0 }}>{vendor.BusinessName}</h2>
          <div className="btn-group" style={{ marginTop: 0 }}>
            <Link to={`/vendors/${id}/edit`} className="btn btn-warning btn-sm">Edit</Link>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleResetPassword}
              disabled={resetting}
            >
              {resetting ? 'Resetting...' : 'Reset Password'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Remove</button>
          </div>
        </div>

        <span className={`badge ${statusClass}`} style={{ marginBottom: '16px', display: 'inline-block' }}>
          {vendor.Status}
        </span>

        <div className="detail-grid" style={{ marginTop: '16px' }}>
          <div className="detail-field">
            <span className="detail-label">Contact Name</span>
            <span className="detail-value">{vendor.ContactName}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Email</span>
            <span className="detail-value">{vendor.Email}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Phone</span>
            <span className="detail-value">{vendor.Phone || '-'}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Category</span>
            <span className="detail-value">{vendor.CategoryName || '-'}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Address</span>
            <span className="detail-value">
              {vendor.Address ? `${vendor.Address}, ${vendor.City}, ${vendor.State} ${vendor.Zip}` : '-'}
            </span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Registration Date</span>
            <span className="detail-value">{formatDate(vendor.RegistrationDate)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Last Login</span>
            <span className="detail-value">{formatDate(vendor.LastLoginDate)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-label">Vendor ID</span>
            <span className="detail-value">{vendor.VendorID}</span>
          </div>
        </div>

        {vendor.Notes && (
          <div style={{ marginTop: '16px' }}>
            <span className="detail-label">Notes</span>
            <p className="detail-value" style={{ marginTop: '4px' }}>{vendor.Notes}</p>
          </div>
        )}
      </div>

      <Link to="/" className="btn btn-secondary">Back to Search</Link>
    </div>
  );
}
