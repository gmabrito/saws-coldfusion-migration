/**
 * ConfirmationPage — PUBLIC
 *
 * Shown after a successful locate request submission.
 * Receives { locate_number, email } from navigation state.
 * Displays ticket number, estimated response time, next steps.
 */

import { useLocation, useNavigate, Link } from 'react-router-dom';

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { locate_number, email } = location.state || {};

  // Guard against direct navigation with no state
  if (!locate_number) {
    return (
      <div className="public-content">
        <div className="alert alert-warning">
          No confirmation data found.{' '}
          <Link to="/">Submit a new locate request</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="public-content">
      {/* Success block */}
      <div className="confirm-block">
        <div className="confirm-icon">✓</div>
        <div className="confirm-ticket">{locate_number}</div>
        <div className="confirm-message">
          Your locate request has been submitted successfully.
        </div>
      </div>

      {/* Details card */}
      <div className="card">
        <div className="card-header">What Happens Next</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', minWidth: '28px' }}>📬</span>
            <div>
              <strong style={{ color: 'var(--text-heading)' }}>Confirmation Email</strong>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
                A copy of this request has been sent to <strong>{email}</strong>.
                Save your ticket number: <strong>{locate_number}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', minWidth: '28px' }}>⏱️</span>
            <div>
              <strong style={{ color: 'var(--text-heading)' }}>Estimated Response Time</strong>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
                A SAWS field crew will review and respond within{' '}
                <strong>1–3 business days</strong>. You will be contacted at the
                phone number and email provided.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', minWidth: '28px' }}>⚠️</span>
            <div>
              <strong style={{ color: 'var(--text-heading)' }}>3-Day Rule Reminder</strong>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Do <strong>not begin excavation</strong> until you have received locate
                confirmation from SAWS and the minimum 3 business days have passed.
                Texas Utilities Code §251.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', minWidth: '28px' }}>📞</span>
            <div>
              <strong style={{ color: 'var(--text-heading)' }}>Questions?</strong>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Call SAWS Customer Service at{' '}
                <a href="tel:210-704-7297">210-704-SAWS (7297)</a> and reference
                ticket number <strong>{locate_number}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/')}
        >
          Submit Another Request
        </button>
        <a
          href="https://www.saws.org"
          className="btn btn-secondary btn-lg"
        >
          Return to SAWS.org
        </a>
      </div>
    </div>
  );
}
