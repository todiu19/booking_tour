import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

function formatPrice(value) {
  if (value == null) return 'N/A'
  return Number(value).toLocaleString('vi-VN') + ' đ'
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

/** Điểm khởi hành = tên đầu tiên trong destinationList (JSON hoặc chuỗi danh sách). */
function departureOriginLabel(raw) {
  if (!raw) return null
  const text = String(raw).trim()
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      const first = parsed.map((x) => String(x || '').trim()).filter(Boolean)[0]
      if (first) return first
    }
  } catch {
    // fall through
  }
  const parts = text
    .replace(/^\[\s*/, '')
    .replace(/\s*\]$/, '')
    .replace(/"/g, '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts[0] || null
}

function getCampaignTag(tour) {
  const candidates = [tour?.providerName, tour?.transportProvider, tour?.airlineName, tour?.brandTag]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  if (candidates.length > 0) return candidates[0]
  return 'Gia Tot'
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

  const scoreText = ratingInfo.count > 0 ? ratingInfo.avg.toFixed(1) : '9.0'
  const destinationTag = formatDestinationTag(tour.destinationList)
  const campaignTag = getCampaignTag(tour)
  const highlights = destinationTag
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean)
  const spotTags = highlights.slice(0, 2)
  const extraCount = Math.max(highlights.length - spotTags.length, 0)
  const firstDepartureDate =
    Array.isArray(tour.departureDates) && tour.departureDates.length > 0 ? tour.departureDates[0] : null
  const departureLabel = firstDepartureDate
    ? new Date(firstDepartureDate).toLocaleDateString('vi-VN')
    : 'Linh hoat'
  const comparePrice = tour.comparePrice || tour.originalPrice || null
  const khoiHanhDiaDiem =
    (tour.departurePoint && String(tour.departurePoint).trim()) ||
    departureOriginLabel(tour.destinationList) ||
    'TP. Hồ Chí Minh'

  function goToDetail() {
    const history = JSON.parse(localStorage.getItem('recentTourIds') || '[]')
    const next = [tour.id, ...history.filter((id) => id !== tour.id)].slice(0, 8)
    localStorage.setItem('recentTourIds', JSON.stringify(next))
    navigate(`/tours/${tour.id}`)
  }

  return (
    <article className="card travel-card" role="button" tabIndex={0} onClick={goToDetail} onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        goToDetail()
      }
    }}>
      <div className="card-location-tag">{campaignTag}</div>
      {tour.thumbnailUrl ? (
        <img src={tour.thumbnailUrl} alt={tour.name} className="card-image" />
      ) : (
        <div className="card-image card-image-fallback">No image</div>
      )}
      <div className="card-body">
        <p className="tour-rating">
          <span className="tour-rating-score">{scoreText}</span>
          <span className="tour-rating-label">
            {ratingInfo.count > 0 ? (
              <>
                <span className="tour-rating-best">Tuyet voi</span> | {ratingInfo.count} danh gia
              </>
            ) : (
              'Chua co danh gia'
            )}
          </span>
        </p>
        <h3 className="travel-card-title">{tour.name}</h3>
        <p className="travel-card-meta">
          <span>{tour.durationDays || 1} ngay</span>
          <span
            className="travel-card-departure-point"
            data-departure-point={khoiHanhDiaDiem}
            title="Điểm xuất phát (departure_point)"
          >
            Khoi hanh {khoiHanhDiaDiem}
          </span>
        </p>
        <div className="travel-card-tags">
          {spotTags.map((tag) => (
            <span key={tag} className="travel-card-tag">
              {tag}
            </span>
          ))}
          {extraCount > 0 ? <span className="travel-card-tag">+{extraCount}</span> : null}
        </div>
        <div className="travel-price-wrap">
          {comparePrice ? <span className="travel-price-old">{formatPrice(comparePrice)}</span> : null}
          <p className="travel-price">{formatPrice(tour.basePrice)}</p>
          <p className="travel-departure-note">Khoi hanh ngay {departureLabel}</p>
        </div>
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
