import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Sprout, MapPin, Menu, X } from 'lucide-react'
import { FARMS } from '../data/agriculture.js'

const links = [
  ['/', 'Overview'],
  ['/outlook', 'Yield outlook'],
  ['/planning', 'Harvest planning'],
  ['/conditions', 'Field conditions'],
  ['/about', 'Data & methodology'],
]

export default function Workspace({ children, farm, saveFarm }) {
  const [menuRoute, setMenuRoute] = useState(null)
  const { pathname, hash, key } = useLocation()
  const menuOpen = menuRoute === key
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1))
    if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to="/" className="brand"><Sprout size={22} strokeWidth={1.8} /> Yield Wise</Link>
        <button className="menu-btn" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuRoute(menuOpen ? null : key)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          {links.map(([url, label]) => (
            <NavLink key={url} to={url} end={url === '/'} onClick={() => setMenuRoute(null)}>{label}</NavLink>
          ))}
        </nav>
        <div className="topbar-tools">
          <select
            className="field-select"
            aria-label="Active field"
            value={FARMS.some(f => f.id === farm.id) ? farm.id : 'custom'}
            onChange={e => { const selected = FARMS.find(f => f.id === e.target.value); if (selected) saveFarm({ ...selected }) }}
          >
            {!FARMS.some(f => f.id === farm.id) && <option value="custom">{farm.name}</option>}
            {FARMS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <Link className="btn btn-small" to="/field"><MapPin size={15} /> Edit field</Link>
        </div>
      </header>
      <main id="main" className="main">
        {children}
        <footer className="footer">
          <div className="footer-credit"><strong>Yield Wise™</strong><span>© {new Date().getFullYear()} Zohaib Mansoor, Shubhang Nath Thakur, Akshit Mesa.</span></div>
          <div className="footer-details"><Link to="/about">Data & methodology</Link><span>Weather via Open-Meteo · Field profiles saved in this browser</span></div>
        </footer>
      </main>
    </div>
  )
}
