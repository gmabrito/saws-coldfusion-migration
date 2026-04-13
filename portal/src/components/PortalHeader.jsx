export default function PortalHeader({ user, onLogout }) {
  return (
    <header className="portal-header">
      <div className="portal-header-left">
        <h1 className="portal-title">EZLink Applications <span className="portal-env">QA</span></h1>
        <div className="portal-roles">
          {user.roles.map((role) => (
            <span key={role} className="role-badge">{role}</span>
          ))}
        </div>
      </div>
      <div className="portal-header-right">
        <span className="portal-user">{user.displayName}</span>
        <button onClick={onLogout} className="btn-logout">Logout</button>
        <div className="saws-logo-header">
          <svg viewBox="0 0 100 40" width="100" height="40">
            <text x="5" y="28" fill="#0078AE" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="22">SAWS</text>
          </svg>
        </div>
      </div>
    </header>
  );
}
