import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'

function formatPrice(value) {
  if (value == null) return 'Chưa có'
  return Number(value).toLocaleString('vi-VN') + ' VND'
}
function formatDate(value) {
  if (!value) return 'Chưa có'
  return new Date(value).toLocaleDateString('vi-VN')
}

export default function TourBookingPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const initialAdultCount = Math.max(Number(searchParams.get('adultCount') || 1), 1)
  const initialChildCount = Math.max(Number(searchParams.get('childCount') || 0), 0)
  const initialPaymentMethod = searchParams.get('paymentMethod') === 'vnpay' ? 'vnpay' : 'cod'
  const [tour, setTour] = useState(null)
  const [bookingForm, setBookingForm] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    adultCount: initialAdultCount,
    childCount: initialChildCount,
    note: '',
    provider: initialPaymentMethod,
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const [tourResult, me] = await Promise.all([api.getTourById(id), api.getMe().catch(() => null)])
        if (!active) return
        setTour(tourResult)
        if (me) {
          setBookingForm((prev) => ({
            ...prev,
            contactName: prev.contactName || me.fullName || '',
            contactPhone: prev.contactPhone || me.phone || '',
            contactEmail: prev.contactEmail || me.email || '',
          }))
        }
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
  }, [id])

  const totalAmount = useMemo(() => {
    const adult = Number(bookingForm.adultCount || 0)
    const child = Number(bookingForm.childCount || 0)
    const pax = Math.max(adult + child, 0)
    const unit = Number(tour?.basePrice || 0)
    return pax * unit
  }, [bookingForm.adultCount, bookingForm.childCount, tour?.basePrice])

  async function submitBooking(e) {
    e.preventDefault()
    try {
      setBookingLoading(true)
      setError('')
      setMessage('')
      const booking = await api.createBooking({
        tourId: Number(id),
        contactName: bookingForm.contactName,
        contactPhone: bookingForm.contactPhone,
        contactEmail: bookingForm.contactEmail,
        adultCount: Number(bookingForm.adultCount),
        childCount: Number(bookingForm.childCount),
        note: bookingForm.note,
        paymentMethod: bookingForm.provider,
      })

      if (booking?.paymentUrl) {
        window.location.href = booking.paymentUrl
        return
      }

      setMessage(`Đặt tour thành công. Mã đơn: ${booking?.booking?.bookingCode || ''}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) return <p>Đang tải biểu mẫu đặt tour...</p>
  if (error && !tour) return <p className="error">{error}</p>
  if (!tour) return <p>Không tìm thấy tour.</p>
  const firstDepartureDate = Array.isArray(tour.departureDates) && tour.departureDates.length > 0 ? tour.departureDates[0] : null

  return (
    <section className="stack">
      <div className="actions">
        <Link className="button button-secondary inline-button" to={`/tours/${id}`}>
          Quay lại chi tiết tour
        </Link>
      </div>
      <div className="booking-layout">
        <section className="panel stack">
          <h2>Thông tin liên hệ đặt tour</h2>
          <form onSubmit={submitBooking} className="stack">
            <label>
              Họ và tên
              <input
                value={bookingForm.contactName}
                onChange={(e) => setBookingForm((p) => ({ ...p, contactName: e.target.value }))}
                required
              />
            </label>
            <label>
              Số điện thoại
              <input
                value={bookingForm.contactPhone}
                onChange={(e) => setBookingForm((p) => ({ ...p, contactPhone: e.target.value }))}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={bookingForm.contactEmail}
                onChange={(e) => setBookingForm((p) => ({ ...p, contactEmail: e.target.value }))}
                required
              />
            </label>
            <div className="filters booking-filters">
              <label>
                Người lớn
                <input
                  type="number"
                  min="1"
                  value={bookingForm.adultCount}
                  onChange={(e) => setBookingForm((p) => ({ ...p, adultCount: e.target.value }))}
                  required
                />
              </label>
              <label>
                Trẻ em
                <input
                  type="number"
                  min="0"
                  value={bookingForm.childCount}
                  onChange={(e) => setBookingForm((p) => ({ ...p, childCount: e.target.value }))}
                  required
                />
              </label>
            </div>
            <label>
              Phương thức thanh toán
              <select
                value={bookingForm.provider}
                onChange={(e) => setBookingForm((p) => ({ ...p, provider: e.target.value }))}
              >
                <option value="cod">COD</option>
                <option value="vnpay">VNPay</option>
              </select>
            </label>
            <label>
              Ghi chú
              <input
                value={bookingForm.note}
                onChange={(e) => setBookingForm((p) => ({ ...p, note: e.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="stack">
          <article className="panel stack">
            <h2>Thông tin tour</h2>
            {tour.imageUrls?.[0] ? (
              <img src={tour.imageUrls[0]} alt={tour.name} className="detail-image" />
            ) : (
              <div className="detail-image card-image-fallback">Không có ảnh</div>
            )}
            <p>
              <strong>{tour.name}</strong>
            </p>
            <p>Ngày khởi hành: {formatDate(firstDepartureDate)}</p>
            <p>Thời lượng: {tour.durationDays} ngày</p>
            <p>{tour.description || 'Chưa có mô tả.'}</p>
          </article>
          <article className="panel stack">
            <h2>Tổng chi phí</h2>
            <p>
              Số khách: {Number(bookingForm.adultCount || 0) + Number(bookingForm.childCount || 0)} (
              {bookingForm.adultCount} người lớn, {bookingForm.childCount} trẻ em)
            </p>
            <p>
              <strong>{formatPrice(totalAmount)}</strong>
            </p>
            <button className="button inline-button" type="button" disabled={bookingLoading} onClick={submitBooking}>
              {bookingLoading ? 'Đang xử lý...' : 'Đặt tour'}
            </button>
            {message ? <p className="success">{message}</p> : null}
            {error ? <p className="error">{error}</p> : null}
          </article>
        </section>
      </div>
    </section>
  )
}
