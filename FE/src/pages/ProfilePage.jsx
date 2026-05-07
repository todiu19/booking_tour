import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function formatDateTime(value) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'
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
      setMessage('Cập nhật hồ sơ thành công')
      setError('')
    } catch (err) {
      setError(err.message)
      setMessage('')
    }
  }

  if (loading) return <p>Đang tải hồ sơ...</p>
  if (!profile) {
    return (
      <section className="profile-page">
        <div className="profile-hero panel">
          <h1>Thông tin cá nhân</h1>
          <p className="muted">Bạn cần đăng nhập để xem và cập nhật thông tin tài khoản.</p>
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
        <h1>Thông tin cá nhân</h1>
        <p className="muted">
          Quản lý thông tin cá nhân, bảo mật tài khoản và theo dõi các đơn đặt của bạn.
        </p>
        <p className="profile-role-pill">Vai trò: {profile?.role?.name || 'CUSTOMER'}</p>
      </div>

      <div className="profile-layout">
        <form onSubmit={save} className="profile-card panel profile-account-card">
          <h2>Thông tin tài khoản</h2>
          <div className="profile-field">
            <label htmlFor="profile-fullname">Họ và tên</label>
            <input
              id="profile-fullname"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Nhập họ và tên"
              required
            />
          </div>
          <div className="profile-readonly-item">
            <label htmlFor="profile-email">Email</label>
            <p id="profile-email">{form.email || profile?.email || 'Chua co'}</p>
          </div>
          <div className="profile-field">
            <label htmlFor="profile-phone">Số điện thoại</label>
            <input
              id="profile-phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Nhập số điện thoại"
              required
            />
          </div>
          <div className="profile-readonly-grid">
            <div className="profile-readonly-item">
              <label>Trạng thái</label>
              <p>{profile?.active === false ? 'Tạm khóa' : 'Hoạt động'}</p>
            </div>
            <div className="profile-readonly-item">
              <label>Cập nhật gần nhất</label>
              <p>{formatDateTime(profile?.updatedAt || profile?.lastUpdatedAt || profile?.modifiedAt)}</p>
            </div>
          </div>
          <div className="actions">
            <button className="button" type="submit">
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>

      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  )
}
