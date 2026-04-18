import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      const result = await api.login(form)
      const displayName = result?.user?.fullName || result?.user?.email || 'User'
      const roleName = result?.user?.role?.name || 'CUSTOMER'
      setSuccess(`Login Thành Công`)
      onLoginSuccess?.()
      setTimeout(() => {
        navigate('/')
      }, 900)
    } catch (err) {
      setError(err.message)
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="stack auth-form">
      <h1>Login</h1>
      <form onSubmit={submit} className="stack">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          required
        />
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {success ? <p className="success">{success}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  )
}
