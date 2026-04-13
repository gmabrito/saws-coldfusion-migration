import { Link } from 'react-router-dom';

// BRD 7.1: Confirmation page after successful opt-in
export default function OptInConfirmationPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Opt-in Confirmed</h1>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--saws-success)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          margin: '0 auto 24px'
        }}>
          &#10003;
        </div>

        <h2 style={{ color: 'var(--saws-navy)', marginBottom: '16px' }}>
          You have been successfully opted in!
        </h2>

        <p style={{ color: 'var(--saws-text-light)', maxWidth: '500px', margin: '0 auto 24px' }}>
          You will now receive emergency SMS text message notifications for the categories
          you selected. You can update your preferences or opt out at any time by returning
          to the opt-in form.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">
            Update Preferences
          </Link>
        </div>
      </div>
    </div>
  );
}
