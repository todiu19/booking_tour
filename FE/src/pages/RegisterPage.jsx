import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
      setSuccess('Đăng ký thành công. Đang chuyển về trang chủ...')
      setTimeout(() => navigate('/'), 900)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-login-wrap">
      <div className="auth-login-card panel">
        <h1>Đăng ký tài khoản</h1>
        <p className="auth-login-subtitle">Tạo tài khoản để đặt tour, đặt khách sạn và theo dõi lịch sử đơn của bạn.</p>

        <form onSubmit={submit} className="auth-login-form">
          <div className="auth-login-field">
            <label htmlFor="register-fullname">Họ và tên</label>
            <input
              id="register-fullname"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Nhập họ và tên"
              required
            />
          </div>
          <div className="auth-login-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Nhập email của bạn"
              required
            />
          </div>
          <div className="auth-login-field">
            <label htmlFor="register-phone">Số điện thoại</label>
            <input
              id="register-phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Nhập số điện thoại"
              required
            />
          </div>
          <div className="auth-login-field">
            <label htmlFor="register-password">Mật khẩu</label>
            <input
              id="register-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <div className="auth-login-field">
            <label htmlFor="register-confirm-password">Nhập lại mật khẩu</label>
            <input
              id="register-confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          <button type="submit" className="button auth-login-submit" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="auth-login-register">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>

        {success ? <p className="success">{success}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  )
}
