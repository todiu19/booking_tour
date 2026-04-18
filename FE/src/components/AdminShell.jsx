import { NavLink } from 'react-router-dom'

export default function AdminShell({ title, subtitle, children }) {
  return (
    <section className="admin-shell admin-theme">
      <aside className="admin-sidebar panel admin-sidebar-panel">
        <p className="admin-badge">Admin only</p>
        <h3>Admin Panel</h3>
        <p className="muted">Operations and management</p>
        <nav className="admin-nav">
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/tours">Tours</NavLink>
          <NavLink to="/admin/destinations">Destinations</NavLink>
          <NavLink to="/admin/cod-confirm">COD Confirm</NavLink>
        </nav>
      </aside>

      <div className="admin-content">
        <header className="panel admin-header-panel">
          <h1>{title}</h1>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </header>
        <div className="stack">{children}</div>
      </div>
    </section>
  )
}
