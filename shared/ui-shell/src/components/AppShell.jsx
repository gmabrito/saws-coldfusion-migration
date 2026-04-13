import { useAuth } from '../hooks/useAuth';
import { IntranetNav } from './IntranetNav';

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#005A87',
    color: '#fff',
    flexShrink: 0
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: '#0078AE',
    color: '#fff',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0
  },
  userInfo: {
    fontSize: '14px'
  },
  content: {
    flex: 1,
    padding: '24px',
    backgroundColor: '#F5F5F5'
  }
};

export function AppShell({ title, navItems, children }) {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>SAWS</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>EZ Link Portal</div>
        </div>
        <IntranetNav items={navItems} />
      </aside>
      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>{title}</h1>
          <span style={styles.userInfo}>
            {user.firstName} {user.lastName} | {user.department}
          </span>
        </header>
        <main style={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
