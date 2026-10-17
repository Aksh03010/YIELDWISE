import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/predict', label: 'Predict' },
  { to: '/results', label: 'Results' },
  { to: '/environmental', label: 'Environmental Data' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <Sprout className="navbar-logo-icon" />
          <div className="navbar-logo-text">
            <span className="navbar-logo-title">YIELD</span>
            <span className="navbar-logo-subtitle">Crop Intelligence</span>
          </div>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-link ${isActive(link.to) ? 'navbar-link-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link to="/predict" className="navbar-cta">
          Predict My Yield
        </Link>

        <button
          className="navbar-mobile-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="navbar-mobile-menu">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`navbar-mobile-link ${isActive(link.to) ? 'navbar-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/predict"
            className="navbar-mobile-cta"
            onClick={() => setMobileOpen(false)}
          >
            Predict My Yield
          </Link>
        </div>
      )}
    </nav>
  );
}
