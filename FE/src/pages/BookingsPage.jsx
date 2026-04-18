import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Pagination from '../components/Pagination'

function formatPrice(value) {
  if (value == null) return 'N/A'
  return Number(value).toLocaleString('vi-VN') + ' VND'
}

function formatDateTime(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('vi-VN')
}

export default function BookingsPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewMap, setReviewMap] = useState({})

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

  async function submitReview(booking) {
    const review = reviewMap[booking.id]
    if (!review?.rating) {
      setError('Please enter rating before submit review')
      return
    }
    try {
      await api.createReview({
        tourId: booking.tourId,
        rating: Number(review.rating),
        comment: review.comment || '',
      })
      setMessage('Review submitted')
      setReviewMap((prev) => ({ ...prev, [booking.id]: { rating: '', comment: '' } }))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <section className="stack">
      <h1>My Bookings</h1>
      <p className="muted">History, payment and review actions.</p>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading bookings...</p> : null}

      <div className="stack">
        {(data?.content || []).map((b) => {
          const review = reviewMap[b.id] || { rating: '', comment: '' }
          return (
            <article className="panel" key={b.id}>
              <div className="panel-head booking-head">
                <div className="stack booking-summary">
                  <h3>{b.tourName || 'Tour'}</h3>
                  <p>
                    <strong>Thoi gian book:</strong> {formatDateTime(b.createdAt)}
                  </p>
                  <p>
                    <strong>Tong tien:</strong> {formatPrice(b.totalAmount)}
                  </p>
                  <p>
                    <strong>Trang thai thanh toan:</strong> {b.paymentStatus}
                  </p>
                </div>
                <div className="actions">
                  {b.canViewInvoice && b.invoiceId ? (
                    <Link className="button" to={`/invoices/${b.invoiceId}`}>
                      View invoice
                    </Link>
                  ) : (
                    <span className="muted">Chua co invoice</span>
                  )}
                  <Link className="button button-secondary" to={`/bookings/${b.id}`}>
                    View detail
                  </Link>
                </div>
              </div>
              <div className="review-box">
                <h4>Write review</h4>
                <div className="review-grid">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    placeholder="Rating 1-5"
                    value={review.rating}
                    onChange={(e) =>
                      setReviewMap((prev) => ({
                        ...prev,
                        [b.id]: { ...review, rating: e.target.value },
                      }))
                    }
                  />
                  <input
                    placeholder="Comment"
                    value={review.comment}
                    onChange={(e) =>
                      setReviewMap((prev) => ({
                        ...prev,
                        [b.id]: { ...review, comment: e.target.value },
                      }))
                    }
                  />
                  <button type="button" className="button" onClick={() => submitReview(b)}>
                    Submit review
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {!loading && (data?.content || []).length === 0 ? <p>No bookings yet.</p> : null}

      <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} />
    </section>
  )
}
