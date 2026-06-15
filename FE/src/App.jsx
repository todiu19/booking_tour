import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import HomePage from './pages/HomePage'
import ToursPage from './pages/ToursPage'
import HotelsPage from './pages/HotelsPage'
import TourDetailPage from './pages/TourDetailPage'
import DestinationsPage from './pages/DestinationsPage'
import DestinationDetailPage from './pages/DestinationDetailPage'
import HotelDetailPage from './pages/HotelDetailPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import RegisterPage from './pages/RegisterPage'
import BookingsPage from './pages/BookingsPage'
import BookingDetailPage from './pages/BookingDetailPage'
import InvoiceDetailPage from './pages/InvoiceDetailPage'
import VnpayReturnPage from './pages/VnpayReturnPage'
import AdminRoute from './components/AdminRoute'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminToursPage from './pages/AdminToursPage'
import AdminHotelsPage from './pages/AdminHotelsPage'
import AdminDestinationsPage from './pages/AdminDestinationsPage'
import AdminCodConfirmPage from './pages/AdminCodConfirmPage'
import TourHomeNav from './components/TourHomeNav'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [refreshMeSignal, setRefreshMeSignal] = useState(0)
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false)

  useEffect(() => {
    function onAuthRequired() {
      const p = location.pathname
      if (p === '/login' || p === '/register') {
        return
      }
      setShowAuthRequiredModal(true)
    }
    window.addEventListener('app:auth-required', onAuthRequired)
    return () => {
      window.removeEventListener('app:auth-required', onAuthRequired)
    }
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/register') {
      setShowAuthRequiredModal(false)
    }
  }, [location.pathname])

  function closeAuthRequiredModal() {
    setShowAuthRequiredModal(false)
    navigate('/')
  }

  return (
    <div className="app-shell">
      <main className="container page">
        <TourHomeNav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hotel" element={<HotelsPage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/hotel/:id" element={<HotelDetailPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:id" element={<DestinationDetailPage />} />
          <Route path="/hotels/:id" element={<HotelDetailPage />} />
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={() => setRefreshMeSignal((s) => s + 1)} />}
          />
          <Route
            path="/profile"
            element={<ProfilePage refreshMeSignal={refreshMeSignal} />}
          />
          <Route path="/profile/change-password" element={<ChangePasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/payment/vnpay-return" element={<VnpayReturnPage />} />
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
            path="/admin/hotels"
            element={
              <AdminRoute>
                <AdminHotelsPage />
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
            <h3 className="footer-brand">BOOKING.COM</h3>
            <p className="footer-muted">Hệ thống đặt tour, khách sạn nhanh chóng, tiện lợi và uy tín.</p>
            <div className="footer-social">
              <a className="fa-brands fa-facebook-f " href="https://www.facebook.com/" target="_blank" aria-label="Facebook"></a>
              <a className="fa-brands fa-instagram" href="http://www.instagram.com/" target="_blank" aria-label="Instagram"></a>
              <a className="fa-brands fa-tiktok" href="https://www.tiktok.com/" target="_blank" aria-label="Tiktok"></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Khám Phá</h4>
            <div className="footer-links">
              <Link to="/" > 
                <i className="fa-notdog fa-solid fa-house"/> Trang chủ
              </Link>
              <Link to="/tours">
                <i className="fa-notdog fa-solid fa-route"/> Tours
              </Link>
              <Link to="/hotels">
                <i className="fa-solid fa-hotel"/> Khách sạn
              </Link>
              <Link to="/destinations">
                <i className="fa-solid fa-map-location-dot" aria-hidden="true" /> Địa điểm nổi tiếng
              </Link>
              {/* <Link to="/bookings">
                <i class="fa-solid fa-receipt"/> Đơn hàng của tôi
              </Link> */}
            </div>
          </div>
          <div className="footer-col">
            <h4>Liên Hệ</h4>
            <div className="footer-contact">
              <p><i className="fa-solid fa-map-pin" aria-hidden="true" /> 10 Đường Trần Phú, Quận Hà Đông, Hà Nội</p>
              <p><i class="fa-solid fa-phone"></i> 0123 456 789</p>
              <p><i class="fa-solid fa-envelope"></i> tonguyen191224@gmail.com</p>
            </div>
          </div>
        </div>
      </footer>
      {showAuthRequiredModal && location.pathname !== '/login' && location.pathname !== '/register' ? (
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
            <h3>Bạn phải đăng nhập để thực hiện chức năng</h3>
            <div className="actions">
              <button
                type="button"
                className="button"
                onClick={() => {
                  setShowAuthRequiredModal(false)
                  navigate('/login')
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setShowAuthRequiredModal(false)
                  navigate('/register')
                }}
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
