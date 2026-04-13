import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// BRD 7.1: Emergency SMS Text Message Notification Opt-in form
// Employee selects notification types, enters phone number, accepts disclosure
export default function OptInFormPage() {
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTypes, setSelectedTypes] = useState({});
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotificationTypes();
  }, []);

  const fetchNotificationTypes = async () => {
    try {
      const response = await api.get('/notification-types');
      setNotificationTypes(response.data);
      // Initialize all as unchecked
      const initial = {};
      response.data.forEach((t) => { initial[t.name] = false; });
      setSelectedTypes(initial);
    } catch (err) {
      setError('Failed to load notification types');
    }
  };

  const handleTypeChange = (name) => {
    setSelectedTypes((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate at least one type selected
    const anySelected = Object.values(selectedTypes).some(Boolean);
    if (!anySelected) {
      setError('Please select at least one notification type.');
      return;
    }

    if (!consentAccepted) {
      setError('You must accept the disclosure to continue.');
      return;
    }

    setLoading(true);

    try {
      const preferences = Object.entries(selectedTypes).map(([notificationType, isEnabled]) => ({
        notificationType,
        isEnabled
      }));

      await api.post('/optins', {
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        preferences,
        consentAccepted: 'true'
      });

      navigate('/confirmation');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to submit opt-in');
    } finally {
      setLoading(false);
    }
  };

  // BRD 7.1: Download disclosure form
  const handleDownloadDisclosure = () => {
    // In production, this would download the actual PDF disclosure form
    const disclosureText = `SAWS Emergency SMS Notification Disclosure

By opting in to SAWS Emergency SMS Text Message Notifications, you consent to receive text messages from San Antonio Water System regarding:
- Inclement/Emergency Weather
- Fire Alarm notifications
- Hazardous Chemical Incident alerts
- Emergency Lockdown notifications
- Other emergency communications

Standard message and data rates may apply. You may opt out at any time.

Message frequency varies based on emergency events.
For help, contact IT Support.`;

    const blob = new Blob([disclosureText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SAWS_SMS_Disclosure.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Emergency SMS Notification Opt-in</h1>
      </div>

      <div className="card">
        <div className="alert alert-info" style={{ marginBottom: '20px' }}>
          <strong>About this service:</strong> SAWS provides emergency SMS text message notifications
          to keep employees informed during critical situations. By opting in, you will receive
          timely alerts for the notification types you select below.
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* BRD 7.1: Phone number entry */}
          <div className="form-group">
            <label htmlFor="phoneNumber">Mobile Phone Number</label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="2105551234"
              pattern="[0-9]{10}"
              title="Enter a 10-digit phone number"
              required
            />
            <small style={{ color: 'var(--saws-text-light)' }}>Enter 10-digit number without dashes or spaces</small>
          </div>

          {/* BRD 7.1: Notification type selection */}
          <div className="form-group">
            <label>Select Notification Types</label>
            <div className="checkbox-group">
              {notificationTypes.map((type) => (
                <label key={type.id}>
                  <input
                    type="checkbox"
                    checked={selectedTypes[type.name] || false}
                    onChange={() => handleTypeChange(type.name)}
                  />
                  <div>
                    <strong>{type.name}</strong>
                    <br />
                    <small style={{ color: 'var(--saws-text-light)' }}>{type.description}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* BRD 7.1: Download disclosure form */}
          <div className="form-group">
            <label>Disclosure Form</label>
            <button type="button" className="btn btn-secondary" onClick={handleDownloadDisclosure}>
              Download Disclosure Form
            </button>
            <small style={{ display: 'block', marginTop: '6px', color: 'var(--saws-text-light)' }}>
              Please review the disclosure form before giving consent.
            </small>
          </div>

          {/* BRD 7.1: Consent acceptance */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                style={{ marginTop: '4px', width: 'auto' }}
              />
              <span>
                I have read and agree to the SAWS Emergency SMS Notification Disclosure.
                I consent to receive emergency text messages at the phone number provided above.
                Standard message and data rates may apply.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !consentAccepted}>
              {loading ? 'Submitting...' : 'Submit Opt-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
