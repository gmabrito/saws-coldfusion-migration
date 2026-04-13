const APP_TILES = [
  {
    id: 'my-profile',
    name: 'My Profile',
    icon: '👤',
    description: 'View and update your profile',
    module: null,
    requiresAuth: false,
  },
  {
    id: 'announcements',
    name: 'Announcements',
    icon: '📢',
    description: 'View company announcements',
    module: null,
    requiresAuth: false,
  },
  {
    id: 'board-resolutions',
    name: 'Board Resolutions\n(2005 - 2013)',
    icon: '📋',
    description: 'Archived board resolutions',
    module: 'ceo',
    port: 3000,
  },
  {
    id: 'business-cards',
    name: 'Business Cards',
    icon: '💼',
    description: 'Order business cards',
    module: null,
    requiresAuth: true,
  },
  {
    id: 'drought-stages',
    name: 'Drought Stages\n(Admin)',
    icon: '💧',
    description: 'Manage drought stage settings',
    module: null,
    requiresAuth: true,
    adminOnly: true,
  },
  {
    id: 'emergency-sms',
    name: 'Emergency SMS\nNotifications',
    icon: '📱',
    description: 'Opt-in for emergency text alerts',
    module: 'is-part1',
    port: 3000,
  },
  {
    id: 'employee-directory',
    name: 'Employee Directory',
    icon: '📖',
    description: 'Search employee information',
    module: 'hr',
    port: 3000,
    path: '/inactive',
  },
  {
    id: 'flat-rate-sewer',
    name: 'Flat Rate Sewer',
    icon: '🔧',
    description: 'Flat rate sewer management',
    module: null,
    requiresAuth: true,
  },
  {
    id: 'fire-hydrant-meter',
    name: 'Fire Hydrant\nMeter',
    icon: '🚒',
    description: 'Fire hydrant meter contracts and readings',
    module: 'finance',
    port: 3000,
  },
  {
    id: 'identity-theft',
    name: 'Identity Theft\nTraining',
    icon: '🔒',
    description: 'Complete identity theft training',
    module: null,
    requiresAuth: true,
  },
  {
    id: 'oncall-directory',
    name: 'On-call Directory',
    icon: '📞',
    description: 'View on-call schedules by department',
    module: 'oncall-directory',
    port: 3000,
  },
  {
    id: 'records-storage',
    name: 'Records Storage\nTransmittal',
    icon: '📦',
    description: 'Submit and search records transmittals',
    module: 'records',
    port: 3000,
  },
  {
    id: 'contracting-vendors',
    name: 'Bidder/Vendor\nDirectory',
    icon: '🏢',
    description: 'Search and manage vendor profiles',
    module: 'contracting-v4-1',
    port: 3000,
  },
  {
    id: 'contracting-solicitations',
    name: 'Contracting\nSolicitations',
    icon: '📄',
    description: 'Post and manage solicitations',
    module: 'contracting-v4-2',
    port: 3000,
  },
  {
    id: 'ciac-meetings',
    name: 'CIAC Meetings',
    icon: '🏗️',
    description: 'CIAC meeting board and contractor registry',
    module: 'development',
    port: 3000,
  },
  {
    id: 'job-listings',
    name: 'Weekly Job\nListings',
    icon: '💼',
    description: 'View current job openings',
    module: 'hr',
    port: 3000,
  },
  {
    id: 'water-stats',
    name: 'Aquifer &\nWater Stats',
    icon: '🌊',
    description: '30-day aquifer statistics and water levels',
    module: 'water-resource',
    port: 3000,
  },
  {
    id: 'take-home-vehicles',
    name: 'Take Home\nVehicles',
    icon: '🚗',
    description: 'Fleet vehicle management',
    module: 'fleet',
    port: 3000,
  },
  {
    id: 'utility-maps',
    name: 'Utility Maps',
    icon: '🗺️',
    description: 'View utility infrastructure maps',
    module: 'utility-maps',
    port: 3000,
  },
  {
    id: 'print-shop',
    name: 'Print Shop',
    icon: '🖨️',
    description: 'Submit and track print jobs',
    module: 'print-shop',
    port: 3000,
  },
];

export default function PortalGrid({ user }) {
  const visibleApps = APP_TILES.filter((app) => {
    if (app.adminOnly && !user.roles.includes('admin')) return false;
    if (user.apps === 'all') return true;
    return user.apps.includes(app.id);
  });

  const handleTileClick = (app) => {
    if (!app.module) {
      alert(`"${app.name.replace('\n', ' ')}" is a legacy app not covered by the current BRDs.\n\nThis tile exists in the original EZ Link portal but has no migration prototype yet.`);
      return;
    }
    // In a real deployment, each module would be served under a route prefix.
    // For the prototype, show where the module lives.
    const modulePath = app.path || '/';
    alert(
      `Module: ${app.module}\n` +
      `Path: modules/${app.module}/brd/client/\n` +
      `Run: cd modules/${app.module}/brd/client && npm run dev\n\n` +
      `This would navigate to the ${app.name.replace('\n', ' ')} module.`
    );
  };

  return (
    <main className="portal-grid-container">
      <div className="portal-grid">
        {visibleApps.map((app) => (
          <button
            key={app.id}
            className={`portal-tile ${app.module ? 'portal-tile-active' : 'portal-tile-legacy'}`}
            onClick={() => handleTileClick(app)}
            title={app.description}
          >
            <div className="tile-icon">{app.icon}</div>
            <div className="tile-name">
              {app.name.split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && app.name.includes('\n') ? <br /> : null}</span>
              ))}
            </div>
            {!app.module && <div className="tile-badge">Legacy</div>}
            {app.module && <div className="tile-badge tile-badge-ready">Prototype</div>}
          </button>
        ))}
      </div>
    </main>
  );
}
