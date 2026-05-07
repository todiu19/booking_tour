import { useState } from 'react'
import { api } from '../api'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      setMessage('')
      await api.changePassword(form)
      setMessage('Cập nhật mật khẩu thành công')
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
    } catch (err) {
      setError(err.message || 'Không thể cập nhật mật khẩu')
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="profile-page">
      <div className="profile-hero panel">
        <h1>Đổi mật khẩu</h1>
        <p className="muted">Cập nhật mật khẩu để bảo vệ tài khoản của bạn.</p>
      </div>
      <form onSubmit={submit} className="profile-card panel profile-password-card">
        <div className="profile-field">
          <label htmlFor="change-current-password">Mật khẩu hiện tại</label>
          <input
            id="change-current-password"
            type="password"
            placeholder="Nhập mật khẩu hiện tại"
            value={form.currentPassword}
            onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
            required
          />
        </div>
        <div className="profile-field">
          <label htmlFor="change-new-password">Mật khẩu mới</label>
          <input
            id="change-new-password"
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={form.newPassword}
            onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
            required
          />
        </div>
        <div className="profile-field">
          <label htmlFor="change-confirm-password">Xác nhận mật khẩu mới</label>
          <input
            id="change-confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={form.confirmNewPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
            required
          />
        </div>
        <button className="button inline-button" type="submit" disabled={loading}>
          {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </button>
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </form>
    </section>
  )
}
