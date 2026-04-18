import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api'

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState({ loading: true, allowed: false })

  useEffect(() => {
    let active = true
    async function check() {
      try {
        const me = await api.getMe()
        const isAdmin = String(me?.role?.name || '').toUpperCase() === 'ADMIN'
        if (active) setStatus({ loading: false, allowed: isAdmin })
      } catch {
        if (active) setStatus({ loading: false, allowed: false })
      }
    }
    check()
    return () => {
      active = false
    }
  }, [])

  if (status.loading) return <p>Checking admin permission...</p>
  if (!status.allowed) return <Navigate to="/login" replace />
  return children
}
