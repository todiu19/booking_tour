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
      setMessage('Cap nhat mat khau thanh cong')
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
    } catch (err) {
      setError(err.message || 'Khong the cap nhat mat khau')
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="profile-page">
      <div className="profile-hero panel">
        <h1>Doi mat khau</h1>
        <p className="muted">Cap nhat mat khau de bao ve tai khoan cua ban.</p>
      </div>
      <form onSubmit={submit} className="profile-card panel profile-password-card">
        <div className="profile-field">
          <label htmlFor="change-current-password">Mat khau hien tai</label>
          <input
            id="change-current-password"
            type="password"
            placeholder="Nhap mat khau hien tai"
            value={form.currentPassword}
            onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
            required
          />
        </div>
        <div className="profile-field">
          <label htmlFor="change-new-password">Mat khau moi</label>
          <input
            id="change-new-password"
            type="password"
            placeholder="Nhap mat khau moi"
            value={form.newPassword}
            onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
            required
          />
        </div>
        <div className="profile-field">
          <label htmlFor="change-confirm-password">Xac nhan mat khau moi</label>
          <input
            id="change-confirm-password"
            type="password"
            placeholder="Nhap lai mat khau moi"
            value={form.confirmNewPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
            required
          />
        </div>
        <button className="button inline-button" type="submit" disabled={loading}>
          {loading ? 'Dang cap nhat...' : 'Cap nhat mat khau'}
        </button>
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </form>
    </section>
  )
}
