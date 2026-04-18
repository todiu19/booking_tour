import { useEffect, useState } from 'react'
import { api } from '../api'
import AdminShell from '../components/AdminShell'

function Metric({ label, value }) {
  return (
    <article className="panel">
      <p className="muted">{label}</p>
      <h3>{value ?? 0}</h3>
    </article>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const summary = await api.getDashboardSummary()
        if (active) setData(summary)
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

  return (
    <AdminShell title="Dashboard" subtitle="Overall health of the booking platform">
      {loading ? <p>Loading dashboard...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="grid">
        <Metric label="Total users" value={data?.totalUsers} />
        <Metric label="Active users" value={data?.activeUsers} />
        <Metric label="Blocked users" value={data?.blockedUsers} />
        <Metric label="Total tours" value={data?.totalTours} />
        <Metric label="Published tours" value={data?.publishedTours} />
        <Metric label="Archived tours" value={data?.archivedTours} />
        <Metric label="Total bookings" value={data?.totalBookings} />
        <Metric label="Successful payments" value={data?.successfulPayments} />
        <Metric label="Revenue" value={data?.successfulRevenue} />
      </div>
    </AdminShell>
  )
}
