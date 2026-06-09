import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '♠' },
  { to: '/history', label: 'History', icon: '♦' },
  { to: '/stats', label: 'Stats', icon: '♣' },
  { to: '/play', label: 'My Game', icon: '♥' },
  { to: '/hands', label: 'Hands', icon: '♤' },
];

function NavLinks({ className }: { className: string }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `${className} ${isActive ? 'active' : ''}`}
          end={item.to === '/'}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </>
  );
}

export function Layout() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">
            <span className="logo-icon">♠</span>
            <span>Poker Night</span>
          </NavLink>
          <nav className="nav nav-top">
            <NavLinks className="nav-link" />
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <NavLinks className="bottom-nav-link" />
      </nav>
    </div>
  );
}
