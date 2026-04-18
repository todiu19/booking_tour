import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import TourCard from '../components/TourCard'
import Pagination from '../components/Pagination'

export default function DestinationDetailPage() {
  const { id } = useParams()
  const [destination, setDestination] = useState(null)
  const [tourPage, setTourPage] = useState(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const [detail, tours] = await Promise.all([
          api.getDestinationById(id),
          api.getToursByDestination(id, page, 8),
        ])
        if (!active) return
        setDestination(detail)
        setTourPage(tours)
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
  }, [id, page])

  if (loading) return <p>Loading destination detail...</p>
  if (error) return <p className="error">{error}</p>
  if (!destination) return <p>Destination not found.</p>

  return (
    <section className="stack">
      <h1>{destination.name}</h1>
      <p className="muted">
        {destination.province}, {destination.country}
      </p>
      {destination.imageUrl ? (
        <img src={destination.imageUrl} className="hero-image" alt={destination.name} />
      ) : null}

      <h2>Tours in this destination</h2>
      <div className="grid">
        {(tourPage?.content || []).map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>

      {!loading && (tourPage?.content || []).length === 0 ? <p>No tours for this destination.</p> : null}

      <Pagination
        page={tourPage?.page || 0}
        totalPages={tourPage?.totalPages || 0}
        onPageChange={setPage}
      />
    </section>
  )
}
