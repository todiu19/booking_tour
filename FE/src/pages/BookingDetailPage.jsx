import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'

function formatPrice(value) {
  if (value == null) return 'N/A'
  return Number(value).toLocaleString('vi-VN') + ' VND'
}

function formatDateTime(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('vi-VN')
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [tourThumbnail, setTourThumbnail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const result = await api.getMyBookingById(id)
        if (active) setBooking(result)
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

  useEffect(() => {
    let active = true
    async function loadTourThumbnail() {
      if (!booking?.tourId) {
        setTourThumbnail('')
        return
      }
      try {
        const tour = await api.getTourById(booking.tourId)
        if (!active) return
        setTourThumbnail(String(tour?.thumbnailUrl || '').trim())
      } catch {
        if (active) setTourThumbnail('')
      }
    }
    loadTourThumbnail()
    return () => {
      active = false
    }
  }, [booking?.tourId])

  if (loading) return <p>Đang tải chi tiết đơn đặt...</p>
  if (error) return <p className="error">{error}</p>
  if (!booking) return <p>Không tìm thấy đơn đặt.</p>

  return (
    <section className="stack booking-detail-page">
      <div className="booking-detail-topbar">
        <Link className="button button-secondary booking-detail-back-button" to="/bookings" aria-label="Quay lại danh sách đơn">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
        </Link>
      </div>
      <h1>Chi tiết đơn đặt</h1>
      <article className="panel booking-detail-card">
        <div className="booking-detail-media">
          <div className="booking-detail-thumb-wrap">
            <img
              className="booking-detail-thumb"
              src={tourThumbnail || 'https://placehold.co/800x600?text=No+Image'}
              alt={booking.tourName || 'Tour thumbnail'}
              loading="lazy"
            />
          </div>
        </div>
        <div className="booking-detail-info stack">
          <p>
            <strong>Tour:</strong> {booking.tourName || 'Chưa có'}
          </p>
          <p>
            <strong>Mã đơn:</strong> {booking.bookingCode}
          </p>
          <p>
            <strong>Thời gian đặt:</strong> {formatDateTime(booking.createdAt)}
          </p>
          <p>
            <strong>Tổng tiền:</strong> {formatPrice(booking.totalAmount)}
          </p>
          <p>
            <strong>Thanh toán:</strong> {booking.paymentStatus}
          </p>
          <p>
            <strong>Trạng thái đơn:</strong> {booking.bookingStatus}
          </p>
          <p>
            <strong>Số khách:</strong> {booking.adultCount} người lớn, {booking.childCount} trẻ em
          </p>
          <p>
            <strong>Liên hệ:</strong> {booking.contactName} - {booking.contactPhone} - {booking.contactEmail}
          </p>
          {booking.note ? (
            <p>
              <strong>Ghi chú:</strong> {booking.note}
            </p>
          ) : null}
          <div className="actions">
            {booking.canViewInvoice && booking.invoiceId ? (
              <Link className="button" to={`/invoices/${booking.invoiceId}`}>
                Xem hóa đơn
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    </section>
  )
}
