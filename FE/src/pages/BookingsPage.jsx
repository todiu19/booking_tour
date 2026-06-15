import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Pagination from '../components/Pagination'

function formatPrice(value) {
  if (value == null) return 'Liên hệ'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

function formatDateTime(value) {
  if (!value) return 'Chưa có'
  return new Date(value).toLocaleString('vi-VN')
}

function formatDate(value) {
  if (!value) return 'Chưa có'
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
  if (String(booking.paymentStatus || '').toLowerCase() !== 'paid') return false
  const outStr = normalizeLocalDate(booking.checkOutDate)
  if (!outStr) return false
  const [yy, mm, dd] = outStr.split('-').map(Number)
  const checkout = new Date(yy, mm - 1, dd)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  checkout.setHours(0, 0, 0, 0)
  return checkout <= today
}

function isDepartureDateReached(value) {
  const dateStr = normalizeLocalDate(value)
  if (!dateStr) return false
  const [yy, mm, dd] = dateStr.split('-').map(Number)
  const departure = new Date(yy, mm - 1, dd)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  departure.setHours(0, 0, 0, 0)
  return departure <= today
}

/** Tour review chỉ mở khi đã thanh toán + đã tới ngày khởi hành + đơn không bị huỷ + chưa review. */
function canReviewTourBooking(booking) {
  if (booking?.reviewed) return false
  if (String(booking?.bookingStatus || '').toLowerCase() === 'cancelled') return false
  if (String(booking?.paymentStatus || '').toLowerCase() !== 'paid') return false
  return isDepartureDateReached(booking?.departureDate)
}

function canCancelOrder(bookingStatus, paymentStatus) {
  const bs = String(bookingStatus || '').toLowerCase()
  const ps = String(paymentStatus || '').toLowerCase()
  if (ps !== 'unpaid') return false
  if (bs === 'cancelled' || bs === 'completed') return false
  return true
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

  async function cancelTourBooking(id) {
    try {
      await api.cancelBooking(id)
      setMessage('Đã huỷ đơn thành công.')
      setError('')
      const result = await api.getMyBookings(page, 8)
      setData(result)
    } catch (e) {
      setError(e.message)
    }
  }

  async function cancelHotelBooking(id) {
    try {
      await api.cancelHotelBooking(id)
      setMessage('Đã huỷ đơn thành công.')
      setError('')
      await reloadHotelBookings()
    } catch (e) {
      setError(e.message)
    }
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
      setError('Vui lòng chọn đánh giá 1-5 *.')
      return
    }
    try {
      await api.createReview({
        tourId: booking.tourId,
        rating: Number(review.rating),
        comment: review.comment || '',
      })
      setMessage('Đã gửi đánh giá thành công.')
      setError('')
      setReviewMap((prev) => ({ ...prev, [booking.id]: { rating: '', comment: '' } }))
      const result = await api.getMyBookings(page, 8)
      setData(result)
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
          Xem tất cả đơn của bạn.
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
        {loading ? <p className="muted bookings-loading">Đang tải...</p> : null}

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
                        <span>Đặt lúc</span>
                        <strong>{formatDateTime(b.createdAt)}</strong>
                      </li>
                      <li>
                        <span>Tổng tiền</span>
                        <strong>{formatPrice(b.totalAmount)}</strong>
                      </li>
                      <li>
                        <span>Trạng thái đơn</span>
                        <strong>{b.bookingStatus === 'pending' ? 'Đang chờ xác nhận' : null} {b.bookingStatus === 'confirmed' ? 'Đã xác nhận' : null} {b.bookingStatus === 'cancelled' ? 'Đã huỷ' : null} {b.bookingStatus === 'completed' ? 'Đã hoàn thành' : null}</strong>
                      </li>
                      <li>
                        <span>Thanh toán</span>
                        <strong>{b.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong>
                      </li>
                    </ul>
                  </div>
                  <div className="actions bookings-card-actions">
                    {b.canViewInvoice && b.invoiceId ? (
                      <Link className="button bookings-invoice-button" to={`/invoices/${b.invoiceId}`}>
                        Xem hoá đơn
                      </Link>
                    ) : (
                      <span className="muted bookings-inline-hint bookings-invoice-placeholder">Chua co hoa don</span>
                    )}
                    <Link className="button button-secondary" to={`/bookings/${b.id}`}>
                      Xem chi tiết
                    </Link>
                    {canCancelOrder(b.bookingStatus, b.paymentStatus) ? (
                      <button className="button button-secondary" type="button" onClick={() => cancelTourBooking(b.id)}>
                        Huỷ đơn
                      </button>
                    ) : null}
                  </div>
                </div>
                {(() => {
                  if (b.reviewed) {
                    return (
                      <p className="muted bookings-review-done">
                        Bạn đã đánh giá tour này. Cảm ơn bạn đã chia sẻ!
                      </p>
                    )
                  }
                  if (String(b.bookingStatus || '').toLowerCase() === 'cancelled') {
                    return (
                      <p className="muted bookings-review-done">Đơn đã hủy, không thể đánh giá.</p>
                    )
                  }
                  if (String(b.paymentStatus || '').toLowerCase() !== 'paid') {
                    return (
                      <p className="muted bookings-review-done">
                        Chỉ đánh giá được khi đơn đã thanh toán.
                      </p>
                    )
                  }
                  if (!isDepartureDateReached(b.departureDate)) {
                    return (
                      <p className="muted bookings-review-done">
                        Bạn có thể đánh giá sau ngày khởi hành{b.departureDate ? ` (${formatDate(b.departureDate)})` : ''}.
                      </p>
                    )
                  }
                  if (!canReviewTourBooking(b)) {
                    return (
                      <p className="muted bookings-review-done">
                        Chưa đủ điều kiện đánh giá tour này.
                      </p>
                    )
                  }
                  return (
                    <div className="review-box bookings-review-wrap">
                      <h4>Đánh giá tour</h4>
                      <div className="bookings-review-fields">
                        <div className="bookings-review-field">
                          <label htmlFor={`rating-${b.id}`}>Điểm (1–5)</label>
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
                          <label htmlFor={`comment-${b.id}`}>Comment</label>
                          <input
                            id={`comment-${b.id}`}
                            placeholder="Chia sẻ trải nghiệm của bạn..."
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
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => submitReview(b)}
                          >
                            Gửi đánh giá
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })()}
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
                  <span className="bookings-type-pill bookings-type-pill--hotel">Khách sạn</span>
                  <h3>{h.hotelName || `Khach san #${h.hotelId || ''}`}</h3>
                  <ul className="bookings-meta-list">
                    <li>
                      <span>Mã</span>
                      <strong>{h.bookingCode || `#${h.id}`}</strong>
                    </li>
                    <li>
                      <span>Nhận / Trả phòng</span>
                      <strong>
                        {formatDate(h.checkInDate)} – {formatDate(h.checkOutDate)}
                      </strong>
                    </li>
                    <li>
                      <span>Phòng / Khách</span>
                      <strong>
                        {h.roomCount ?? '-'} phòng, {h.guestCount ?? '-'} khách
                      </strong>
                    </li>
                    <li>
                      <span>Tổng tiền</span>
                      <strong>{formatPrice(h.totalAmount)}</strong>
                    </li>
                    <li>
                      <span>Trạng thái</span>
                      <strong>
                        {h.bookingStatus != null ? String(h.bookingStatus) : 'Không xác định'} /{' '}
                        {h.paymentStatus != null ? String(h.paymentStatus) : 'Không xác định'}
                      </strong>
                    </li>
                  </ul>
                </div>
                <div className="actions bookings-card-actions">
                  {h.canViewInvoice && h.invoiceId ? (
                    <Link className="button bookings-invoice-button" to={`/invoices/${h.invoiceId}`}>
                      Xem hoá đơn
                    </Link>
                  ) : null}
                  {h.hotelId ? (
                    <Link className="button button-secondary" to={`/hotels/${h.hotelId}`}>
                      Xem khách sạn
                    </Link>
                  ) : null}
                  {canCancelOrder(h.bookingStatus, h.paymentStatus) ? (
                    <button className="button button-secondary" type="button" onClick={() => cancelHotelBooking(h.id)}>
                      Huỷ đơn
                    </button>
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
                if (String(h.paymentStatus || '').toLowerCase() !== 'paid') {
                  return (
                    <p className="muted bookings-review-done">Chỉ đánh giá khi đơn đã thanh toán.</p>
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
                    <h4>Đánh giá khách sạn</h4>
                    <div className="bookings-review-fields">
                      <div className="bookings-review-field">
                        <label htmlFor={`hotel-rating-${h.id}`}>Điểm (1–5)</label>
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
                        <label htmlFor={`hotel-comment-${h.id}`}>Comment</label>
                        <input
                          id={`hotel-comment-${h.id}`}
                          placeholder="Chia sẻ trải nghiệm của bạn..."
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
                        <button type="button" className="button button-secondary" onClick={() => submitHotelReview(h)}>
                          Gửi đánh giá
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
