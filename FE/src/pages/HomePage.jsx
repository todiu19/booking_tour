import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import TourCard from '../components/TourCard'

/** Tour đầu tiên có thumbnail — dùng chung cho ảnh nền banner và block promo bên phải. */
function pickHomeBannerTour(homeData) {
  if (!homeData) return null
  const merged = [...(homeData.featuredTours || []), ...(homeData.latestTours || [])]
  return merged.find((t) => t?.thumbnailUrl && String(t.thumbnailUrl).trim()) || null
}

const VI_WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const HOME_ORIGIN_OPTIONS = ['Tất cả', 'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng']

function sameCalendarDay(a, b) {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Luôi 42 ô (6 hàng), thứ Hai là cột đầu — khớp UI ivivu */
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

function HorizontalList({ title, subtitle = '', children, showArrows = true, footer = null, listClassName = '' }) {
  const rowRef = useRef(null)

  function slide(direction) {
    if (!rowRef.current) return
    const firstItem = rowRef.current.querySelector('.horizontal-item')
    if (!firstItem) return
    const gap = parseFloat(window.getComputedStyle(rowRef.current).columnGap || '0')
    const distance = firstItem.getBoundingClientRect().width + gap
    rowRef.current.scrollBy({ left: direction * distance, behavior: 'smooth' })
  }

  return (
    <div className="section-block">
      <div className="section-head">
        <div className="section-head-text">
          <h2>{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
      </div>
      <div className="horizontal-wrap">
        {showArrows ? (
          <button type="button" className="arrow-btn arrow-left" onClick={() => slide(-1)}>
            ‹
          </button>
        ) : null}
        <div className={`horizontal-row ${listClassName}`.trim()} ref={rowRef}>
          {children}
        </div>
        {showArrows ? (
          <button type="button" className="arrow-btn arrow-right" onClick={() => slide(1)}>
            ›
          </button>
        ) : null}
      </div>
      {footer}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [recentTours, setRecentTours] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')

  const [departureOpen, setDepartureOpen] = useState(false)
  const [departureSelected, setDepartureSelected] = useState(null)
  const [departureView, setDepartureView] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const departureFieldRef = useRef(null)
  const [originOpen, setOriginOpen] = useState(false)
  const [originSelected, setOriginSelected] = useState('Tất cả')
  const originFieldRef = useRef(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const result = await api.getHome(10)
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
  }, [])

  useEffect(() => {
    if (!departureOpen && !originOpen) return
    function onDocDown(e) {
      const t = e.target
      if (!(t instanceof Element)) return
      if (departureFieldRef.current?.contains(t)) return
      if (originFieldRef.current?.contains(t)) return
      setDepartureOpen(false)
      setOriginOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setDepartureOpen(false)
        setOriginOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [departureOpen, originOpen])

  useEffect(() => {
    let active = true
    async function loadRecentTours() {
      try {
        const recentIds = JSON.parse(localStorage.getItem('recentTourIds') || '[]')
          .filter(Boolean)
          .slice(0, 4)
        if (recentIds.length === 0) {
          if (active) setRecentTours([])
          return
        }
        const result = await Promise.all(recentIds.map((tourId) => api.getTourById(tourId).catch(() => null)))
        if (!active) return
        setRecentTours(result.filter(Boolean))
      } catch {
        if (active) setRecentTours([])
      }
    }
    loadRecentTours()
    window.addEventListener('focus', loadRecentTours)
    return () => {
      active = false
      window.removeEventListener('focus', loadRecentTours)
    }
  }, [])

  if (loading) return <p>Dang tai du lieu trang chu...</p>
  if (error) return <p className="error">{error}</p>

  const bannerTour = pickHomeBannerTour(data)
  const fallbackPromoTour = data?.featuredTours?.[0] || data?.latestTours?.[0]
  const promoTour = bannerTour || fallbackPromoTour
  const promoPriceFmt =
    promoTour?.basePrice != null
      ? Number(promoTour.basePrice).toLocaleString('vi-VN') + 'đ'
      : '21.499.000đ'

  const defaultBannerImage =
    'https://cdn2.ivivu.com/2026/04/22/15/tour-nhat-ban-5n4d-ha-noi-shizuoka-nui-phu-si-tokyo-lau-dai-kakegawa.png'
  const bannerThumb = bannerTour?.thumbnailUrl ? String(bannerTour.thumbnailUrl).trim() : null
  const bannerImageUrl = bannerThumb || defaultBannerImage
  const promoHref = promoTour ? `/tours/${promoTour.id}` : '/tours'
  const departurePillValue = departureSelected
    ? departureSelected.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Linh hoạt'
  const calYear = departureView.getFullYear()
  const calMonth = departureView.getMonth()
  const calendarCells = buildCalendarCells(calYear, calMonth)
  const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 3 + i)

  /** Danh sach diem den noi bat (Destination) tu GET /home — topDestinations */
  const popularDestinations = data?.topDestinations ?? []

  function handleBannerNavigate(event) {
    const clickTarget = event.target
    if (
      clickTarget instanceof Element &&
      clickTarget.closest('button, input, select, textarea, label, a, .tour-home-hero-panel')
    ) {
      return
    }
    navigate(promoHref)
  }

  function handleSearchTours() {
    const params = new URLSearchParams()
    const keyword = searchKeyword.trim()
    if (keyword) params.set('keyword', keyword)
    if (originSelected && originSelected !== 'Tất cả') params.set('origin', originSelected)
    navigate(`/tours${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <section className="stack home-style">
      <div className="tour-home-header-wrap">
        <div
          className="tour-home-banner"
          style={{
            backgroundImage: `url(${JSON.stringify(bannerImageUrl)})`,
          }}
        >
          <div className="tour-home-banner-overlay tour-home-banner-overlay--clickable" onClick={handleBannerNavigate}>
            <div className="tour-home-banner-inner">
              <div className="tour-home-hero-col">
                <div className="tour-home-hero-intro">
                  <h1>Hơn 1000+ Tour, Khám Phá Ngay</h1>
                  <p className="tour-home-hero-tagline">Giá tốt – hỗ trợ 24/7 – khắp nơi</p>
                </div>
                <div className="tour-home-hero-panel">
                  <div className="search-form home-page tour-home-search-form" role="search">
                    <div className="tour-home-search-keyword-row">
                      <div className="tour-home-search-keyword-inner">
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
                        <label htmlFor="search-home-text" className="tour-home-visually-hidden">
                          Tim dia diem
                        </label>
                        <input
                          id="search-home-text"
                          name="search-home-text"
                          type="text"
                          className="form-control tour-home-search-keyword search-input"
                          placeholder="Bạn muốn đi đâu?"
                          maxLength={200}
                          autoComplete="off"
                          spellCheck={false}
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSearchTours()
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="tour-home-search-bottom">
                      <div
                        className={`tour-home-date-field${departureOpen ? ' tour-home-date-field--open' : ''}`}
                        ref={departureFieldRef}
                      >
                        <button
                          type="button"
                          className={`tour-home-search-pill tour-home-search-pill--date${
                            departureOpen ? ' tour-home-search-pill--open' : ''
                          }`}
                          aria-expanded={departureOpen}
                          aria-haspopup="dialog"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOriginOpen(false)
                            setDepartureOpen((o) => {
                              const next = !o
                              if (next && departureSelected) {
                                setDepartureView(
                                  new Date(
                                    departureSelected.getFullYear(),
                                    departureSelected.getMonth(),
                                    1
                                  )
                                )
                              }
                              return next
                            })
                          }}
                        >
                          <span className="tour-home-search-pill-icon" aria-hidden>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="5" width="18" height="16" rx="2" stroke="#475569" strokeWidth="2" />
                              <path d="M3 10h18M8 5V3M16 5V3" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </span>
                          <span className="tour-home-search-pill-text">
                            <span className="tour-home-search-pill-label">Ngày khởi hành</span>
                            <span className="tour-home-search-pill-value">{departurePillValue}</span>
                          </span>
                        </button>
                        {departureOpen ? (
                          <div
                            className="tour-home-date-popover"
                            role="dialog"
                            aria-label="Chon ngay khoi hanh"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="tour-home-date-popover-arrow" aria-hidden />
                            <div className="tour-home-date-popover-head">
                              <button
                                type="button"
                                className="tour-home-date-nav"
                                aria-label="Thang truoc"
                                onClick={() =>
                                  setDepartureView(new Date(calYear, calMonth - 1, 1))
                                }
                              >
                                ‹
                              </button>
                              <div className="tour-home-date-selects">
                                <select
                                  className="tour-home-date-select"
                                  aria-label="Thang"
                                  value={calMonth}
                                  onChange={(e) =>
                                    setDepartureView(new Date(calYear, Number(e.target.value), 1))
                                  }
                                >
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>
                                      Th{String(i + 1).padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="tour-home-date-select"
                                  aria-label="Nam"
                                  value={calYear}
                                  onChange={(e) =>
                                    setDepartureView(new Date(Number(e.target.value), calMonth, 1))
                                  }
                                >
                                  {yearOptions.map((y) => (
                                    <option key={y} value={y}>
                                      {y}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                className="tour-home-date-nav"
                                aria-label="Thang sau"
                                onClick={() =>
                                  setDepartureView(new Date(calYear, calMonth + 1, 1))
                                }
                              >
                                ›
                              </button>
                            </div>
                            <div className="tour-home-date-weekdays" role="row">
                              {VI_WEEKDAY_LABELS.map((wd, idx) => (
                                <span
                                  key={wd}
                                  className={
                                    idx >= 5
                                      ? 'tour-home-date-weekday tour-home-date-weekday--sun-sat'
                                      : 'tour-home-date-weekday'
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
                                const label = date.getDate()
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
                                    onClick={() => {
                                      setDepartureSelected(new Date(date))
                                      setDepartureOpen(false)
                                    }}
                                  >
                                    {label}
                                  </button>
                                )
                              })}
                            </div>
                            <button
                              type="button"
                              className="tour-home-date-flexible"
                              onClick={() => {
                                setDepartureSelected(null)
                                setDepartureOpen(false)
                              }}
                            >
                              Linh hoạt
                            </button>
                          </div>
                        ) : null}
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
                          aria-label="Khoi hanh tu"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDepartureOpen(false)
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
                          <ul
                            className="tour-home-origin-list"
                            role="listbox"
                            aria-label="Danh sach diem khoi hanh"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {HOME_ORIGIN_OPTIONS.map((opt) => (
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
                      <button type="button" className="tour-home-search-submit" onClick={handleSearchTours}>
                        Tìm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <aside className="tour-home-promo">
                {promoTour ? (
                  <>
                    <h2 className="tour-home-promo-title">{promoTour.name}</h2>
                    <p className="tour-home-promo-route">{promoTour.name}</p>
                    <p className="tour-home-promo-price">
                      Giá chỉ từ <strong>{promoPriceFmt}</strong>
                      /khách
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="tour-home-promo-title">Tour Nhat Ban 5N4D</h2>
                    <p className="tour-home-promo-route">Tour Nhat Ban 5N4D</p>
                    <p className="tour-home-promo-price">
                      Giá chỉ từ <strong>21.499.000đ</strong>
                      /khách
                    </p>
                  </>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>

      {recentTours.length > 0 ? (
        <HorizontalList
          title="Tour bạn đã xem gần đây"
          subtitle=""
          showArrows={false}
          listClassName="home-tour-grid home-recent-tour-grid"
        >
          {recentTours.map((tour) => (
            <div key={`home-recent-${tour.id}`} className="home-grid-item">
              <TourCard tour={tour} />
            </div>
          ))}
        </HorizontalList>
      ) : null}

      <HorizontalList
        title="Tour nổi bật"
        subtitle=""
        showArrows={false}
        listClassName="home-tour-grid"
        footer={
          <div className="destination-more-wrap">
            <Link to="/tours" className="destination-more-link">
              Xem them ›
            </Link>
          </div>
        }
      >
        {(data?.featuredTours || []).slice(0, 8).map((tour) => (
          <div key={tour.id} className="home-grid-item">
            <TourCard tour={tour} />
          </div>
        ))}
      </HorizontalList>

      <div className="home-offer-container">
        <HorizontalList
          title="Tour mới nhất"
          subtitle="Nhanh tay dat ngay. De mai se lo"
          showArrows={false}
          listClassName="home-tour-grid"
        >
          {(data?.latestTours || []).slice(0, 8).map((tour) => (
            <div key={tour.id} className="home-grid-item">
              <TourCard tour={tour} />
            </div>
          ))}
        </HorizontalList>
      </div>

      <section
        className="popular-tour-block"
        aria-labelledby="popular-dest-heading"
      >
        <div className="popular-tour-block-head">
          <h2 id="popular-dest-heading">Cac diem du lich pho bien</h2>
          <p className="popular-tour-block-subtitle">Bao la the gioi, bon be la nha</p>
        </div>
        {popularDestinations.length > 0 ? (
          <div className="popular-dest-grid" role="list">
            {popularDestinations.slice(0, 7).map((destination, index) => (
              <Link
                key={destination.id}
                role="listitem"
                to={`/destinations/${destination.id}`}
                className={
                  index === 0 ? 'popular-dest-card popular-dest-card--featured' : 'popular-dest-card'
                }
                aria-label={`Diem den: ${destination.name}`}
              >
                {destination.imageUrl ? (
                  <img
                    src={destination.imageUrl}
                    alt=""
                    className="popular-dest-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="popular-dest-img popular-dest-img--fallback" aria-hidden />
                )}
                <div className="popular-dest-gradient" aria-hidden />
                <div className="popular-dest-caption">
                  <span className="popular-dest-name">{destination.name}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="popular-dest-empty muted">Chua co diem den de hien thi.</p>
        )}
      </section>
    </section>
  )
}
