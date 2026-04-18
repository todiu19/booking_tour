import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      await api.register(form)
      setSuccess('Register successful. Redirecting to home...')
      setTimeout(() => navigate('/'), 900)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="stack auth-form">
      <h1>Register</h1>
      <form onSubmit={submit} className="stack">
        <input
          value={form.fullName}
          onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
          placeholder="Full name"
          required
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="Email"
          required
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          placeholder="Phone"
          required
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder="Password"
          required
        />
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          placeholder="Confirm password"
          required
        />
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Registering...' : 'Create account'}
        </button>
      </form>
      {success ? <p className="success">{success}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  )
}
