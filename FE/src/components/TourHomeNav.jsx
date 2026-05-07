import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function TourHomeNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const toursActive = pathname === '/' || pathname.startsWith('/tours')
  const hotelsActive = pathname.startsWith('/hotels')

  useEffect(() => {
    let active = true
    async function loadMe() {
      try {
        const profile = await api.getMe()
        if (active) setMe(profile || null)
      } catch {
        if (active) setMe(null)
      }
    }
    loadMe()
    return () => {
      active = false
    }
  }, [pathname])

  useEffect(() => {
    function onClickOutside(e) {
      if (!menuRef.current?.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [])

  async function onLogout() {
    try {
      await api.logout()
    } catch {
      // no-op: clear menu state and move user to home even if session already expired
    } finally {
      setMe(null)
      setMenuOpen(false)
      navigate('/')
    }
  }

  function toggleMenu() {
    setMenuOpen((prev) => !prev)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  const accountLabel = me?.fullName?.trim() || me?.email || 'Tài khoản'
  const roleName = String(me?.role?.name || '').toLowerCase()
  const isAdmin = roleName === 'admin'

  return (
    <nav className="tour-home-nav tour-app-global-nav" aria-label="Menu chính">
      <Link to="/" aria-label="Về trang chủ">
        <i className="fa-solid fa-house" aria-hidden="true" /> Booking.com
      </Link>
      <Link to="/hotels" className={hotelsActive ? 'active' : undefined}>
        <i className="fa-solid fa-hotel" aria-hidden="true" /> Khách sạn
      </Link>
      <Link to="/tours" className={toursActive ? 'active' : undefined}>
        <i className="fa-solid fa-route" aria-hidden="true" /> Tour
      </Link>
      <Link to="/destinations">
        <i className="fa-solid fa-location-dot" aria-hidden="true" /> Điểm đến
      </Link>
      <div className="tour-home-nav-account tour-home-account-menu" ref={menuRef}>
        <button type="button" className="tour-home-account-trigger" onClick={toggleMenu} aria-expanded={menuOpen}>
          <i className="fa-solid fa-user" aria-hidden="true" /> {accountLabel}
        </button>
        {menuOpen ? (
          <div className="tour-home-account-dropdown">
            {me ? (
              <>
                <Link to="/profile" onClick={closeMenu}>
                  <i className="fa-regular fa-id-badge" aria-hidden="true" /> Hồ sơ của tôi
                </Link>
                {!isAdmin ? (
                  <Link to="/bookings" onClick={closeMenu}>
                    <i className="fa-solid fa-receipt" aria-hidden="true" /> Đơn hàng của tôi
                  </Link>
                ) : null}
                <Link to="/profile/change-password" onClick={closeMenu}>
                  <i className="fa-solid fa-key" aria-hidden="true" /> Đổi mật khẩu
                </Link>
                {isAdmin ? (
                  <>
                    <Link to="/admin/dashboard" onClick={closeMenu}>
                      <i className="fa-solid fa-chart-line" aria-hidden="true" /> Thống kê
                    </Link>
                    <Link to="/admin/users" onClick={closeMenu}>
                      <i className="fa-solid fa-screwdriver-wrench" aria-hidden="true" /> Quản lý
                    </Link>
                  </>
                ) : null}
                <button type="button" onClick={onLogout}>
                  <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>
                  <i className="fa-solid fa-right-to-bracket" aria-hidden="true" /> Đăng nhập
                </Link>
                <Link to="/register" onClick={closeMenu}>
                  <i className="fa-solid fa-user-plus" aria-hidden="true" /> Đăng ký
                </Link>
              </>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  )
}
