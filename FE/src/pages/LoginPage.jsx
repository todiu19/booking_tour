import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
      await api.login(form)
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
    <section className="auth-login-wrap">
      <div className="auth-login-card panel">
        <h1>Dang nhap tai khoan</h1>
        <p className="auth-login-subtitle">Dang nhap de dat tour, dat khach san va theo doi lich su don cua ban.</p>

        <form onSubmit={submit} className="auth-login-form">
          <div className="auth-login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="Nhap email cua ban"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="auth-login-field">
            <label htmlFor="login-password">Mat khau</label>
            <input
              id="login-password"
              type="password"
              placeholder="Nhap mat khau"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="button auth-login-submit" disabled={loading}>
            {loading ? 'Dang dang nhap...' : 'Dang nhap'}
          </button>
        </form>

        <p className="auth-login-register">
          Chua co tai khoan? <Link to="/register">Dang ky ngay</Link>
        </p>

        {success ? <p className="success">{success}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  )
}
