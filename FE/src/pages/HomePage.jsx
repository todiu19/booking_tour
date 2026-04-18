import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import TourCard from '../components/TourCard'
import DestinationCard from '../components/DestinationCard'
import heroImage from '../assets/hero.png'

function HorizontalList({ title, children, showArrows = true, footer = null }) {
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
        <h2>{title}</h2>
      </div>
      <div className="horizontal-wrap">
        {showArrows ? (
          <button type="button" className="arrow-btn arrow-left" onClick={() => slide(-1)}>
            ‹
          </button>
        ) : null}
        <div className="horizontal-row" ref={rowRef}>
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
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const result = await api.getHome(8)
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

  if (loading) return <p>Dang tai du lieu trang chu...</p>
  if (error) return <p className="error">{error}</p>

  return (
    <section className="stack home-style">
      <div className="home-hero">
        <div>
          <p className="hero-badge">Dat ve tour de dang hon</p>
          <h1>Dat tour di Ha Long ngay</h1>
          <p className="muted hero-subtitle">
            Chon tour yeu thich, thanh toan nhanh va theo doi booking chi trong vai buoc.
          </p>
        </div>
        <img src={heroImage} alt="travel banner" className="hero-banner-image" />
      </div>

      <HorizontalList
        title="Tour noi bat"
        footer={
          <div className="destination-more-wrap">
            <Link to="/tours" className="destination-more-link">
              Xem them ›
            </Link>
          </div>
        }
      >
        {(data?.featuredTours || []).map((tour) => (
          <div key={tour.id} className="horizontal-item horizontal-tour">
            <TourCard tour={tour} />
          </div>
        ))}
      </HorizontalList>

      <HorizontalList title="Tour moi nhat">
        {(data?.latestTours || []).map((tour) => (
          <div key={tour.id} className="horizontal-item horizontal-tour">
            <TourCard tour={tour} />
          </div>
        ))}
      </HorizontalList>

      <HorizontalList
        title="Cam nang du lich"
        showArrows={false}
        footer={
          <div className="destination-more-wrap">
            <Link to="/destinations" className="destination-more-link">
              Xem them ›
            </Link>
          </div>
        }
      >
        {(data?.topDestinations || []).map((destination) => (
          <div key={destination.id} className="horizontal-item horizontal-destination">
            <DestinationCard destination={destination} />
          </div>
        ))}
      </HorizontalList>
    </section>
  )
}
