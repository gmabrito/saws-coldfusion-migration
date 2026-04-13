import { Link, useLocation } from 'react-router-dom';

const styles = {
  nav: {
    padding: '8px 0'
  },
  link: {
    display: 'block',
    padding: '10px 16px',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    borderLeft: '3px solid transparent',
    transition: 'background-color 0.2s'
  },
  activeLink: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderLeftColor: '#f28428'
  }
};

export function IntranetNav({ items = [] }) {
  const location = useLocation();

  return (
    <nav style={styles.nav}>
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              ...(isActive ? styles.activeLink : {})
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
