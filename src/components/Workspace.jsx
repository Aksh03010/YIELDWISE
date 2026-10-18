import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { FARMS } from '../data/agriculture.js'

const links = [
  ['/', 'Overview'], ['/results', 'Yield outlook'],
  ['/planning', 'Harvest planning'],
  ['/environmental', 'Field conditions'], ['/market', 'Supply & markets'],
  ['/about', 'Data & methodology'],
]
export default function Workspace({ children, farm, saveFarm }) {
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const section = hash ? document.getElementById(hash.slice(1)) : null
    if (section) section.scrollIntoView({ block: 'start', behavior: 'instant' })
    else window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  const title = links.find(([url]) => url === pathname)?.[1] || 'Field setup'
  return <div className="workspace">
    <a className="skip-link" href="#main">Skip to content</a>
    {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <Link to="/" className="brand" onClick={() => setOpen(false)}><span>HARVEST<span className="brand-caption">FIELD PLANNING</span></span></Link>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <div className="farm-switch"><div><label htmlFor="farm-selector">Active field</label><select id="farm-selector" value={FARMS.some(f => f.id === farm.id) ? farm.id : 'custom'} onChange={e => { const selected = FARMS.find(f => f.id === e.target.value); if (selected) saveFarm({ ...selected }) }}>
        {!FARMS.some(f => f.id === farm.id) && <option value="custom">{farm.name}</option>}
        {FARMS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select></div></div>
      <nav aria-label="Main navigation">{links.map(([url, label]) => <NavLink key={url} to={url} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="preview-card"><strong className="preview-title">Prototype</strong><p>Yield and market figures are examples. Weather is retrieved separately.</p><Link to="/about" onClick={() => setOpen(false)}>Data sources </Link></div><Link to="/predict" className="workspace-account" onClick={() => setOpen(false)}><span className="account-avatar">{farm.name.split(' ').slice(0, 2).map(part => part[0]).join('')}</span><span>Farm workspace<small>Manage field details</small></span></Link></div>
    </aside>
    <div className="workspace-main">
      <header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div><div className="topbar-actions"><span className="region-label"> North America</span><span className="topbar-separator" /><Link className="button button-small" to="/predict"> Edit field</Link></div></header>
      <main id="main" className="page-content" key={pathname}>{children}<footer className="page-footer"><span> HARVEST <span className="footer-dash">/</span> Field planning for North American farms</span><span>Canada · United States · Mexico</span></footer></main>
    </div>
  </div>
}
