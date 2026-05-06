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

  const accountLabel = me?.fullName?.trim() || me?.email || 'Tai khoan'

  return (
    <nav className="tour-home-nav tour-app-global-nav" aria-label="Menu chinh">
      <Link to="/">Booking.com</Link>
      <Link to="/hotels" className={hotelsActive ? 'active' : undefined}>
        Khach san
      </Link>
      <Link to="/tours" className={toursActive ? 'active' : undefined}>
        Tours
      </Link>
      <div className="tour-home-nav-account tour-home-account-menu" ref={menuRef}>
        <button type="button" className="tour-home-account-trigger" onClick={toggleMenu} aria-expanded={menuOpen}>
          {accountLabel}
        </button>
        {menuOpen ? (
          <div className="tour-home-account-dropdown">
            {me ? (
              <>
                <Link to="/profile" onClick={closeMenu}>
                  Ho so cua toi
                </Link>
                <Link to="/profile/change-password" onClick={closeMenu}>
                  Doi mat khau
                </Link>
                <Link to="/bookings" onClick={closeMenu}>
                  Don hang cua toi
                </Link>
                <button type="button" onClick={onLogout}>
                  Dang xuat
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>
                  Dang nhap
                </Link>
                <Link to="/register" onClick={closeMenu}>
                  Dang ky
                </Link>
              </>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  )
}
