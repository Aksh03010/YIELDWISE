import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Sprout, MapPin, Menu, X } from 'lucide-react'
import { FARMS } from '../data/agriculture.js'

const links = [
  ['/', 'Overview'],
  ['/outlook', 'Yield outlook'],
  ['/conditions', 'Field conditions'],
  ['/market', 'Supply balance'],
  ['/about', 'Data & methodology'],
]

export default function Workspace({ children, farm, saveFarm }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    setMenuOpen(false)
  }, [pathname])
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to="/" className="brand"><Sprout size={22} strokeWidth={1.8} /> HARVEST</Link>
        <button className="menu-btn" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          {links.map(([url, label]) => (
            <NavLink key={url} to={url} end={url === '/'}>{label}</NavLink>
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
          <span>HARVEST research preview — yield and market figures are illustrative</span>
          <span>Weather via Open-Meteo · Field data stays in this browser</span>
        </footer>
      </main>
    </div>
  )
}
