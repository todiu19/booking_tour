import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Pagination from '../components/Pagination'

function formatPrice(value) {
  if (value == null) return 'Lien he'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

function formatDateTime(value) {
  if (!value) return 'Chua co'
  return new Date(value).toLocaleString('vi-VN')
}

function formatDate(value) {
  if (!value) return 'Chua co'
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d)}/${pad(m)}/${y}`
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }
  return new Date(value).toLocaleDateString('vi-VN')
}

function normalizeLocalDate(value) {
  if (value == null) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value
    const pad = (n) => String(n).padStart(2, '0')
    return `${y}-${pad(m)}-${pad(d)}`
  }
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 10)
  } catch {
    return null
  }
}

/** Đủ điều kiện gửi đánh giá: đã qua ngày trả phòng, đơn không huỷ, chưa có review */
function canReviewHotelBooking(booking) {
  if (booking.reviewed) return false
  if (String(booking.bookingStatus || '').toLowerCase() === 'cancelled') return false
  const outStr = normalizeLocalDate(booking.checkOutDate)
  if (!outStr) return false
  const [yy, mm, dd] = outStr.split('-').map(Number)
  const checkout = new Date(yy, mm - 1, dd)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  checkout.setHours(0, 0, 0, 0)
  return checkout <= today
}

export default function BookingsPage() {
  const [data, setData] = useState(null)
  const [hotelData, setHotelData] = useState(null)
  const [hotelLoading, setHotelLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewMap, setReviewMap] = useState({})
  const [hotelReviewMap, setHotelReviewMap] = useState({})
  const [activeTab, setActiveTab] = useState('tour')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const result = await api.getMyBookings(page, 8)
        if (active) setData(result)
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [page])

  useEffect(() => {
    let active = true
    async function loadHotels() {
      try {
        setHotelLoading(true)
        const result = await api.getMyHotelBookings(0, 15)
        if (active) setHotelData(result)
      } catch {
        if (active) setHotelData({ content: [], totalPages: 0, page: 0 })
      } finally {
        if (active) setHotelLoading(false)
      }
    }
    loadHotels()
    return () => {
      active = false
    }
  }, [])

  async function reloadHotelBookings() {
    const result = await api.getMyHotelBookings(0, 15)
    setHotelData(result)
  }

  async function submitHotelReview(booking) {
    const review = hotelReviewMap[booking.id]
    if (!review?.rating) {
      setError('Vui lòng chọn điểm từ 1 đến 5 trước khi gửi đánh giá khách sạn.')
      return
    }
    try {
      await api.createHotelReview({
        hotelBookingId: booking.id,
        rating: Number(review.rating),
        comment: review.comment || '',
      })
      setMessage('Đã gửi đánh giá khách sạn thành công.')
      setError('')
      setHotelReviewMap((prev) => ({
        ...prev,
        [booking.id]: { rating: '', comment: '' },
      }))
      await reloadHotelBookings()
    } catch (e) {
      setError(e.message)
    }
  }

  async function submitReview(booking) {
    const review = reviewMap[booking.id]
    if (!review?.rating) {
      setError('Vui long chon diem danh gia tu 1 den 5 truoc khi gui.')
      return
    }
    try {
      await api.createReview({
        tourId: booking.tourId,
        rating: Number(review.rating),
        comment: review.comment || '',
      })
      setMessage('Da gui danh gia tour thanh cong.')
      setError('')
      setReviewMap((prev) => ({ ...prev, [booking.id]: { rating: '', comment: '' } }))
    } catch (e) {
      setError(e.message)
    }
  }

  const tours = data?.content || []
  const hotels = hotelData?.content || []

  return (
    <section className="profile-page bookings-history-page">
      <div className="profile-hero panel">
        <h1>Đơn hàng của tôi</h1>
        <p className="muted">
          Xem tat ca don dat tour va dat phong khach san cua ban, xem chi tiet va xu ly ho don (neu co).
        </p>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="bookings-tab-panel panel">
        <div className="bookings-tabs" role="tablist" aria-label="Loai don hang">
          <button
            type="button"
            role="tab"
            id="tab-tour-bookings"
            aria-selected={activeTab === 'tour'}
            className={`bookings-tab ${activeTab === 'tour' ? 'active' : ''}`}
            onClick={() => setActiveTab('tour')}
          >
            Tour
          </button>
          <button
            type="button"
            role="tab"
            id="tab-hotel-bookings"
            aria-selected={activeTab === 'hotel'}
            className={`bookings-tab ${activeTab === 'hotel' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotel')}
          >
            Khách sạn
          </button>
        </div>

        {activeTab === 'tour' ? (
          <div className="bookings-section bookings-tab-pane" role="tabpanel" aria-labelledby="tab-tour-bookings">
        {loading ? <p className="muted bookings-loading">Đang tải đơn tour...</p> : null}

        {!loading &&
          tours.map((b) => {
            const review = reviewMap[b.id] || { rating: '', comment: '' }
            return (
              <article className="bookings-card panel" key={`tour-${b.id}`}>
                <div className="booking-head bookings-card-head panel-head">
                  <div className="booking-summary stack bookings-card-main">
                    <span className="bookings-type-pill bookings-type-pill--tour">Tour</span>
                    <h3>{b.tourName || `Tour #${b.tourId || ''}`}</h3>
                    <ul className="bookings-meta-list">
                      <li>
                        <span>Dat luc</span>
                        <strong>{formatDateTime(b.createdAt)}</strong>
                      </li>
                      <li>
                        <span>Tong tien</span>
                        <strong>{formatPrice(b.totalAmount)}</strong>
                      </li>
                      <li>
                        <span>Thanh toan</span>
                        <strong>{b.paymentStatus || 'Chua ro'}</strong>
                      </li>
                    </ul>
                  </div>
                  <div className="actions bookings-card-actions">
                    {b.canViewInvoice && b.invoiceId ? (
                      <Link className="button" to={`/invoices/${b.invoiceId}`}>
                        Xem hoa don
                      </Link>
                    ) : (
                      <span className="muted bookings-inline-hint">Chua co hoa don</span>
                    )}
                    <Link className="button button-secondary" to={`/bookings/${b.id}`}>
                      Xem chi tiet
                    </Link>
                  </div>
                </div>
                <div className="review-box bookings-review-wrap">
                  <h4>Danh gia tour</h4>
                  <div className="bookings-review-fields">
                    <div className="bookings-review-field">
                      <label htmlFor={`rating-${b.id}`}>Diem (1–5)</label>
                      <input
                        id={`rating-${b.id}`}
                        type="number"
                        min="1"
                        max="5"
                        placeholder="1-5"
                        value={review.rating}
                        onChange={(e) =>
                          setReviewMap((prev) => ({
                            ...prev,
                            [b.id]: { ...review, rating: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="bookings-review-field bookings-review-field--grow">
                      <label htmlFor={`comment-${b.id}`}>Binh luan</label>
                      <input
                        id={`comment-${b.id}`}
                        placeholder="Chia se trai nghiem..."
                        value={review.comment}
                        onChange={(e) =>
                          setReviewMap((prev) => ({
                            ...prev,
                            [b.id]: { ...review, comment: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="bookings-review-submit">
                      <button type="button" className="button" onClick={() => submitReview(b)}>
                        Gui danh gia
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}

        {!loading && tours.length === 0 ? (
          <div className="bookings-empty panel">
            <p>Bạn chưa có đơn đặt tour nào.</p>
            <Link className="button" to="/tours">
              Khám phá tour
            </Link>
          </div>
        ) : null}

        {!loading ? <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} /> : null}
          </div>
        ) : null}

        {activeTab === 'hotel' ? (
          <div className="bookings-section bookings-tab-pane" role="tabpanel" aria-labelledby="tab-hotel-bookings">
        {hotelLoading ? <p className="muted bookings-loading">Đang tải đơn phòng...</p> : null}

        {!hotelLoading &&
          hotels.map((h) => (
            <article className="bookings-card panel" key={`hotel-${h.id}`}>
              <div className="booking-head bookings-card-head panel-head">
                <div className="booking-summary stack bookings-card-main">
                  <span className="bookings-type-pill bookings-type-pill--hotel">Khach san</span>
                  <h3>{h.hotelName || `Khach san #${h.hotelId || ''}`}</h3>
                  <ul className="bookings-meta-list">
                    <li>
                      <span>Ma dat</span>
                      <strong>{h.bookingCode || `#${h.id}`}</strong>
                    </li>
                    <li>
                      <span>Nhan / Tra phong</span>
                      <strong>
                        {formatDate(h.checkInDate)} – {formatDate(h.checkOutDate)}
                      </strong>
                    </li>
                    <li>
                      <span>Phong / Khach</span>
                      <strong>
                        {h.roomCount ?? '-'} phong, {h.guestCount ?? '-'} khach
                      </strong>
                    </li>
                    <li>
                      <span>Tong tien</span>
                      <strong>{formatPrice(h.totalAmount)}</strong>
                    </li>
                    <li>
                      <span>Trang thai</span>
                      <strong>
                        {h.bookingStatus != null ? String(h.bookingStatus) : 'Chua ro'} /{' '}
                        {h.paymentStatus != null ? String(h.paymentStatus) : 'Chua ro'}
                      </strong>
                    </li>
                  </ul>
                </div>
                <div className="actions bookings-card-actions">
                  {h.hotelId ? (
                    <Link className="button" to={`/hotels/${h.hotelId}`}>
                      Xem khach san
                    </Link>
                  ) : null}
                </div>
              </div>
              {(() => {
                const review = hotelReviewMap[h.id] || { rating: '', comment: '' }
                if (h.reviewed) {
                  return (
                    <p className="muted bookings-review-done">
                      Bạn đã đánh giá đơn lưu trú này. Cảm ơn bạn đã chia sẻ!
                    </p>
                  )
                }
                if (String(h.bookingStatus || '').toLowerCase() === 'cancelled') {
                  return (
                    <p className="muted bookings-review-done">Đơn đã hủy, không thể đánh giá.</p>
                  )
                }
                if (!canReviewHotelBooking({ ...h, reviewed: false })) {
                  return (
                    <p className="muted bookings-review-done">
                      Bạn có thể đánh giá sau ngày trả phòng (và đơn không bị hủy).
                    </p>
                  )
                }
                return (
                  <div className="review-box bookings-review-wrap">
                    <h4>Danh gia khach san</h4>
                    <div className="bookings-review-fields">
                      <div className="bookings-review-field">
                        <label htmlFor={`hotel-rating-${h.id}`}>Diem (1–5)</label>
                        <input
                          id={`hotel-rating-${h.id}`}
                          type="number"
                          min="1"
                          max="5"
                          placeholder="1-5"
                          value={review.rating}
                          onChange={(e) =>
                            setHotelReviewMap((prev) => ({
                              ...prev,
                              [h.id]: { ...review, rating: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="bookings-review-field bookings-review-field--grow">
                        <label htmlFor={`hotel-comment-${h.id}`}>Binh luan</label>
                        <input
                          id={`hotel-comment-${h.id}`}
                          placeholder="Khong gian, dich vu..."
                          value={review.comment}
                          onChange={(e) =>
                            setHotelReviewMap((prev) => ({
                              ...prev,
                              [h.id]: { ...review, comment: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="bookings-review-submit">
                        <button type="button" className="button" onClick={() => submitHotelReview(h)}>
                          Gui danh gia
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </article>
          ))}

        {!hotelLoading && hotels.length === 0 ? (
          <div className="bookings-empty panel">
            <p>Bạn chưa có đơn đặt phòng nào.</p>
            <Link className="button" to="/hotels">
              Tìm khách sạn
            </Link>
          </div>
        ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
