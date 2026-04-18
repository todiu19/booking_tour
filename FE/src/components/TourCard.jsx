import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

function formatPrice(value) {
  if (value == null) return 'N/A'
  return Number(value).toLocaleString('vi-VN') + ' VND'
}

function formatDestinationTag(raw) {
  if (!raw) return 'Viet Nam'
  const text = String(raw).trim()
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      const cleaned = parsed.map((item) => String(item || '').trim()).filter(Boolean)
      if (cleaned.length > 0) return cleaned.join(' / ')
    }
  } catch {
    // keep fallback formatting below
  }
  return text
    .replace(/^\[\s*/, '')
    .replace(/\s*\]$/, '')
    .replace(/"/g, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' / ') || 'Viet Nam'
}

export default function TourCard({ tour }) {
  const navigate = useNavigate()
  const [ratingInfo, setRatingInfo] = useState({ avg: 0, count: 0 })

  useEffect(() => {
    let active = true
    async function loadRating() {
      try {
        const result = await api.getReviewsByTour(tour.id, 0, 20)
        const reviews = result?.content || []
        if (!active) return
        if (reviews.length === 0) {
          setRatingInfo({ avg: 0, count: 0 })
          return
        }
        const sum = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0)
        setRatingInfo({ avg: sum / reviews.length, count: reviews.length })
      } catch {
        if (active) {
          setRatingInfo({ avg: 0, count: 0 })
        }
      }
    }
    loadRating()
    return () => {
      active = false
    }
  }, [tour.id])

  const stars = ratingInfo.count > 0 ? `★ ${ratingInfo.avg.toFixed(1)}` : 'Chua co review'
  const destinationTag = formatDestinationTag(tour.destinationList)

  function goToDetail() {
    navigate(`/tours/${tour.id}`)
  }

  return (
    <article className="card travel-card" role="button" tabIndex={0} onClick={goToDetail} onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        goToDetail()
      }
    }}>
      <div className="card-location-tag">{destinationTag}</div>
      {tour.thumbnailUrl ? (
        <img src={tour.thumbnailUrl} alt={tour.name} className="card-image" />
      ) : (
        <div className="card-image card-image-fallback">No image</div>
      )}
      <div className="card-body">
        <h3 className="travel-card-title">{tour.name}</h3>
        <p className="muted travel-card-subtitle">
          {tour.durationDays}N / {Math.max((tour.durationDays || 1) - 1, 1)}D
        </p>
        <p className="tour-rating">
          {stars}
          {ratingInfo.count > 0 ? ` (${ratingInfo.count})` : ''}
        </p>
        <p className="travel-price">{formatPrice(tour.basePrice)}</p>
        <Link
          className="button travel-card-button"
          to={`/tours/${tour.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          Xem chi tiet
        </Link>
      </div>
    </article>
  )
}
