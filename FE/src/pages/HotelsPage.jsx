import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Gia thap den cao' },
  { value: 'price_desc', label: 'Gia cao den thap' },
  { value: 'stars_asc', label: 'Sao tang dan' },
  { value: 'stars_desc', label: 'Sao giam dan' },
  { value: 'rating_desc', label: 'Danh gia cao' },
  { value: 'rating_asc', label: 'Danh gia thap' },
  { value: 'name_asc', label: 'Ten A-Z' },
  { value: 'name_desc', label: 'Ten Z-A' },
]
const STAR_OPTIONS = [5, 4, 3, 2, 1]

function scoreTone(score) {
  if (score >= 4) return 'excellent'
  if (score >= 3) return 'ok'
  if (score >= 2) return 'bad'
  return 'very-bad'
}

function scoreLabel(score) {
  if (score >= 4) return 'Tuyet voi'
  if (score >= 3) return 'Rất tốt'
  if (score >= 2) return 'Te'
  return 'Rat te'
}

function formatPrice(value) {
  if (value == null) return 'Lien he'
  return Number(value).toLocaleString('vi-VN') + ' đ / đêm'
}

export default function HotelsPage() {
  const [keyword, setKeyword] = useState('')
  const [draftKeyword, setDraftKeyword] = useState('')
  const [roomCapacity, setRoomCapacity] = useState('')
  const [draftRoomCapacity, setDraftRoomCapacity] = useState('')
  const [destination, setDestination] = useState('')
  const [draftDestination, setDraftDestination] = useState('')
  const [destinationOptions, setDestinationOptions] = useState([])
  const [hotelTypeOptions, setHotelTypeOptions] = useState([])
  const [selectedStars, setSelectedStars] = useState([])
  const [selectedHotelTypes, setSelectedHotelTypes] = useState([])
  const [sortBy, setSortBy] = useState('rating_desc')
  const [sortOpen, setSortOpen] = useState(false)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sortFieldRef = useRef(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const result = await api.getHotels({
          keyword,
          name: keyword,
          destination,
          roomCapacity,
          minStars: selectedStars.length > 0 ? Math.min(...selectedStars) : '',
          maxStars: selectedStars.length > 0 ? Math.max(...selectedStars) : '',
          hotelType: selectedHotelTypes.join(','),
          sortBy,
        })
        if (active) setData(result || [])
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
  }, [keyword, roomCapacity, destination, selectedStars, selectedHotelTypes, sortBy])

  useEffect(() => {
    let active = true
    async function loadFilterOptions() {
      try {
        const [destinationsResult, hotelTypesResult] = await Promise.all([
          api.getDestinations({ page: 0, size: 200 }),
          api.getHotelTypes(),
        ])
        if (!active) return
        const destinationNames = Array.from(
          new Set((destinationsResult?.content || []).map((d) => String(d?.name || '').trim()).filter(Boolean)),
        )
        const hotelTypeNames = Array.from(new Set((hotelTypesResult || []).map((x) => String(x || '').trim()).filter(Boolean)))
        setDestinationOptions(destinationNames.sort((a, b) => a.localeCompare(b, 'vi')))
        setHotelTypeOptions(hotelTypeNames.sort((a, b) => a.localeCompare(b, 'vi')))
      } catch {
        if (active) {
          setDestinationOptions([])
          setHotelTypeOptions([])
        }
      }
    }
    loadFilterOptions()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!sortOpen) return
    function onDocDown(e) {
      const t = e.target
      if (!(t instanceof Element)) return
      if (sortFieldRef.current?.contains(t)) return
      setSortOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setSortOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [sortOpen])

  function submitSearch() {
    setKeyword(draftKeyword.trim())
    setRoomCapacity(draftRoomCapacity)
    setDestination(draftDestination.trim())
  }

  return (
    <section className="stack tour-list-page hotel-list-page">
      <div className="search-form home-page tour-home-search-form" role="search">
        <div className="tour-home-search-bottom">
          <div className="tour-home-search-keyword-inner tour-home-search-pill">
            <input
              type="text"
              className="form-control tour-home-search-keyword search-input"
              placeholder="Tim khach san..."
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitSearch()
                }
              }}
            />
          </div>
          <div className="hotel-room-capacity-filter">
            <label htmlFor="hotel-room-capacity" className="tour-home-visually-hidden">
              So nguoi/phong
            </label>
            <select
              id="hotel-room-capacity"
              className="form-control"
              value={draftRoomCapacity}
              onChange={(e) => setDraftRoomCapacity(e.target.value)}
            >
              <option value="">So nguoi/phong</option>
              <option value="1">1 nguoi</option>
              <option value="2">2 nguoi</option>
              <option value="3">3 nguoi</option>
              <option value="4">4 nguoi</option>
              <option value="5">5+ nguoi</option>
            </select>
          </div>
          <div className="hotel-room-capacity-filter">
            <label htmlFor="hotel-destination" className="tour-home-visually-hidden">
              Destination
            </label>
            <select
              id="hotel-destination"
              className="form-control"
              value={draftDestination}
              onChange={(e) => setDraftDestination(e.target.value)}
            >
              <option value="">Destination</option>
              {destinationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="tour-home-country-field">
            <div className="tour-home-search-pill">
              <div className="tour-home-search-pill-body">
                <span className="tour-home-search-pill-label">Quốc gia</span>
                <span className="tour-home-search-pill-value">Việt Nam</span>
              </div>
            </div>
          </div>
          <button type="button" className="tour-home-search-submit" onClick={submitSearch}>
            Tim
          </button>
        </div>
      </div>

      {loading ? <p>Loading hotels...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="hotel-list-layout">
        <aside className="hotel-left-panel">
          <p className="tour-left-search-result-title">
            {keyword || destination
              ? `Kết quả tìm kiếm cho "${keyword || destination}"`
              : 'Khách sạn nổi bật'}
          </p>
          <section className="tour-left-card hotel-filter-card hotel-filter-card--stars">
            <p className="tour-left-card-title hotel-filter-title">Hạng sao</p>
            <div className="hotel-left-check-list">
              {STAR_OPTIONS.map((star) => {
                const checked = selectedStars.includes(star)
                return (
                  <label key={star} className="hotel-left-check-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedStars((prev) => (checked ? prev.filter((s) => s !== star) : [...prev, star]))
                      }
                    />
                    <span className="hotel-star-row">
                      <span className="hotel-star-icons">
                        {'★'.repeat(star)}
                        {'☆'.repeat(5 - star)}
                      </span>
                      <span className="hotel-star-label">{star} sao</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>
          <section className="tour-left-card hotel-filter-card">
            <p className="tour-left-card-title hotel-filter-title">Loại hình nơi ở</p>
            <div className="hotel-left-check-list">
              {hotelTypeOptions.map((type) => {
                const checked = selectedHotelTypes.includes(type)
                return (
                  <label key={type} className="hotel-left-check-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedHotelTypes((prev) => (checked ? prev.filter((t) => t !== type) : [...prev, type]))
                      }
                    />
                    <span className="hotel-type-label">{type}</span>
                  </label>
                )
              })}
            </div>
          </section>
        </aside>

      <div className="hotel-list-rows">
        <div className="tour-sort-wrap" ref={sortFieldRef}>
          <button
            type="button"
            className="tour-sort-trigger"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
            onClick={() => setSortOpen((o) => !o)}
          >
            Sap xep theo <strong>{SORT_OPTIONS.find((x) => x.value === sortBy)?.label || 'Danh gia cao'}</strong>
          </button>
          {sortOpen ? (
            <ul className="tour-sort-menu" role="listbox" aria-label="Sap xep khach san">
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={sortBy === opt.value}
                    className={sortBy === opt.value ? 'tour-sort-item tour-sort-item--active' : 'tour-sort-item'}
                    onClick={() => {
                      setSortBy(opt.value)
                      setSortOpen(false)
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {(data || []).map((hotel) => {
          const avg = Number(hotel.averageRating || 0)
          const reviews = Number(hotel.reviewCount || 0)
          const hasRating = avg > 0 && reviews > 0
          return (
            <Link
              key={hotel.id}
              to={`/hotels/${hotel.id}`}
              className="hotel-list-card-link"
              state={{ hotel }}
              aria-label={hotel.name || `Khach san ${hotel.id}`}
            >
              <article className="hotel-list-card">
                {hotel.thumbnailUrl ? (
                  <img src={hotel.thumbnailUrl} alt={hotel.name} className="hotel-list-thumb" />
                ) : (
                  <div className="hotel-list-thumb hotel-list-thumb--fallback">No image</div>
                )}
                <div className="hotel-list-content">
                  <h3 className="hotel-list-title">{hotel.name || 'Khach san'}</h3>
                  <p className="tour-row-rating">
                    {hasRating ? (
                      <>
                        <span className={`tour-row-score tour-row-score--${scoreTone(avg)}`}>{avg.toFixed(1)}</span>
                        <span className="tour-row-rating-label">{scoreLabel(avg)}</span>
                        <span className="tour-row-rating-label">({reviews} danh gia)</span>
                      </>
                    ) : (
                      <span className="tour-row-rating-label">Chua co danh gia</span>
                    )}
                  </p>
                  {hotel.hotelTypeName ? <p className="hotel-list-address">Loai hinh: {hotel.hotelTypeName}</p> : null}
                  {hotel.location ? (
                    <p className="hotel-list-price">Vi tri phong: {hotel.location}</p>
                  ) : (
                    <p className="hotel-list-price">Vi tri phong: Dang cap nhat</p>
                  )}
                  {hotel.roomCapacity ? <p className="hotel-list-address">Phong {hotel.roomCapacity} nguoi</p> : null}
                  {hotel.address ? <p className="hotel-list-address">{hotel.address}</p> : null}
                </div>
                <div className="hotel-list-cta-col">
                  <p className="hotel-list-cta-note">Giá trung bình mỗi đêm</p>
                  <p className="hotel-list-cta-price">{formatPrice(hotel.basePrice)}</p>
                  <span className="tour-row-cta">Xem chi tiet</span>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
      </div>

      {!loading && (data || []).length === 0 ? <p>Khong tim thay khach san.</p> : null}
    </section>
  )
}
