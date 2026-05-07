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

  async function blockUser(id) {
    try {
      await api.adminBlockUser(id)
      setMessage('Tài khoản đã bị khóa')
      loadUsers()
    } catch (e) {
      setError(e.message)
    }
  }

  async function unblockUser(id) {
    try {
      await api.adminUnblockUser(id)
      setMessage('Tài khoản đã được mở khóa')
      loadUsers()
    } catch (e) {
      setError(e.message)
    }
  }

  async function updateUserStatus(user, nextStatus) {
    if (nextStatus === user.status) return
    if (nextStatus === 'blocked') {
      await blockUser(user.id)
      return
    }
    if (nextStatus === 'active') {
      await unblockUser(user.id)
    }
  }

  return (
    <AdminShell title="Quản lý người dùng" subtitle="Theo dõi và khóa/mở khóa tài khoản người dùng">
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Đang tải danh sách người dùng...</p> : null}

      <div className="stack">
        {(data?.content || []).map((u) => (
          <article key={u.id} className="panel">
            <div className="panel-head">
              <h3>{u.fullName}</h3>
              <select
                id={`user-status-${u.id}`}
                className={`badge tour-status-badge-select ${u.status === 'blocked' ? 'badge-danger' : 'badge-ok'}`}
                value={u.status || 'active'}
                onChange={(e) => updateUserStatus(u, e.target.value)}
              >
                <option value="active">đang hoạt động</option>
                <option value="blocked">đã khóa</option>
              </select>
            </div>
            <p>{u.email}</p>
            <p>{u.phone}</p>
            <p className="muted">Vai trò: {u?.role?.name}</p>
          </article>
        ))}
      </div>

      <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} />
    </AdminShell>
  )
}
