import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import HomePage from './pages/HomePage'
import ToursPage from './pages/ToursPage'
import TourDetailPage from './pages/TourDetailPage'
import TourBookingPage from './pages/TourBookingPage'
import DestinationsPage from './pages/DestinationsPage'
import DestinationDetailPage from './pages/DestinationDetailPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import BookingsPage from './pages/BookingsPage'
import BookingDetailPage from './pages/BookingDetailPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import AdminRoute from './components/AdminRoute'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminToursPage from './pages/AdminToursPage'
import AdminDestinationsPage from './pages/AdminDestinationsPage'
import AdminCodConfirmPage from './pages/AdminCodConfirmPage'
import { api } from './api'

function App() {
  const navigate = useNavigate()
  const [refreshMeSignal, setRefreshMeSignal] = useState(0)
  const [currentUser, setCurrentUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false)
  const menuRef = useRef(null)
  const roleName = String(currentUser?.role?.name || '').toLowerCase()
  const isAdmin = roleName === 'admin'

  useEffect(() => {
    let active = true
    async function loadCurrentUser() {
      try {
        const me = await api.getMe()
        if (active) {
          setCurrentUser(me)
          setAuthMessage('')
        }
      } catch {
        if (active) {
          setCurrentUser(null)
        }
      }
    }
    loadCurrentUser()
    return () => {
      active = false
    }
  }, [refreshMeSignal])

  useEffect(() => {
    function onDocumentClick(event) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocumentClick)
    return () => {
      document.removeEventListener('mousedown', onDocumentClick)
    }
  }, [])

  useEffect(() => {
    function onAuthRequired() {
      setShowAuthRequiredModal(true)
    }
    window.addEventListener('app:auth-required', onAuthRequired)
    return () => {
      window.removeEventListener('app:auth-required', onAuthRequired)
    }
  }, [])

  async function handleLogout() {
    try {
      await api.logout()
    } catch {
      // keep same behavior for users even if cookie already expired
    } finally {
      setCurrentUser(null)
      setMenuOpen(false)
      setAuthMessage('Da dang xuat')
      setRefreshMeSignal((s) => s + 1)
      navigate('/')
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    const keyword = searchKeyword.trim()
    if (!keyword) {
      navigate('/tours')
      return
    }
    navigate(`/tours?keyword=${encodeURIComponent(keyword)}`)
  }

  function closeAuthRequiredModal() {
    setShowAuthRequiredModal(false)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="traveloka-header">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            Booking
          </Link>
          <form className="topbar-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Tim kiem tour..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button type="submit">Tim</button>
          </form>
          <nav className="topbar-actions">
            <NavLink to="/bookings">Dat cho cua toi</NavLink>
            {!currentUser ? (
              <>
                <NavLink to="/login" className="pill-button login-pill">
                  Dang nhap
                </NavLink>
                <NavLink to="/register" className="pill-button">
                  Dang ky
                </NavLink>
              </>
            ) : (
              <div className="user-menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="user-menu-trigger"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  {currentUser.fullName || currentUser.email}
                </button>
                {menuOpen ? (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-head">
                      <strong>{currentUser.fullName || 'Tai khoan cua ban'}</strong>
                      <span>{currentUser.email}</span>
                    </div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>
                      Chinh sua ho so
                    </Link>
                    <Link to="/bookings" onClick={() => setMenuOpen(false)}>
                      Dat cho cua toi
                    </Link>
                    {isAdmin ? (
                      <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)}>
                        Quan tri Admin
                      </Link>
                    ) : null}
                    <button type="button" onClick={handleLogout}>
                      Dang xuat
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </nav>
        </div>
        <div className="container header-nav-row">
          <nav className="header-main-nav">
            <NavLink to="/">Trang chu</NavLink>
            <NavLink to="/tours">Tour</NavLink>
            <NavLink to="/destinations">Diem den</NavLink>
          </nav>
          {authMessage ? <div className="auth-banner">{authMessage}</div> : null}
        </div>
      </header>

      <main className="container page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/tours/:id/book" element={<TourBookingPage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:id" element={<DestinationDetailPage />} />
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={() => setRefreshMeSignal((s) => s + 1)} />}
          />
          <Route
            path="/profile"
            element={<ProfilePage refreshMeSignal={refreshMeSignal} />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tours"
            element={
              <AdminRoute>
                <AdminToursPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/destinations"
            element={
              <AdminRoute>
                <AdminDestinationsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/cod-confirm"
            element={
              <AdminRoute>
                <AdminCodConfirmPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <div className="footer-col">
            <h3 className="footer-brand">BOOKING TOUR</h3>
            <p className="footer-muted">He thong dat tour nhanh chong, tien loi va uy tin.</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">
                f
              </a>
              <a href="#" aria-label="Instagram">
                i
              </a>
              <a href="#" aria-label="Tiktok">
                t
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Kham Pha</h4>
            <div className="footer-links">
              <Link to="/">Trang chu</Link>
              <Link to="/tours">Tours</Link>
              <Link to="/destinations">Diem den</Link>
              <Link to="/bookings">Dat cho cua toi</Link>
            </div>
          </div>
          <div className="footer-col">
            <h4>Lien He</h4>
            <div className="footer-contact">
              <p>📍 123 Duong ABC, Quan Thu Duc, TP.HCM</p>
              <p>📞 0123 456 789</p>
              <p>✉️ contact@bookingtour.com</p>
            </div>
          </div>
        </div>
      </footer>
      {showAuthRequiredModal ? (
        <div className="auth-required-overlay" role="dialog" aria-modal="true">
          <div className="auth-required-modal">
            <button
              type="button"
              className="auth-required-close"
              aria-label="Close"
              onClick={closeAuthRequiredModal}
            >
              ×
            </button>
            <h3>Ban phai dang nhap de thuc hien chuc nang</h3>
            <div className="actions">
              <button
                type="button"
                className="button"
                onClick={() => {
                  setShowAuthRequiredModal(false)
                  navigate('/login')
                }}
              >
                Dang nhap
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setShowAuthRequiredModal(false)
                  navigate('/register')
                }}
              >
                Dang ky
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
