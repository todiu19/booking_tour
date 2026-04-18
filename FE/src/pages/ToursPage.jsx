import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import TourCard from '../components/TourCard'
import Pagination from '../components/Pagination'

const EMPTY_FILTERS = {
  keyword: '',
  destinationId: '',
  minPrice: '',
  maxPrice: '',
}

export default function ToursPage() {
  const [searchParams] = useSearchParams()
  const initialKeyword = searchParams.get('keyword') || ''
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [destinations, setDestinations] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setFilters((prev) => ({ ...prev, keyword: initialKeyword }))
    setPage(0)
  }, [initialKeyword])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const result = await api.getTours({ page, size: 8, ...filters })
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
  }, [page, filters])

  useEffect(() => {
    let active = true
    async function loadDestinations() {
      try {
        const result = await api.getDestinations({ page: 0, size: 100 })
        if (active) setDestinations(result?.content || [])
      } catch {
        if (active) setDestinations([])
      }
    }
    loadDestinations()
    return () => {
      active = false
    }
  }, [])

  function onChange(name, value) {
    setPage(0)
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section className="stack">
      <h1>Tours</h1>
      <div className="filters">
        <input
          value={filters.keyword}
          onChange={(e) => onChange('keyword', e.target.value)}
          placeholder="Keyword"
        />
        <select value={filters.destinationId} onChange={(e) => onChange('destinationId', e.target.value)}>
          <option value="">Tat ca diem den</option>
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={filters.minPrice}
          onChange={(e) => onChange('minPrice', e.target.value)}
          placeholder="Min price"
        />
        <input
          type="number"
          value={filters.maxPrice}
          onChange={(e) => onChange('maxPrice', e.target.value)}
          placeholder="Max price"
        />
      </div>

      {loading && <p>Loading tours...</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {(data?.content || []).map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>

      {!loading && (data?.content || []).length === 0 ? <p>No tours found.</p> : null}

      <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} />
    </section>
  )
}
