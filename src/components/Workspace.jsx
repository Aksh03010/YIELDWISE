import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Sprout, LayoutDashboard, ChartNoAxesCombined, CloudSun, Globe2, Database, ChevronDown, ArrowUpRight, MapPin, Menu, X, SlidersHorizontal } from 'lucide-react'
import { FARMS } from '../data/agriculture.js'

const links = [
  ['/', 'Overview', LayoutDashboard], ['/results', 'Yield outlook', ChartNoAxesCombined],
  ['/environmental', 'Field conditions', CloudSun], ['/market', 'Supply & markets', Globe2],
  ['/about', 'Data & methodology', Database],
]
export default function Workspace({ children, farm, saveFarm }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  const title = links.find(([url]) => url === pathname)?.[1] || 'Field setup'
  return <div className="workspace">
    <a className="skip-link" href="#main">Skip to content</a>
    {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <Link to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-symbol"><Sprout size={27} strokeWidth={1.6} /></span><span>HARVEST<span className="brand-caption">AGRICULTURAL INTELLIGENCE</span></span></Link>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <div className="farm-switch"><span className="farm-avatar"><Sprout size={18} /></span><div><label htmlFor="farm-selector">Active field</label><select id="farm-selector" value={FARMS.some(f => f.id === farm.id) ? farm.id : 'custom'} onChange={e => { const selected = FARMS.find(f => f.id === e.target.value); if (selected) saveFarm({ ...selected }) }}>
        {!FARMS.some(f => f.id === farm.id) && <option value="custom">{farm.name}</option>}
        {FARMS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select></div><ChevronDown size={14} className="select-arrow" /></div>
      <nav aria-label="Main navigation">{links.map(([url, label, Icon]) => <NavLink key={url} to={url} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}><Icon size={19} strokeWidth={1.7} />{label}{url === '/market' && <span className="nav-new">LAB</span>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="preview-card"><span className="tiny-label"><span className="status-dot" /> RESEARCH PREVIEW</span><p>A better perspective on your next harvest.</p><Link to="/about" onClick={() => setOpen(false)}>Explore our data <ArrowUpRight size={15} /></Link></div><Link to="/predict" className="workspace-account" onClick={() => setOpen(false)}><span className="account-avatar">{farm.name.split(' ').slice(0, 2).map(part => part[0]).join('')}</span><span>Farm workspace<small>Manage field details</small></span><SlidersHorizontal size={16} /></Link></div>
    </aside>
    <div className="workspace-main">
      <header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div><div className="topbar-actions"><span className="region-label"><Globe2 size={15} /> North America</span><span className="topbar-separator" /><Link className="button button-small" to="/predict"><MapPin size={15} /> Edit field</Link></div></header>
      <main id="main" className="page-content" key={pathname}>{children}<footer className="page-footer"><span><Sprout size={14} /> HARVEST <span className="footer-dash">/</span> Grounded in data. Growing with you.</span><span>Canada · United States · Mexico</span></footer></main>
    </div>
  </div>
}
