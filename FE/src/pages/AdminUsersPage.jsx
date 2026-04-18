import { useEffect, useState } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'
import AdminShell from '../components/AdminShell'

export default function AdminUsersPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleId: 2,
    status: 'active',
  })

  async function loadUsers(nextPage = page) {
    try {
      setLoading(true)
      setError('')
      const result = await api.adminListUsers(nextPage, 10)
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function selectUser(id) {
    try {
      const user = await api.adminGetUserById(id)
      setSelectedUser(user)
    } catch (e) {
      setError(e.message)
    }
  }

  async function createUser(e) {
    e.preventDefault()
    try {
      await api.adminCreateUser({
        ...form,
        roleId: Number(form.roleId),
      })
      setMessage('User created')
      loadUsers(0)
      setPage(0)
    } catch (e) {
      setError(e.message)
    }
  }

  async function blockUser(id) {
    try {
      await api.adminBlockUser(id)
      setMessage('User blocked')
      loadUsers()
      if (selectedUser?.id === id) {
        selectUser(id)
      }
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <AdminShell title="User Management" subtitle="Create, inspect and block user accounts">
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading users...</p> : null}

      <div className="stack">
        {(data?.content || []).map((u) => (
          <article key={u.id} className="panel">
            <div className="panel-head">
              <h3>{u.fullName}</h3>
              <span className={`badge ${u.status === 'blocked' ? 'badge-danger' : 'badge-ok'}`}>
                {u.status}
              </span>
            </div>
            <p>{u.email}</p>
            <p>{u.phone}</p>
            <p className="muted">Role: {u?.role?.name}</p>
            <div className="actions">
              <button className="button" type="button" onClick={() => selectUser(u.id)}>
                View detail
              </button>
              {u.status !== 'blocked' ? (
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => blockUser(u.id)}
                >
                  Block user
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} />

      {selectedUser ? (
        <section className="panel stack">
          <h2>User detail</h2>
          <p>ID: {selectedUser.id}</p>
          <p>Name: {selectedUser.fullName}</p>
          <p>Email: {selectedUser.email}</p>
          <p>Phone: {selectedUser.phone}</p>
          <p>Status: {selectedUser.status}</p>
          <p>Role: {selectedUser?.role?.name}</p>
        </section>
      ) : null}

      <section className="panel stack">
        <h2>Create user</h2>
        <p className="muted">Role id: 1 = ADMIN, 2 = CUSTOMER</p>
        <form onSubmit={createUser} className="stack">
          <input
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <div className="filters">
            <input
              type="number"
              placeholder="Role id"
              value={form.roleId}
              onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
              required
            />
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="active">active</option>
              <option value="blocked">blocked</option>
            </select>
          </div>
          <button className="button inline-button" type="submit">
            Create user
          </button>
        </form>
      </section>
    </AdminShell>
  )
}
