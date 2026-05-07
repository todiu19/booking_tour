import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'

function formatPrice(value) {
  if (value == null) return 'Chưa có'
  return Number(value).toLocaleString('vi-VN') + ' VND'
}
function formatDate(value) {
  if (!value) return 'Chưa có'
  return new Date(value).toLocaleDateString('vi-VN')
}

export default function TourDetailPage() {
  const { id } = useParams()
  const [tour, setTour] = useState(null)
  const [reviews, setReviews] = useState([])
  const [adultCount, setAdultCount] = useState(2)
  const [childCount, setChildCount] = useState(0)
  const [kidCount, setKidCount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [expandedProgramKeys, setExpandedProgramKeys] = useState(() => new Set())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')

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

  const tourData = tour || {}
  const itineraryItems = useMemo(() => tourData.itineraries || [], [tourData.itineraries])
  const reviewAvg =
    reviews.length > 0
      ? reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / reviews.length
      : 0
  const imageList = (tourData.imageUrls || []).filter(Boolean)
  const primaryImage = imageList[0] || ''
  const sideImages = imageList.slice(1, 5)
  const chargeablePax = Math.max(Number(adultCount || 0) + Number(childCount || 0), 0)
  const totalPrice = chargeablePax * Number(tourData.basePrice || 0)
  const highlightItems = useMemo(() => {
    const summaryFromItinerary = itineraryItems
      .map((item) => item?.description)
      .filter(Boolean)
      .map((text) => text.trim())
      .slice(0, 5)
    if (summaryFromItinerary.length > 0) return summaryFromItinerary
    if (tourData.description) return [tourData.description]
    return ['Chưa có thông tin nổi bật cho tour này.']
  }, [itineraryItems, tourData.description])
  const hotelStops = useMemo(() => {
    const map = new Map()
    itineraryItems.forEach((item) => {
      ;(item?.hotels || []).forEach((stay) => {
        const hotel = stay?.hotel
        if (!hotel?.id) return
        const key = hotel.id
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name: hotel.name || 'Khách sạn',
            address: hotel.address || '',
            description: hotel.description || '',
            location: hotel.location || '',
            basePrice: hotel.basePrice ?? null,
            roomCapacity: Number(hotel.roomCapacity || 0),
            destinationId: hotel.destinationId ?? null,
            destinationName: hotel.destinationName || '',
            averageRating: Number(hotel.averageRating || 0),
            reviewCount: Number(hotel.reviewCount || 0),
            nightCount: Number(stay?.nightCount || 0),
            thumbnailUrl: hotel.thumbnailUrl || hotel.imageUrl || hotel.coverImageUrl || '',
          })
          return
        }
        const current = map.get(key)
        current.nightCount += Number(stay?.nightCount || 0)
      })
    })
    return Array.from(map.values())
  }, [itineraryItems])
  const dateOptions = useMemo(() => {
    const rawDates = Array.isArray(tourData.departureDates) ? tourData.departureDates : []
    return rawDates
      .map((value, idx) => {
        const itemDate = new Date(value)
        if (Number.isNaN(itemDate.getTime())) return null
        return {
          key: idx,
          value,
          weekday: itemDate.toLocaleDateString('vi-VN', { weekday: 'short' }),
          dateLabel: itemDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        }
      })
      .filter(Boolean)
  }, [tourData.departureDates])
  const selectedDepartureDate = dateOptions[selectedDateIndex]?.value

  useEffect(() => {
    if (selectedDateIndex >= dateOptions.length) {
      setSelectedDateIndex(0)
    }
  }, [dateOptions.length, selectedDateIndex])

  function updateCounter(setter, delta, min = 0) {
    setter((prev) => Math.max(min, Number(prev || 0) + delta))
  }

  async function submitTourBooking() {
    try {
      setBookingSubmitting(true)
      setBookingError('')
      setBookingSuccess('')

      const me = await api.getMe()
      if (!me) {
        throw new Error('Vui lòng đăng nhập để đặt tour')
      }

      const response = await api.createBooking({
        tourId: Number(id),
        contactName: me.fullName || '',
        contactPhone: me.phone || '',
        contactEmail: me.email || '',
        adultCount: Number(adultCount || 0),
        childCount: Number(childCount || 0),
        paymentMethod,
      })

      if (response?.paymentUrl) {
        window.location.href = response.paymentUrl
        return
      }

      setBookingSuccess(`Đặt tour thành công. Mã đơn: ${response?.booking?.bookingCode || ''}`)
    } catch (e) {
      const message = e?.message || 'Đặt tour thất bại'
      setBookingError(message)
      if (e?.status === 401) {
        window.dispatchEvent(new CustomEvent('app:auth-required'))
      }
    } finally {
      setBookingSubmitting(false)
    }
  }

  function toggleProgramItem(key) {
    setExpandedProgramKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (loading) return <p>Đang tải chi tiết tour...</p>
  if (error) return <p className="error">{error}</p>
  if (!tour) return <p>Không tìm thấy tour.</p>

  return (
    <section className="tour-detail-layout">
      <div className="tour-detail-top stack">
        <div className="tour-head stack">
          <h1>{tourData.name}</h1>
          <div className="tour-head-meta">
            <span className="tour-score-badge">{reviewAvg > 0 ? reviewAvg.toFixed(1) : '9.0'}</span>
            <span className="tour-score-text">
              {reviews.length > 0 ? `Tuyệt vời ${reviews.length} đánh giá` : 'Tuyệt vời 0 đánh giá'}
            </span>
            <span className="muted">Khởi hành: {tourData.departurePoint || '—'}</span>
            <span className="muted">Ngày đi: {formatDate(selectedDepartureDate)}</span>
            <span className="muted">Mã tour: {tourData.code || `T${String(tourData.id || id).padStart(5, '0')}`}</span>
          </div>
        </div>

        <div className="tour-gallery-grid">
          {primaryImage ? (
            <img src={primaryImage} className="tour-gallery-main" alt={tourData.name} />
          ) : (
            <div className="tour-gallery-main card-image-fallback">Không có ảnh</div>
          )}
          <div className="tour-gallery-side">
            {sideImages.length > 0
              ? sideImages.map((url) => (
                  <img key={url} src={url} className="tour-gallery-side-item" alt={tourData.name} />
                ))
              : Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="tour-gallery-side-item card-image-fallback">
                    Không có ảnh
                  </div>
                ))}
          </div>
        </div>
      </div>

      <div className="tour-detail-bottom">
        <div className="tour-detail-main stack">
          <section className="panel stack">
            <h2>Điểm nổi bật tour</h2>
            <div className="tour-highlight-list">
              {highlightItems.map((item, idx) => (
                <p key={`${idx}-${item}`} className="tour-highlight-item">
                  {item}
                </p>
              ))}
            </div>
          </section>

          <section className="panel stack">
            <div className="tour-program-head">
              <h2>Chương trình tour</h2>
              <span className="muted">{tourData.durationDays || itineraryItems.length || 0} ngày</span>
            </div>
            {itineraryItems.length === 0 ? (
              <p className="muted">Chưa có lịch trình chi tiết.</p>
            ) : (
              <div className="tour-program-list">
                {itineraryItems.map((item, idx) => (
                  <article className="tour-program-item" key={item.id || `${item.dayNumber}-${item.title}`}>
                    {(() => {
                      const itemKey = item.id || `${item.dayNumber}-${item.title || idx + 1}`
                      const expanded = expandedProgramKeys.has(itemKey)
                      return (
                        <>
                          <button
                            type="button"
                            className="tour-program-item-head"
                            aria-expanded={expanded}
                            onClick={() => toggleProgramItem(itemKey)}
                          >
                            <strong>Ngày {item.dayNumber || idx + 1}</strong>
                            <span>{item.title || 'Hoạt động trong ngày'}</span>
                          </button>
                          {expanded ? <p>{item.description || 'Không có mô tả.'}</p> : null}
                        </>
                      )
                    })()}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel stack">
            <h2>Khách sạn trong tour</h2>
            {hotelStops.length === 0 ? (
              <p className="muted">Chưa có thông tin khách sạn.</p>
            ) : (
              <div className="tour-hotel-list">
                {hotelStops.map((hotel) => (
                  <Link
                    key={hotel.id}
                    className="hotel-row-card-link"
                    to={`/hotels/${hotel.id}`}
                    state={{ hotel }}
                    aria-label={`Chi tiết ${hotel.name}`}
                  >
                    <article className="hotel-row-card">
                      <div className="hotel-row-thumb-wrap">
                        {hotel.thumbnailUrl ? (
                          <img src={hotel.thumbnailUrl} alt={hotel.name} className="hotel-row-thumb" />
                        ) : (
                          <div className="hotel-row-thumb hotel-row-thumb--fallback" aria-hidden>
                            Hotel
                          </div>
                        )}
                      </div>
                      <div className="hotel-row-content">
                        <h3 className="hotel-row-title">{hotel.name}</h3>
                        <p className="hotel-row-meta">
                          {hotel.averageRating > 0 ? `${hotel.averageRating.toFixed(1)} điểm` : 'Chưa có đánh giá'}
                          {hotel.reviewCount > 0 ? ` · ${hotel.reviewCount} review` : ''}
                          {hotel.nightCount > 0 ? ` · ${hotel.nightCount} đêm` : ''}
                        </p>
                        {hotel.address ? <p className="hotel-row-address">{hotel.address}</p> : null}
                      </div>
                      <div className="hotel-row-cta-col">
                          <span className="hotel-row-cta">Xem chi tiết</span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="panel stack">
            <h2>Đánh giá từ khách hàng</h2>
            {reviews.length === 0 ? (
              <p className="muted">Chưa có đánh giá cho tour này.</p>
            ) : (
              <div className="review-list">
                {reviews.map((review) => (
                  <article key={review.id} className="review-item">
                    <div className="review-head">
                      <strong>{review.reviewerName || 'Người dùng'}</strong>
                      <span className="tour-rating">★ {Number(review.rating || 0).toFixed(1)}</span>
                    </div>
                    <p className="muted">
                      {review.createdAt ? new Date(review.createdAt).toLocaleString('vi-VN') : ''}
                    </p>
                    <p>{review.comment || 'Không có nội dung.'}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="tour-booking-sidebar panel">
        <h2>Lịch trình và giá tour</h2>
        <p className="muted">Chọn lịch trình và xem giá:</p>
        {dateOptions.length === 0 ? (
          <p className="muted">Tour này chưa có ngày khởi hành.</p>
        ) : (
          <div className="tour-date-pills">
            {dateOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`tour-date-pill ${selectedDateIndex === item.key ? 'active' : ''}`}
                onClick={() => setSelectedDateIndex(item.key)}
              >
                <span>{item.weekday}</span>
                <strong>{item.dateLabel}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="tour-counter-list">
          <div className="tour-counter-row">
            <div>
              <strong>Người lớn</strong>
              <p className="muted">&gt; 10 tuổi</p>
            </div>
            <div className="tour-counter-control">
              <button type="button" onClick={() => updateCounter(setAdultCount, -1, 1)}>
                -
              </button>
              <span>{adultCount}</span>
              <button type="button" onClick={() => updateCounter(setAdultCount, 1, 1)}>
                +
              </button>
            </div>
          </div>
          <div className="tour-counter-row">
            <div>
              <strong>Trẻ em</strong>
              <p className="muted">5 - 10 tuổi</p>
            </div>
            <div className="tour-counter-control">
              <button type="button" onClick={() => updateCounter(setChildCount, -1)}>
                -
              </button>
              <span>{childCount}</span>
              <button type="button" onClick={() => updateCounter(setChildCount, 1)}>
                +
              </button>
            </div>
          </div>
          <div className="tour-counter-row">
            <div>
              <strong>Trẻ nhỏ</strong>
              <p className="muted">&lt; 5 tuổi</p>
            </div>
            <div className="tour-counter-control">
              <button type="button" onClick={() => updateCounter(setKidCount, -1)}>
                -
              </button>
              <span>{kidCount}</span>
              <button type="button" onClick={() => updateCounter(setKidCount, 1)}>
                +
              </button>
            </div>
          </div>
        </div>

        <div className="tour-payment-method">
          <p className="tour-payment-method-label">Phương thức thanh toán</p>
          <div className="tour-payment-method-options">
            <label>
              <input
                type="radio"
                name="tour-payment-method"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              Trực tiếp
            </label>
            <label>
              <input
                type="radio"
                name="tour-payment-method"
                value="vnpay"
                checked={paymentMethod === 'vnpay'}
                onChange={() => setPaymentMethod('vnpay')}
              />
              VNPay
            </label>
          </div>
        </div>

        <p className="tour-booking-note">Liên hệ để xác nhận chỗ</p>
        <div className="tour-total-row">
          <span>Tổng giá tour ({chargeablePax} khách tính phí)</span>
          <strong>{formatPrice(totalPrice)}</strong>
        </div>
        <button type="button" className="button tour-booking-button" onClick={submitTourBooking} disabled={bookingSubmitting}>
          {bookingSubmitting ? 'Đang xử lý...' : 'Yêu cầu đặt'}
        </button>
        {bookingError ? <p className="error">{bookingError}</p> : null}
        {bookingSuccess ? <p className="success">{bookingSuccess}</p> : null}
        </aside>
      </div>
    </section>
  )
}
