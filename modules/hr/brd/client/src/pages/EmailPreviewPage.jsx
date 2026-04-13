import { useState } from 'react';
import { jobService } from '../services/api';

// Ref: BRD 6.1 - "weekly job emails are generated and sent out Friday afternoon"
// Admin preview of the weekly email content
export default function EmailPreviewPage() {
  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateEmail = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await jobService.generateEmail();
      setEmailData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate email preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>Weekly Job Email Preview</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Generate a preview of the Friday afternoon weekly job email. This email includes all active
        internal and external positions currently posted.
      </p>

      <button className="btn btn-primary" onClick={generateEmail} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Email Preview'}
      </button>

      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

      {emailData && (
        <>
          <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="detail-item">
              <div className="label">Total Listings</div>
              <div className="value">{emailData.totalListings}</div>
            </div>
            <div className="detail-item">
              <div className="label">Internal</div>
              <div className="value">{emailData.internalCount}</div>
            </div>
            <div className="detail-item">
              <div className="label">External</div>
              <div className="value">{emailData.externalCount}</div>
            </div>
            <div className="detail-item">
              <div className="label">Generated At</div>
              <div className="value">{new Date(emailData.generatedAt).toLocaleString()}</div>
            </div>
          </div>

          <div className="email-preview-frame">
            <div className="email-preview-header">
              <p><strong>Subject:</strong> {emailData.subject}</p>
              <p><strong>To:</strong> All SAWS Employees</p>
              <p><strong>From:</strong> HR Department &lt;hr@saws.org&gt;</p>
            </div>
            <div dangerouslySetInnerHTML={{ __html: emailData.htmlContent }} />
          </div>
        </>
      )}
    </div>
  );
}
