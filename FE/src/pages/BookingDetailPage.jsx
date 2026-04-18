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

  if (loading) return <p>Loading booking detail...</p>
  if (error) return <p className="error">{error}</p>
  if (!booking) return <p>Booking not found.</p>

  return (
    <section className="stack">
      <h1>Booking Detail</h1>
      <article className="panel stack">
        <p>
          <strong>Tour:</strong> {booking.tourName || 'N/A'}
        </p>
        <p>
          <strong>Booking code:</strong> {booking.bookingCode}
        </p>
        <p>
          <strong>Booked at:</strong> {formatDateTime(booking.createdAt)}
        </p>
        <p>
          <strong>Total:</strong> {formatPrice(booking.totalAmount)}
        </p>
        <p>
          <strong>Payment status:</strong> {booking.paymentStatus}
        </p>
        <p>
          <strong>Booking status:</strong> {booking.bookingStatus}
        </p>
        <p>
          <strong>Pax:</strong> {booking.adultCount} adult, {booking.childCount} child
        </p>
        <p>
          <strong>Contact:</strong> {booking.contactName} - {booking.contactPhone} - {booking.contactEmail}
        </p>
        {booking.note ? (
          <p>
            <strong>Note:</strong> {booking.note}
          </p>
        ) : null}
        <div className="actions">
          {booking.canViewInvoice && booking.invoiceId ? (
            <Link className="button" to={`/invoices/${booking.invoiceId}`}>
              View invoice
            </Link>
          ) : null}
          <Link className="button button-secondary" to="/bookings">
            Back to bookings
          </Link>
        </div>
      </article>
    </section>
  )
}
