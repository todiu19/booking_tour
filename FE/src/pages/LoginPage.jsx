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
      const result = await api.login(form)
      setSuccess('Đăng nhập thành công')
      onLoginSuccess?.()
      const roleName = String(result?.user?.role?.name || '').toLowerCase()
      const nextPath = roleName === 'admin' ? '/admin/dashboard' : '/'
      setTimeout(() => {
        navigate(nextPath)
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
        <h1>Đăng nhập tài khoản</h1>
        <p className="auth-login-subtitle">Đăng nhập để đặt tour, đặt khách sạn và theo dõi lịch sử đơn của bạn.</p>

        <form onSubmit={submit} className="auth-login-form">
          <div className="auth-login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="Nhập email của bạn"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="auth-login-field">
            <label htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="button auth-login-submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth-login-register">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>

        {success ? <p className="success">{success}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  )
}
