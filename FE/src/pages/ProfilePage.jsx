import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function formatDateTime(value) {
  if (!value) return 'Chua cap nhat'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chua cap nhat'
  return date.toLocaleString('vi-VN')
}

export default function ProfilePage({ refreshMeSignal }) {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const me = await api.getMe()
        if (!active) return
        setProfile(me)
        setForm({
          fullName: me.fullName || '',
          email: me.email || '',
          phone: me.phone || '',
        })
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
  }, [refreshMeSignal])

  async function save(e) {
    e.preventDefault()
    try {
      const updated = await api.updateProfile(form)
      setProfile(updated)
      setForm((prev) => ({
        fullName: updated.fullName ?? prev.fullName,
        email: updated.email ?? prev.email,
        phone: updated.phone ?? prev.phone,
      }))
      setMessage('Profile updated')
      setError('')
    } catch (err) {
      setError(err.message)
      setMessage('')
    }
  }

  if (loading) return <p>Loading profile...</p>
  if (!profile) {
    return (
      <section className="profile-page">
        <div className="profile-hero panel">
          <h1>Thong tin ca nhan</h1>
          <p className="muted">Ban can dang nhap de xem va cap nhat thong tin tai khoan.</p>
          <div className="actions">
            <Link className="button" to="/login">
              Dang nhap
            </Link>
            <Link className="button button-secondary" to="/register">
              Dang ky
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-page">
      <div className="profile-hero panel">
        <h1>Thong tin ca nhan</h1>
        <p className="muted">
          Quan ly thong tin ca nhan, bao mat tai khoan va theo doi cac don dat cua ban.
        </p>
        <p className="profile-role-pill">Vai tro: {profile?.role?.name || 'CUSTOMER'}</p>
      </div>

      <div className="profile-layout">
        <form onSubmit={save} className="profile-card panel profile-account-card">
          <h2>Thong tin tai khoan</h2>
          <div className="profile-field">
            <label htmlFor="profile-fullname">Ho va ten</label>
            <input
              id="profile-fullname"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Nhap ho va ten"
              required
            />
          </div>
          <div className="profile-readonly-item">
            <label htmlFor="profile-email">Email</label>
            <p id="profile-email">{form.email || profile?.email || 'Chua co'}</p>
          </div>
          <div className="profile-field">
            <label htmlFor="profile-phone">So dien thoai</label>
            <input
              id="profile-phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Nhap so dien thoai"
              required
            />
          </div>
          <div className="profile-readonly-grid">
            <div className="profile-readonly-item">
              <label>Trang thai</label>
              <p>{profile?.active === false ? 'Tam khoa' : 'Hoat dong'}</p>
            </div>
            <div className="profile-readonly-item">
              <label>Cap nhat gan nhat</label>
              <p>{formatDateTime(profile?.updatedAt || profile?.lastUpdatedAt || profile?.modifiedAt)}</p>
            </div>
          </div>
          <div className="actions">
            <button className="button" type="submit">
              Luu thong tin
            </button>
          </div>
        </form>
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  )
}
