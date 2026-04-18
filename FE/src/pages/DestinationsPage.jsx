import { useEffect, useState } from 'react'
import { api } from '../api'
import DestinationCard from '../components/DestinationCard'
import Pagination from '../components/Pagination'

export default function DestinationsPage() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const result = await api.getDestinations({ page, size: 8, keyword })
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
  }, [keyword, page])

  return (
    <section className="stack">
      <h1>Destinations</h1>
      <input
        className="search-input"
        placeholder="Search destination..."
        value={keyword}
        onChange={(e) => {
          setPage(0)
          setKeyword(e.target.value)
        }}
      />

      {loading && <p>Loading destinations...</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {(data?.content || []).map((destination) => (
          <DestinationCard key={destination.id} destination={destination} />
        ))}
      </div>

      {!loading && (data?.content || []).length === 0 ? <p>No destination found.</p> : null}

      <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} />
    </section>
  )
}
