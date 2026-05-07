import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'

const EMPTY_FILTERS = { keyword: '', departurePoint: '', sortBy: 'departure_date' }
const VI_WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const SORT_OPTIONS = [
  { value: 'departure_date', label: 'Ngày khởi hành' },
  { value: 'rating_desc', label: 'Đánh giá cao' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
]
const PRICE_FILTER_OPTIONS = [
  { key: 'under_11', label: '< 11 triệu', min: null, max: 11_000_000 },
  { key: '11_18', label: '11 - 18 triệu', min: 11_000_000, max: 18_000_000 },
  { key: '18_22', label: '18 - 22 triệu', min: 18_000_000, max: 22_000_000 },
  { key: 'over_22', label: '> 22 triệu', min: 22_000_000, max: null },
]

function resolvePriceRange(filterKey) {
  switch (filterKey) {
    case 'under_11':
      return { minPrice: null, maxPrice: 10_999_999 }
    case '11_18':
      return { minPrice: 11_000_000, maxPrice: 17_999_999 }
    case '18_22':
      return { minPrice: 18_000_000, maxPrice: 21_999_999 }
    case 'over_22':
      return { minPrice: 22_000_001, maxPrice: null }
    default:
      return { minPrice: null, maxPrice: null }
  }
}

function sameCalendarDay(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function buildCalendarCells(year, month) {
  const first = new Date(year, month, 1)
  const pad = first.getDay() === 0 ? 6 : first.getDay() - 1
  const cells = []
  const prevLast = new Date(year, month, 0).getDate()
  for (let i = 0; i < pad; i++) {
    const day = prevLast - pad + i + 1
    cells.push({ date: new Date(year, month - 1, day), inMonth: false })
  }
  const dim = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= dim; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true })
  }
  let n = 1
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, n), inMonth: false })
    n += 1
  }
  return cells
}

function formatPrice(value) {
  if (value == null) return 'Chưa có'
  return Number(value).toLocaleString('vi-VN') + ' đ'
}

function parseDestinationTags(raw) {
  if (!raw) return []
  const text = String(raw).trim()
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean)
    }
  } catch {
    // fall through to string parsing
  }
  return text
    .replace(/^\[\s*/, '')
    .replace(/\s*\]$/, '')
    .replace(/"/g, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function extractRatingInfo(tour) {
  const avgRaw = tour?.averageRating ?? tour?.avgRating ?? tour?.ratingAvg ?? null
  const countRaw = tour?.reviewCount ?? tour?.ratingCount ?? tour?.totalReviews ?? 0
  const avg = Number(avgRaw)
  const count = Number(countRaw)
  const hasRating = Number.isFinite(avg) && avg > 0 && Number.isFinite(count) && count > 0
  let tone = 'very-bad'
  let text = 'Rất tệ'
  if (avg >= 4) {
    tone = 'excellent'
    text = 'Tuyệt vời'
  } else if (avg >= 3) {
    tone = 'ok'
    text = 'Rất tốt'
  } else if (avg >= 2) {
    tone = 'bad'
    text = 'Tệ'
  }
  return {
    hasRating,
    scoreText: hasRating ? avg.toFixed(1) : '',
    tone,
    label: hasRating ? `${text} | ${count} đánh giá` : 'Chưa có đánh giá',
  }
}

export default function ToursPage() {
  const [searchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') || ''
  const initialOrigin = searchParams.get('origin') || ''
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [draftKeyword, setDraftKeyword] = useState('')
  const [data, setData] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [originOptions, setOriginOptions] = useState(['Tất cả'])
  const [departureSelected, setDepartureSelected] = useState(null)
  const [departureView, setDepartureView] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [originOpen, setOriginOpen] = useState(false)
  const [originSelected, setOriginSelected] = useState('Tất cả')
  const originFieldRef = useRef(null)
  const [countryOpen, setCountryOpen] = useState(false)
  const [countrySelected, setCountrySelected] = useState('Việt Nam')
  const countryFieldRef = useRef(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState('departure_date')
  const sortFieldRef = useRef(null)
  const [priceFilter, setPriceFilter] = useState('')

  useEffect(() => {
    const normalizedOrigin =
      initialOrigin && initialOrigin !== 'Tất cả'
        ? initialOrigin.replace('TP. Hồ Chí Minh', 'TP HCM').trim()
        : ''
    setDraftKeyword(initialKeyword)
    setOriginSelected(initialOrigin || 'Tất cả')
    setFilters((prev) => ({ ...prev, keyword: initialKeyword, departurePoint: normalizedOrigin }))
  }, [initialKeyword, initialOrigin])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const result = await api.getTours(filters)
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
  }, [filters])

  useEffect(() => {
    let active = true
    async function loadOriginOptions() {
      try {
        const result = await api.getDestinations({ page: 0, size: 200 })
        if (!active) return
        const normalized = (value) => {
          const raw = String(value || '').trim()
          const compact = raw.toLowerCase().replace(/[.\s_-]+/g, '')
          if (
            compact === 'tphcm' ||
            compact === 'hochiminh' ||
            compact === 'thanhphohochiminh' ||
            compact === 'tphochiminh'
          ) {
            return 'TP HCM'
          }
          return raw
        }
        const provinces = Array.from(
          new Set(
            (result?.content || [])
              .map((item) => normalized(item?.province))
              .filter(Boolean)
          )
        )
        const priority = ['Hà Nội', 'Đà Nẵng', 'TP HCM']
        const prioritySet = new Set(priority)
        const rest = provinces
          .filter((name) => !prioritySet.has(name))
          .sort((a, b) => a.localeCompare(b, 'vi'))
        const ordered = priority.concat(rest)
        setOriginOptions(['Tất cả', ...ordered])
      } catch {
        if (active) setOriginOptions(['Tất cả', 'Hà Nội', 'Đà Nẵng', 'TP HCM'])
      }
    }
    loadOriginOptions()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!originOpen) return
    function onDocDown(e) {
      const t = e.target
      if (!(t instanceof Element)) return
      if (originFieldRef.current?.contains(t)) return
      setOriginOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOriginOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [originOpen])

  useEffect(() => {
    if (!sortOpen) return
    function onDocDown(e) {
      const t = e.target
      if (!(t instanceof Element)) return
      if (sortFieldRef.current?.contains(t)) return
      setSortOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [sortOpen])

  useEffect(() => {
    if (!countryOpen) return
    function onDocDown(e) {
      const t = e.target
      if (!(t instanceof Element)) return
      if (countryFieldRef.current?.contains(t)) return
      setCountryOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [countryOpen])

  const calYear = departureView.getFullYear()
  const calMonth = departureView.getMonth()
  const calendarCells = buildCalendarCells(calYear, calMonth)
  const selectedDepartureIso = departureSelected
    ? `${departureSelected.getFullYear()}-${String(departureSelected.getMonth() + 1).padStart(2, '0')}-${String(
        departureSelected.getDate()
      ).padStart(2, '0')}`
    : null
  const displayedTours = (data || []).filter((tour) => {
    const passDeparture =
      !selectedDepartureIso || (Array.isArray(tour.departureDates) && tour.departureDates.includes(selectedDepartureIso))
    if (!passDeparture) return false
    return true
  })

  function submitSearch() {
    const selectedOrigin =
      originSelected && originSelected !== 'Tất cả'
        ? originSelected.replace('TP. Hồ Chí Minh', 'TP HCM').trim()
        : ''
    setFilters((prev) => ({
      ...prev,
      keyword: draftKeyword.trim(),
      departurePoint: selectedOrigin,
      sortBy,
    }))
    setOriginOpen(false)
  }

  return (
    <section className="stack tour-list-page">
      <div className="search-form home-page tour-home-search-form" role="search">
        <div className="tour-home-search-bottom">
          <div className="tour-home-search-keyword-inner tour-home-search-pill">
            <span className="tour-home-search-icon tour-home-search-icon--search" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15zM21 21l-4.35-4.35"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="text"
              className="form-control tour-home-search-keyword search-input"
              placeholder="Bạn muốn đi đâu?"
              maxLength={200}
              autoComplete="off"
              spellCheck={false}
              value={draftKeyword}
              onChange={(e) => {
                setDraftKeyword(e.target.value)
                // Live-search (tìm ngay khi gõ) giữ lại để bật lại sau nếu cần:
                // setFilters((prev) => ({ ...prev, keyword: e.target.value }))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitSearch()
                }
              }}
            />
          </div>
          <div
            className={`tour-home-origin-field${originOpen ? ' tour-home-origin-field--open' : ''}`}
            ref={originFieldRef}
          >
            <button
              type="button"
              className={`tour-home-search-pill-wrap tour-home-origin-trigger${
                originOpen ? ' tour-home-search-pill--open' : ''
              }`}
              aria-expanded={originOpen}
              aria-haspopup="listbox"
              aria-label="Khởi hành từ"
              onClick={(e) => {
                e.stopPropagation()
                setOriginOpen((o) => !o)
              }}
            >
              <span className="tour-home-search-pill-icon" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10.5 4.5L21 12l-10.5 3.5L8 21l-1.5-5.5L2 12l4.5-2.5L10.5 4.5z"
                    stroke="#475569"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="tour-home-search-pill-body">
                <span className="tour-home-search-pill-label">Khởi hành từ</span>
                <span className="tour-home-search-pill-value">{originSelected}</span>
              </div>
            </button>
            {originOpen ? (
              <ul className="tour-home-origin-list" role="listbox" aria-label="Danh sách điểm khởi hành" onClick={(e) => e.stopPropagation()}>
                {originOptions.map((opt) => (
                  <li key={opt} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={originSelected === opt}
                      className={
                        originSelected === opt
                          ? 'tour-home-origin-option tour-home-origin-option--active'
                          : 'tour-home-origin-option'
                      }
                      onClick={() => {
                        setOriginSelected(opt)
                        setOriginOpen(false)
                      }}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div
            className={`tour-home-country-field tour-home-origin-field${
              countryOpen ? ' tour-home-origin-field--open' : ''
            }`}
            ref={countryFieldRef}
          >
            <button
              type="button"
              className={`tour-home-search-pill-wrap tour-home-origin-trigger${
                countryOpen ? ' tour-home-search-pill--open' : ''
              }`}
              aria-expanded={countryOpen}
              aria-haspopup="listbox"
              aria-label="Quốc gia"
              onClick={(e) => {
                e.stopPropagation()
                setCountryOpen((o) => !o)
              }}
            >
              <div className="tour-home-search-pill-body">
                <span className="tour-home-search-pill-label">Quốc gia</span>
                <span className="tour-home-search-pill-value">{countrySelected}</span>
              </div>
            </button>
            {countryOpen ? (
              <ul className="tour-home-origin-list" role="listbox" aria-label="Danh sách quốc gia" onClick={(e) => e.stopPropagation()}>
                <li role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={countrySelected === 'Việt Nam'}
                    className={
                      countrySelected === 'Việt Nam'
                        ? 'tour-home-origin-option tour-home-origin-option--active'
                        : 'tour-home-origin-option'
                    }
                    onClick={() => {
                      setCountrySelected('Việt Nam')
                      setCountryOpen(false)
                    }}
                  >
                    Việt Nam
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
          <button type="button" className="tour-home-search-submit" onClick={submitSearch}>
            Tìm
          </button>
        </div>
      </div>

      {loading && <p>Đang tải danh sách tour...</p>}
      {error && <p className="error">{error}</p>}

      <div className="tour-list-content">
        <aside className="tour-left-panel">
          <p className="tour-left-search-result-title">
            {filters.keyword && String(filters.keyword).trim()
              ? `Kết quả tìm kiếm cho "${String(filters.keyword).trim()}"`
              : 'Tour nổi bật'}
          </p>
          <section className="tour-left-card">
            <p className="tour-left-card-title">Ngày khởi hành</p>
            <div className="tour-left-date-head">
              <button
                type="button"
                className="tour-home-date-nav"
                aria-label="Tháng trước"
                onClick={() => setDepartureView(new Date(calYear, calMonth - 1, 1))}
              >
                ‹
              </button>
              <strong className="tour-left-date-month">
                Tháng {calMonth + 1}/{calYear}
              </strong>
              <button
                type="button"
                className="tour-home-date-nav"
                aria-label="Tháng sau"
                onClick={() => setDepartureView(new Date(calYear, calMonth + 1, 1))}
              >
                ›
              </button>
            </div>
            <div className="tour-home-date-weekdays" role="row">
              {VI_WEEKDAY_LABELS.map((wd, idx) => (
                <span
                  key={wd}
                  className={
                    idx >= 5 ? 'tour-home-date-weekday tour-home-date-weekday--sun-sat' : 'tour-home-date-weekday'
                  }
                >
                  {wd}
                </span>
              ))}
            </div>
            <div className="tour-home-date-grid" role="grid">
              {calendarCells.map(({ date, inMonth }, i) => {
                const dow = date.getDay()
                const isWeekend = dow === 0 || dow === 6
                const isSel = sameCalendarDay(date, departureSelected)
                return (
                  <button
                    key={`${date.toISOString()}-${i}`}
                    type="button"
                    role="gridcell"
                    className={[
                      'tour-home-date-cell',
                      !inMonth ? 'tour-home-date-cell--muted' : '',
                      isWeekend && inMonth ? 'tour-home-date-cell--weekend' : '',
                      isSel ? 'tour-home-date-cell--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setDepartureSelected(new Date(date))}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
            <button type="button" className="tour-home-date-flexible" onClick={() => setDepartureSelected(null)}>
              Linh hoạt
            </button>
          </section>
          <section className="tour-left-card tour-left-price-card">
            <p className="tour-left-price-title">Giá tour/khách</p>
            <div className="tour-left-price-grid">
              {PRICE_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={
                    priceFilter === option.key
                      ? 'tour-left-price-btn tour-left-price-btn--active'
                      : 'tour-left-price-btn'
                  }
                  onClick={() => {
                    const nextKey = priceFilter === option.key ? '' : option.key
                    const priceRange = resolvePriceRange(nextKey)
                    setPriceFilter(nextKey)
                    setFilters((prev) => ({
                      ...prev,
                      minPrice: priceRange.minPrice,
                      maxPrice: priceRange.maxPrice,
                    }))
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="tour-list-rows">
          <div className="tour-sort-wrap" ref={sortFieldRef}>
            <button
              type="button"
              className="tour-sort-trigger"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((o) => !o)}
            >
            Sắp xếp theo <strong>{SORT_OPTIONS.find((x) => x.value === sortBy)?.label || 'Ngày khởi hành'}</strong>
            </button>
            {sortOpen ? (
            <ul className="tour-sort-menu" role="listbox" aria-label="Sắp xếp tour">
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
                        setFilters((prev) => ({ ...prev, sortBy: opt.value }))
                      }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {displayedTours.map((tour) => (
            <Link key={tour.id} className="tour-row-card-link" to={`/tours/${tour.id}`} aria-label={tour.name}>
              {(() => {
                const ratingInfo = extractRatingInfo(tour)
                return (
              <article className="tour-row-card">
                {tour.thumbnailUrl ? (
                  <img src={tour.thumbnailUrl} alt={tour.name} className="tour-row-image" />
                ) : (
                  <div className="tour-row-image tour-row-image-fallback">Không có ảnh</div>
                )}
                <div className="tour-row-content">
                  <p className="tour-row-rating">
                    {ratingInfo.hasRating ? (
                      <span className={`tour-row-score tour-row-score--${ratingInfo.tone}`}>{ratingInfo.scoreText}</span>
                    ) : null}
                    <span className="tour-row-rating-label">{ratingInfo.label}</span>
                  </p>
                  <h3 className="tour-row-title">{tour.name}</h3>
                  <p className="tour-row-meta">
                  <span>{tour.durationDays || 1} ngày</span>
                  <span>Khởi hành {tour.departurePoint || 'TP HCM'}</span>
                  </p>
                  <div className="tour-row-tags">
                    {parseDestinationTags(tour.destinationList).slice(0, 4).map((tag) => (
                      <span key={`${tour.id}-${tag}`} className="tour-row-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="tour-row-price-col">
                  <p className="tour-row-price-label">Giá chỉ</p>
                  <p className="tour-row-price">{formatPrice(tour.basePrice)}</p>
                  <p className="tour-row-date-note">
                    Khởi hành ngày{' '}
                    {selectedDepartureIso
                      ? new Date(selectedDepartureIso).toLocaleDateString('vi-VN')
                      : Array.isArray(tour.departureDates) && tour.departureDates[0]
                        ? new Date(tour.departureDates[0]).toLocaleDateString('vi-VN')
                        : 'Linh hoạt'}
                  </p>
                  <span className="tour-row-cta">Xem chi tiết</span>
                </div>
              </article>
                )
              })()}
            </Link>
          ))}
        </div>
      </div>

      {!loading && displayedTours.length === 0 ? <p>Không tìm thấy tour phù hợp.</p> : null}

    </section>
  )
}
