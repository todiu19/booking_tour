import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api } from '../api'

function formatPrice(value) {
  if (value == null) return 'Lien he'
  return `${Number(value).toLocaleString('vi-VN')} đ`
}

function ratingLabel(score) {
  if (score >= 4) return 'Tuyet voi'
  if (score >= 3) return 'On'
  if (score >= 2) return 'Te'
  return 'Rat te'
}

export default function HotelDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const [hotel, setHotel] = useState(location.state?.hotel || null)
  const [loading, setLoading] = useState(!location.state?.hotel)
  const [error, setError] = useState('')
  const [viewerIndex, setViewerIndex] = useState(-1)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingLoginError, setBookingLoginError] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [bookingForm, setBookingForm] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    note: '',
    roomCount: 1,
    guestCount: 1,
    checkInDate: '',
    checkOutDate: '',
  })

  useEffect(() => {
    if (location.state?.hotel) return
    let active = true
    async function load() {
      try {
        setLoading(true)
        const result = await api.getHotelById(id)
        if (active) setHotel(result)
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
  }, [id, location.state])

  useEffect(() => {
    const today = new Date()
    const checkIn = new Date(today)
    checkIn.setDate(today.getDate() + 1)
    const checkOut = new Date(checkIn)
    checkOut.setDate(checkIn.getDate() + 1)
    const toIso = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setBookingForm((prev) => ({
      ...prev,
      checkInDate: prev.checkInDate || toIso(checkIn),
      checkOutDate: prev.checkOutDate || toIso(checkOut),
    }))
  }, [])

  useEffect(() => {
    let active = true
    async function loadMe() {
      try {
        const me = await api.getMe()
        if (!active || !me) return
        setBookingForm((prev) => ({
          ...prev,
          contactName: prev.contactName || me.fullName || '',
          contactPhone: prev.contactPhone || me.phone || '',
          contactEmail: prev.contactEmail || me.email || '',
        }))
      } catch {
        // ignore, user might be guest
      }
    }
    loadMe()
    return () => {
      active = false
    }
  }, [])

  if (loading) return <p>Loading hotel detail...</p>
  if (error) return <p className="error">{error}</p>

  if (!hotel) {
    return (
      <section className="stack">
        <div className="panel stack">
          <h1>Chi tiet khach san</h1>
          <p className="muted">Khong co du lieu chi tiet cho khach san nay.</p>
          <Link className="button" to="/tours">
            Quay lai danh sach tour
          </Link>
        </div>
      </section>
    )
  }

  const avgRating = Number(hotel.averageRating || 0)
  const reviewCount = Number(hotel.reviewCount || 0)
  const imageList = (hotel.imageUrls || []).filter(Boolean)
  const viewerImages = imageList.length > 0 ? imageList : hotel.thumbnailUrl ? [hotel.thumbnailUrl] : []
  const visibleGalleryCount = 11
  const hiddenImageCount = Math.max(imageList.length - visibleGalleryCount, 0)
  const mainImage = imageList[0] || hotel.thumbnailUrl || ''
  const sideImages = imageList.slice(1, 5)
  const bottomImages = imageList.slice(5, 11)
  const stars = Math.max(1, Math.min(5, Math.round(avgRating || 4)))
  const descriptionBlocks = String(hotel.description || '')
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean)

  function openViewerByUrl(url) {
    const idx = viewerImages.findIndex((x) => x === url)
    setViewerIndex(idx >= 0 ? idx : 0)
  }

  function closeViewer() {
    setViewerIndex(-1)
  }

  function prevViewerImage() {
    if (viewerImages.length === 0) return
    setViewerIndex((prev) => (prev <= 0 ? viewerImages.length - 1 : prev - 1))
  }

  function nextViewerImage() {
    if (viewerImages.length === 0) return
    setViewerIndex((prev) => (prev >= viewerImages.length - 1 ? 0 : prev + 1))
  }

  function onBookingFieldChange(field, value) {
    setBookingForm((prev) => ({ ...prev, [field]: value }))
  }

  async function openBookingForm() {
    setBookingLoginError('')
    try {
      await api.getMe()
      setShowBookingForm(true)
    } catch {
      setShowBookingForm(false)
      setBookingLoginError('Vui long dang nhap de dat phong khach san.')
      window.dispatchEvent(new CustomEvent('app:auth-required'))
    }
  }

  const roomCount = Math.max(1, Number(bookingForm.roomCount || 1))
  const guestCount = Math.max(1, Number(bookingForm.guestCount || 1))
  const checkInTs = bookingForm.checkInDate ? Date.parse(`${bookingForm.checkInDate}T00:00:00`) : NaN
  const checkOutTs = bookingForm.checkOutDate ? Date.parse(`${bookingForm.checkOutDate}T00:00:00`) : NaN
  const isValidDateRange = Number.isFinite(checkInTs) && Number.isFinite(checkOutTs) && checkOutTs > checkInTs
  const nights = isValidDateRange ? Math.max(1, Math.round((checkOutTs - checkInTs) / 86400000)) : 1
  const basePrice = Number(hotel.basePrice || 0)
  const totalAmount = basePrice * roomCount * nights

  async function submitHotelBooking(e) {
    if (e?.preventDefault) e.preventDefault()
    try {
      setBookingSubmitting(true)
      setBookingError('')
      setBookingSuccess('')
      const payload = {
        hotelId: Number(hotel.id),
        contactName: bookingForm.contactName.trim(),
        contactPhone: bookingForm.contactPhone.trim(),
        contactEmail: bookingForm.contactEmail.trim(),
        checkInDate: bookingForm.checkInDate,
        checkOutDate: bookingForm.checkOutDate,
        roomCount: Number(bookingForm.roomCount || 1),
        guestCount: Number(bookingForm.guestCount || 1),
        note: bookingForm.note || '',
      }
      const result = await api.createHotelBooking(payload)
      setBookingSuccess(`Dat phong thanh cong. Ma dat phong: ${result?.bookingCode || 'HB-' + (result?.id || '')}`)
    } catch (e) {
      setBookingError(e.message || 'Dat phong that bai')
    } finally {
      setBookingSubmitting(false)
    }
  }

  return (
    <section className="hotel-detail-page">
      <div className="hotel-detail-head">
        <h1>
          {hotel.name || `Khach san #${id}`} <span className="hotel-detail-stars">{'★'.repeat(stars)}</span>
        </h1>
        <p className="hotel-detail-address">
          {hotel.location
            ? `Vi tri: ${hotel.location}`
            : hotel.address
              ? `Vi tri: ${hotel.address}`
              : 'Vi tri: Dang cap nhat'}
        </p>
      </div>

      <section className="hotel-detail-gallery-card panel">
        <div className="hotel-detail-gallery">
          {mainImage ? (
            <button type="button" className="hotel-detail-image-btn" onClick={() => openViewerByUrl(mainImage)}>
              <img src={mainImage} alt={hotel.name} className="hotel-detail-main-image" />
            </button>
          ) : (
            <div className="hotel-detail-main-image card-image-fallback" />
          )}
          <div className="hotel-detail-side-images">
            {Array.from({ length: 4 }).map((_, idx) =>
              sideImages[idx] ? (
                <button
                  key={`${sideImages[idx]}-${idx}`}
                  type="button"
                  className="hotel-detail-image-btn"
                  onClick={() => openViewerByUrl(sideImages[idx])}
                >
                  <img src={sideImages[idx]} alt={hotel.name} />
                </button>
              ) : (
                <div key={`side-fallback-${idx}`} className="card-image-fallback" />
              )
            )}
          </div>
        </div>
        <div className="hotel-detail-bottom-images">
          {Array.from({ length: 6 }).map((_, idx) => {
            const isLastTile = idx === 5
            const tileImage = bottomImages[idx] || ''
            if (isLastTile && hiddenImageCount > 0) {
              const fallbackOverlayImage = tileImage || bottomImages[4] || sideImages[3] || mainImage || ''
              return (
                <div
                  key={`bottom-more-${idx}`}
                  className="hotel-detail-more-tile"
                  style={fallbackOverlayImage ? { backgroundImage: `url(${fallbackOverlayImage})` } : undefined}
                >
                  <span>+{hiddenImageCount} hinh</span>
                </div>
              )
            }
            return tileImage ? (
              <button
                key={`${tileImage}-${idx}`}
                type="button"
                className="hotel-detail-image-btn"
                onClick={() => openViewerByUrl(tileImage)}
              >
                <img src={tileImage} alt={hotel.name} />
              </button>
            ) : (
              <div key={`bottom-fallback-${idx}`} className="card-image-fallback" />
            )
          })}
        </div>
      </section>

      <div className="hotel-detail-body">
        <div className="hotel-detail-left panel">
          <h2>Thong tin khach san</h2>
          <div className="hotel-detail-info-box">
            {descriptionBlocks.length > 0 ? (
              descriptionBlocks.map((line, idx) => <p key={`${idx}-${line}`}>{line}</p>)
            ) : (
              <>
                <p>
                  {hotel.name || 'Khach san'} la diem luu tru phu hop cho nghi duong va cong tac, voi khong gian thoai
                  mai va tien nghi.
                </p>
                <p>
                  {hotel.location
                    ? `Vi tri phong: ${hotel.location}.`
                    : 'Vi tri thuan tien de di chuyen den cac diem tham quan noi bat.'}
                </p>
                <p>
                  {hotel.roomCapacity
                    ? `Phong co suc chua toi da ${hotel.roomCapacity} nguoi, phu hop cho nhom ban va gia dinh.`
                    : 'Thong tin chi tiet ve suc chua phong dang duoc cap nhat.'}
                </p>
              </>
            )}
          </div>
        </div>

        <aside className="hotel-detail-booking panel">
          <p className="hotel-detail-booking-label">Gia trung binh moi dem</p>
          <p className="hotel-detail-booking-price">{formatPrice(hotel.basePrice)}</p>
          <p className="hotel-detail-booking-rating">
            {avgRating > 0 ? `${avgRating.toFixed(1)} ${ratingLabel(avgRating)}` : 'Chua co danh gia'}
            {reviewCount > 0 ? ` (${reviewCount})` : ''}
          </p>
          <p className="hotel-detail-booking-meta">
            {hotel.roomCapacity ? `Suc chua: ${hotel.roomCapacity} nguoi/phong` : 'Suc chua: Dang cap nhat'}
          </p>
          {hotel.hotelTypeName ? <p className="hotel-detail-booking-meta">Loai hinh: {hotel.hotelTypeName}</p> : null}
          {hotel.destinationName ? (
            <p className="hotel-detail-booking-meta">Khu vuc: {hotel.destinationName}</p>
          ) : null}
          <button type="button" className="hotel-detail-book-btn" onClick={openBookingForm}>
            Dat ngay
          </button>
          {bookingLoginError ? <p className="error">{bookingLoginError}</p> : null}
        </aside>
      </div>

      {showBookingForm ? (
        <form className="hotel-booking-form-wrap" onSubmit={submitHotelBooking}>
          <div className="hotel-booking-form-left panel">
            <h2>Thong tin khach luu tru chinh</h2>
            <div className="hotel-booking-field">
              <label>Ho va ten*</label>
              <p className="hotel-booking-readonly-value">{bookingForm.contactName || 'Vui lòng đăng nhập để đặt phòng'}</p>
            </div>
            <div className="hotel-booking-field">
              <label>So dien thoai*</label>
              <p className="hotel-booking-readonly-value">{bookingForm.contactPhone || 'Vui lòng đăng nhập để đặt phòng'}</p>
            </div>
            <div className="hotel-booking-field">
              <label>Email*</label>
              <p className="hotel-booking-readonly-value">{bookingForm.contactEmail || 'Vui lòng đăng nhập để đặt phòng'}</p>
            </div>
            <div className="hotel-booking-field hotel-booking-field-row">
              <div>
                <label>Check-in*</label>
                <input
                  type="date"
                  value={bookingForm.checkInDate}
                  onChange={(e) => onBookingFieldChange('checkInDate', e.target.value)}
                />
              </div>
              <div>
                <label>Check-out*</label>
                <input
                  type="date"
                  value={bookingForm.checkOutDate}
                  onChange={(e) => onBookingFieldChange('checkOutDate', e.target.value)}
                />
              </div>
            </div>
            <div className="hotel-booking-field">
              <label>Ghi chu dac biet (neu co)</label>
              <textarea
                rows={3}
                placeholder="Phong khong hut thuoc, giuong doi/don, gan thang may..."
                value={bookingForm.note}
                onChange={(e) => onBookingFieldChange('note', e.target.value)}
              />
            </div>
            <div className="hotel-booking-field">
              <label>So luong phong*</label>
              <input
                type="number"
                min={1}
                value={bookingForm.roomCount}
                onChange={(e) =>
                  onBookingFieldChange('roomCount', Math.max(1, Number(e.target.value || 1)))
                }
              />
            </div>
            {bookingError ? <p className="error">{bookingError}</p> : null}
            {bookingSuccess ? <p className="hotel-booking-success">{bookingSuccess}</p> : null}
          </div>

          <aside className="hotel-booking-summary panel">
            <p className="hotel-booking-summary-stars">{'★'.repeat(stars)}</p>
            <h3>{hotel.name || 'Khach san'}</h3>
            <p className="muted">{hotel.address || 'Dang cap nhat dia chi'}</p>
            {mainImage ? <img src={mainImage} alt={hotel.name} className="hotel-booking-summary-image" /> : null}
            <ul>
              <li>{hotel.roomCapacity ? `${hotel.roomCapacity} nguoi/phong` : 'Suc chua: Dang cap nhat'}</li>
              <li>{`${roomCount} phong x ${nights} dem`}</li>
              <li>{`${guestCount} khach`}</li>
              <li>Gom an sang</li>
              <li>{hotel.hotelTypeName || 'Phong tieu chuan'}</li>
            </ul>
            <div className="hotel-booking-summary-total">
              <span>Tong tien</span>
              <strong>{formatPrice(totalAmount)}</strong>
            </div>
            <button type="submit" className="hotel-detail-book-btn" disabled={bookingSubmitting}>
              {bookingSubmitting ? 'Dang dat...' : 'Xac nhan dat phong'}
            </button>
          </aside>
        </form>
      ) : null}

      {viewerIndex >= 0 && viewerImages[viewerIndex] ? (
        <div className="hotel-image-viewer" role="dialog" aria-modal="true" onClick={closeViewer}>
          <button
            type="button"
            className="hotel-image-viewer-close"
            aria-label="Dong xem anh"
            onClick={closeViewer}
          >
            ×
          </button>
          <button
            type="button"
            className="hotel-image-viewer-nav hotel-image-viewer-nav--prev"
            aria-label="Anh truoc"
            onClick={(e) => {
              e.stopPropagation()
              prevViewerImage()
            }}
          >
            ‹
          </button>
          <div className="hotel-image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <img src={viewerImages[viewerIndex]} alt={hotel.name || 'hotel image'} className="hotel-image-viewer-img" />
            <div className="hotel-image-viewer-thumbs">
              {viewerImages.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  className={idx === viewerIndex ? 'hotel-image-viewer-thumb active' : 'hotel-image-viewer-thumb'}
                  onClick={() => setViewerIndex(idx)}
                >
                  <img src={url} alt={`${hotel.name || 'hotel'} ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="hotel-image-viewer-nav hotel-image-viewer-nav--next"
            aria-label="Anh sau"
            onClick={(e) => {
              e.stopPropagation()
              nextViewerImage()
            }}
          >
            ›
          </button>
        </div>
      ) : null}
    </section>
  )
}
