import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { transmittalService, retentionCodeService } from '../services/api';

const emptyBox = {
  boxNumber: '',
  description: '',
  retentionCode: '',
  retentionDate: '',
  dispositionDate: '',
  location: '',
  keywords: ''
};

export default function TransmittalFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [departmentId, setDepartmentId] = useState(user?.departmentId || '');
  const [status, setStatus] = useState('Submitted');
  const [notes, setNotes] = useState('');
  const [boxes, setBoxes] = useState([{ ...emptyBox }]);
  const [retentionCodes, setRetentionCodes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load retention codes on mount
  useEffect(() => {
    async function loadRetentionCodes() {
      try {
        const response = await retentionCodeService.list();
        setRetentionCodes(response.data.data);
      } catch {
        console.error('Failed to load retention codes');
      }
    }
    loadRetentionCodes();
  }, []);

  // Load existing transmittal data when editing
  useEffect(() => {
    if (!isEdit) return;

    async function loadTransmittal() {
      setLoading(true);
      try {
        const response = await transmittalService.getById(id);
        const data = response.data.data;
        setDepartmentId(data.DepartmentID);
        setStatus(data.Status);
        setNotes(data.Notes || '');
        setBoxes(
          data.boxes.map((b) => ({
            boxId: b.BoxID,
            boxNumber: b.BoxNumber,
            description: b.Description,
            retentionCode: b.RetentionCode,
            retentionDate: b.RetentionDate ? b.RetentionDate.split('T')[0] : '',
            dispositionDate: b.DispositionDate ? b.DispositionDate.split('T')[0] : '',
            location: b.Location || '',
            keywords: b.Keywords || ''
          }))
        );
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load transmittal.');
      } finally {
        setLoading(false);
      }
    }
    loadTransmittal();
  }, [id, isEdit]);

  function updateBox(index, field, value) {
    setBoxes((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calculate disposition date when retention code and retention date change
      if ((field === 'retentionCode' || field === 'retentionDate') && updated[index].retentionDate) {
        const code = retentionCodes.find((rc) => rc.Code === updated[index].retentionCode);
        if (code && code.RetentionYears < 999) {
          const retDate = new Date(updated[index].retentionDate);
          retDate.setFullYear(retDate.getFullYear() + code.RetentionYears);
          updated[index].dispositionDate = retDate.toISOString().split('T')[0];
        }
      }

      return updated;
    });
  }

  function addBox() {
    setBoxes((prev) => [...prev, { ...emptyBox }]);
  }

  function removeBox(index) {
    if (boxes.length <= 1) return;
    setBoxes((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const errors = {};
    if (!departmentId) errors.departmentId = 'Department is required.';

    boxes.forEach((box, i) => {
      if (!box.boxNumber.trim()) errors[`box_${i}_boxNumber`] = 'Box number is required.';
      if (!box.description.trim()) errors[`box_${i}_description`] = 'Description is required.';
      if (!box.retentionCode) errors[`box_${i}_retentionCode`] = 'Retention code is required.';
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        departmentId: parseInt(departmentId),
        status,
        notes: notes || null,
        boxes: boxes.map((b) => ({
          boxNumber: b.boxNumber.trim(),
          description: b.description.trim(),
          retentionCode: b.retentionCode,
          retentionDate: b.retentionDate || null,
          dispositionDate: b.dispositionDate || null,
          location: b.location.trim() || null,
          keywords: b.keywords.trim() || null
        }))
      };

      if (isEdit) {
        await transmittalService.update(id, payload);
        setSuccess('Transmittal updated successfully.');
      } else {
        const response = await transmittalService.create(payload);
        setSuccess('Transmittal created successfully.');
        setTimeout(() => {
          navigate(`/transmittals/${response.data.data.transmittalId}`);
        }, 1000);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map((e) => e.msg).join(', '));
      } else {
        setError(err.response?.data?.error || 'Failed to save transmittal.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading transmittal...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>{isEdit ? 'Edit Transmittal' : 'New Records Transmittal'}</h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Transmittal header fields */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="departmentId">Department *</label>
              <select
                id="departmentId"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={saving}
              >
                <option value="">-- Select Department --</option>
                <option value="1">Records Management</option>
                <option value="2">Finance</option>
                <option value="3">Human Resources</option>
                <option value="4">Engineering</option>
                <option value="5">Operations</option>
                <option value="6">Legal</option>
                <option value="7">Customer Service</option>
                <option value="8">IT Services</option>
              </select>
              {fieldErrors.departmentId && <p className="error-text">{fieldErrors.departmentId}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
              >
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                {isEdit && <option value="Reviewed">Reviewed</option>}
                {isEdit && <option value="In Storage">In Storage</option>}
                {isEdit && <option value="Disposed">Disposed</option>}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this transmittal"
              disabled={saving}
            />
          </div>

          {/* Box Indexes */}
          <div style={{ marginTop: '24px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ color: '#005A87', fontSize: '16px' }}>Box Indexes</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addBox} disabled={saving}>
              + Add Box
            </button>
          </div>

          {boxes.map((box, index) => (
            <div key={index} className="box-entry">
              <div className="box-entry-header">
                <h4>Box #{index + 1}</h4>
                {boxes.length > 1 && (
                  <button
                    type="button"
                    className="remove-box-btn"
                    onClick={() => removeBox(index)}
                    title="Remove this box"
                    disabled={saving}
                  >
                    X
                  </button>
                )}
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Box Number *</label>
                  <input
                    type="text"
                    value={box.boxNumber}
                    onChange={(e) => updateBox(index, 'boxNumber', e.target.value)}
                    placeholder="e.g., BOX-2026-001"
                    disabled={saving}
                  />
                  {fieldErrors[`box_${index}_boxNumber`] && (
                    <p className="error-text">{fieldErrors[`box_${index}_boxNumber`]}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Retention Code *</label>
                  <select
                    value={box.retentionCode}
                    onChange={(e) => updateBox(index, 'retentionCode', e.target.value)}
                    disabled={saving}
                  >
                    <option value="">-- Select Code --</option>
                    {retentionCodes.map((rc) => (
                      <option key={rc.Code} value={rc.Code}>
                        {rc.Code} - {rc.Description} ({rc.RetentionYears}yr)
                      </option>
                    ))}
                  </select>
                  {fieldErrors[`box_${index}_retentionCode`] && (
                    <p className="error-text">{fieldErrors[`box_${index}_retentionCode`]}</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={box.location}
                    onChange={(e) => updateBox(index, 'location', e.target.value)}
                    placeholder="Storage location"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={box.description}
                  onChange={(e) => updateBox(index, 'description', e.target.value)}
                  placeholder="Describe the contents of this box"
                  rows={2}
                  disabled={saving}
                />
                {fieldErrors[`box_${index}_description`] && (
                  <p className="error-text">{fieldErrors[`box_${index}_description`]}</p>
                )}
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Retention Date</label>
                  <input
                    type="date"
                    value={box.retentionDate}
                    onChange={(e) => updateBox(index, 'retentionDate', e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label>Disposition Date</label>
                  <input
                    type="date"
                    value={box.dispositionDate}
                    onChange={(e) => updateBox(index, 'dispositionDate', e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label>Keywords</label>
                  <input
                    type="text"
                    value={box.keywords}
                    onChange={(e) => updateBox(index, 'keywords', e.target.value)}
                    placeholder="Comma-separated keywords"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Form actions */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Transmittal' : 'Submit Transmittal'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(isEdit ? `/transmittals/${id}` : '/transmittals')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
