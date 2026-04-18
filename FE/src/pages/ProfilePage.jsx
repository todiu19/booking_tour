import { useEffect, useState } from 'react'
import { api } from '../api'

export default function ProfilePage({ refreshMeSignal }) {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
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
      setMessage('Profile updated')
      setError('')
    } catch (err) {
      setError(err.message)
      setMessage('')
    }
  }

  async function logout() {
    try {
      await api.logout()
      setMessage('Logged out')
      setProfile(null)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    try {
      await api.changePassword(passwordForm)
      setMessage('Password updated')
      setError('')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      })
    } catch (err) {
      setError(err.message)
      setMessage('')
    }
  }

  if (loading) return <p>Loading profile...</p>
  if (!profile) return <p>Please login first to see your profile.</p>

  return (
    <section className="stack auth-form">
      <h1>My Profile</h1>
      <p className="muted">Role: {profile?.role?.name || 'user'}</p>
      <form onSubmit={save} className="stack">
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
        <div className="actions">
          <button className="button" type="submit">
            Save profile
          </button>
          <button className="button button-secondary" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </form>

      <form onSubmit={changePassword} className="stack">
        <h2>Change password</h2>
        <input
          type="password"
          placeholder="Current password"
          value={passwordForm.currentPassword}
          onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={passwordForm.confirmNewPassword}
          onChange={(e) =>
            setPasswordForm((p) => ({ ...p, confirmNewPassword: e.target.value }))
          }
          required
        />
        <button className="button inline-button" type="submit">
          Update password
        </button>
      </form>
      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  )
}
