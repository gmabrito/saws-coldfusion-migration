import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <>
      <div
        style={{
          background: 'linear-gradient(135deg, #01354d 0%, #005A87 100%)',
          color: '#fff',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
          Texas Public Information Act
        </h1>
        <p style={{ fontSize: 16, opacity: .85, maxWidth: 600, margin: '0 auto 28px' }}>
          San Antonio Water System is committed to transparency. Submit a records request
          under the Texas Public Information Act (Government Code Chapter 552).
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/public/request" className="btn btn-primary btn-lg">
            Submit a Request
          </Link>
          <Link to="/public/status" className="btn btn-secondary btn-lg">
            Check Request Status
          </Link>
        </div>
      </div>

      <div className="public-content">
        <div className="card">
          <div className="card-header">Your Rights Under the Texas PIA</div>
          <p style={{ marginBottom: 12 }}>
            The Texas Public Information Act (Tex. Gov&rsquo;t Code Ch. 552) gives the public
            the right to access government information maintained by state and local bodies.
            SAWS is a public utility and is subject to the Act.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>You do not need to give a reason for your request.</li>
            <li>SAWS must acknowledge your request within <strong>10 business days</strong>.</li>
            <li>SAWS must respond (or request an Attorney General opinion) within <strong>10 business days</strong> of acknowledgment.</li>
            <li>Charges may apply for large requests (copies, labor for &gt; 50 pages).</li>
            <li>Certain information is excepted from disclosure (see exemptions below).</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">Common Exemptions</div>
          <p style={{ marginBottom: 12 }}>
            Some information is excepted from disclosure under Texas law. Common exceptions include:
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><strong>§552.101</strong> — Information made confidential by other law</li>
            <li><strong>§552.102</strong> — Employee personal information (home address, etc.)</li>
            <li><strong>§552.107</strong> — Attorney-client privilege</li>
            <li><strong>§552.110</strong> — Trade secrets and commercial information</li>
          </ul>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--saws-text-muted)' }}>
            If SAWS believes your request contains excepted information, it may seek an opinion
            from the Texas Attorney General&rsquo;s Office.
          </p>
        </div>

        <div className="card">
          <div className="card-header">What to Include in Your Request</div>
          <p style={{ marginBottom: 8 }}>For fastest processing, be as specific as possible:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Describe the records you are seeking in detail.</li>
            <li>Include date ranges if applicable.</li>
            <li>Specify the department or division if known.</li>
            <li>Indicate your preferred format (electronic PDF or paper).</li>
          </ul>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link to="/public/request" className="btn btn-primary btn-lg">
            Submit Your Request Now
          </Link>
        </div>
      </div>
    </>
  );
}
