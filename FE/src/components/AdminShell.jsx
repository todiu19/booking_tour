import { NavLink } from 'react-router-dom'

export default function AdminShell({ title, subtitle, children, showSidebar = true }) {
  return (
    <section className={showSidebar ? 'admin-shell admin-theme' : 'admin-shell admin-theme admin-shell--no-sidebar'}>
      {showSidebar ? (
        <aside className="admin-sidebar panel admin-sidebar-panel">
          <p className="admin-badge">Chỉ dành cho quản trị viên</p>
          <h3>Quản trị viên</h3>
          <p className="muted">Tác vụ vận hành và quản lý</p>
          <nav className="admin-nav">
            <NavLink to="/admin/users">
              <i className="fa-solid fa-users" aria-hidden="true" /> Quản lý người dùng
            </NavLink>
            <NavLink to="/admin/tours">
              <i className="fa-solid fa-route" aria-hidden="true" /> Quản lý tour
            </NavLink>
            <NavLink to="/admin/hotels">
              <i className="fa-solid fa-hotel" aria-hidden="true" /> Quản lý khách sạn
            </NavLink>
            <NavLink to="/admin/destinations">
              <i className="fa-solid fa-location-dot" aria-hidden="true" /> Quản lý điểm đến
            </NavLink>
            <NavLink to="/admin/cod-confirm">
              <i className="fa-solid fa-cash-register" aria-hidden="true" /> Xác nhận thanh toán
            </NavLink>
          </nav>
        </aside>
      ) : null}

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
