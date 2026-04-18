import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'

function formatPrice(value) {
  if (value == null) return 'N/A'
  return Number(value).toLocaleString('vi-VN') + ' VND'
}
function formatDate(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('vi-VN')
}

export default function TourDetailPage() {
  const { id } = useParams()
  const [tour, setTour] = useState(null)
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const [tourResult, reviewResult] = await Promise.all([
          api.getTourById(id),
          api.getReviewsByTour(id, 0, 20),
        ])
        if (active) {
          setTour(tourResult)
          setReviews(reviewResult?.content || [])
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

  if (loading) return <p>Loading tour detail...</p>
  if (error) return <p className="error">{error}</p>
  if (!tour) return <p>Tour not found.</p>
  const reviewAvg =
    reviews.length > 0
      ? reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / reviews.length
      : 0

  return (
    <section className="stack">
      <h1>{tour.name}</h1>
      <p className="muted">{tour.destinationList}</p>
      <p>Price: {formatPrice(tour.basePrice)}</p>
      <p>Duration: {tour.durationDays} days</p>
      <p>Ngay khoi hanh: {formatDate(tour.departureDate)}</p>
      <p className="tour-rating-detail">
        {reviews.length > 0 ? `★ ${reviewAvg.toFixed(1)} (${reviews.length} review)` : 'Chua co review'}
      </p>
      <p>{tour.description}</p>

      <div className="grid">
        {(tour.imageUrls || []).map((url) => (
          <img key={url} src={url} className="detail-image" alt={tour.name} />
        ))}
      </div>

      <Link className="button inline-button" to={`/tours/${id}/book`}>
        Book tour
      </Link>

      <section className="panel stack">
        <h2>Lich trinh tour</h2>
        {(tour.itineraries || []).length === 0 ? (
          <p className="muted">Chua co lich trinh chi tiet.</p>
        ) : (
          <div className="stack">
            {(tour.itineraries || []).map((item) => (
              <article className="review-item stack" key={item.id || `${item.dayNumber}-${item.title}`}>
                <h3>
                  Ngay {item.dayNumber}: {item.title}
                </h3>
                <p>{item.description || 'Khong co mo ta.'}</p>
                <p className="muted">
                  Khach san:{' '}
                  {(item.hotels || []).length === 0
                    ? 'Khong co'
                    : item.hotels
                        .map((h) =>
                          h?.hotel?.name
                            ? `${h.hotel.name}${h.nightCount ? ` (${h.nightCount} dem)` : ''}`
                            : null,
                        )
                        .filter(Boolean)
                        .join(' / ')}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel stack">
        <h2>Danh sach khach san</h2>
        {(() => {
          const hotels = []
          ;(tour.itineraries || []).forEach((it) => {
            ;(it.hotels || []).forEach((h) => {
              if (h?.hotel?.id && !hotels.some((x) => x.id === h.hotel.id)) {
                hotels.push(h.hotel)
              }
            })
          })
          if (hotels.length === 0) return <p className="muted">Chua co khach san trong lich trinh.</p>
          return (
            <div className="stack">
              {hotels.map((h) => (
                <article key={h.id} className="review-item">
                  <strong>{h.name}</strong>
                  <p className="muted">
                    {h.address || 'Khong ro dia chi'} {h.stars ? `- ${h.stars} sao` : ''}
                  </p>
                </article>
              ))}
            </div>
          )
        })()}
      </section>

      <section className="panel stack">
        <h2>Review tu khach hang</h2>
        {reviews.length === 0 ? (
          <p className="muted">Chua co review cho tour nay.</p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article key={review.id} className="review-item">
                <div className="review-head">
                  <strong>{review.reviewerName || 'Nguoi dung'}</strong>
                  <span className="tour-rating">★ {Number(review.rating || 0).toFixed(1)}</span>
                </div>
                <p className="muted">
                  {review.createdAt ? new Date(review.createdAt).toLocaleString('vi-VN') : ''}
                </p>
                <p>{review.comment || 'Khong co noi dung.'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
