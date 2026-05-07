import { useEffect, useState } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'
import AdminShell from '../components/AdminShell'

export default function AdminDestinationsPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState('')
  const [activeTab, setActiveTab] = useState('list')
  const [form, setForm] = useState({
    name: '',
    province: '',
    country: '',
    imageUrl: '',
    description: '',
  })

  async function load(nextPage = page) {
    try {
      setLoading(true)
      setError('')
      const result = await api.getDestinations({ page: nextPage, size: 10 })
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function submit(e) {
    e.preventDefault()
    try {
      if (editId) {
        await api.adminUpdateDestination(editId, form)
        setMessage('Cập nhật điểm đến thành công')
      } else {
        await api.adminCreateDestination(form)
        setMessage('Tạo điểm đến thành công')
      }
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  function startEdit(d) {
    setEditId(d.id)
    setForm({
      name: d.name || '',
      province: d.province || '',
      country: d.country || '',
      imageUrl: d.imageUrl || '',
      description: d.description || '',
    })
  }

  return (
    <AdminShell title="Quản lý điểm đến" subtitle="Quản lý danh sách điểm đến được dùng trong tour">
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Đang tải danh sách điểm đến...</p> : null}

      <div className="bookings-tabs" role="tablist" aria-label="Quan ly dia diem">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'list'}
          className={`bookings-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Danh sách địa điểm
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'create'}
          className={`bookings-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('create')
            setEditId('')
            setForm({ name: '', province: '', country: '', imageUrl: '', description: '' })
          }}
        >
          Tạo địa điểm
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid">
        {(data?.content || []).map((d) => (
          <article className="panel" key={d.id}>
            {editId === d.id ? (
              <div className="admin-destination-edit-layout">
                <div className="admin-destination-thumb-wrap">
                  <img
                    className="admin-destination-thumb"
                    src={form.imageUrl || d.imageUrl || 'https://placehold.co/400x300?text=No+Image'}
                    alt={form.name || d.name || 'Ảnh điểm đến'}
                    loading="lazy"
                  />
                </div>
                <form className="stack" onSubmit={submit}>
                  <input
                    placeholder="Tên điểm đến"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                  <div className="filters">
                    <input
                      placeholder="Tỉnh/Thành phố"
                      value={form.province}
                      onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
                      required
                    />
                    <input
                      placeholder="Quốc gia"
                      value={form.country}
                      onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                      required
                    />
                  </div>
                  <input
                    placeholder="Đường dẫn ảnh"
                    value={form.imageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  />
                  <textarea
                    placeholder="Mô tả"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  <div className="actions">
                    <button className="button" type="submit">
                      Cập nhật điểm đến
                    </button>
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={() => {
                        setEditId('')
                        setForm({ name: '', province: '', country: '', imageUrl: '', description: '' })
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="admin-destination-thumb-wrap">
                  <img
                    className="admin-destination-thumb"
                    src={d.imageUrl || 'https://placehold.co/400x300?text=No+Image'}
                    alt={d.name || 'Ảnh điểm đến'}
                    loading="lazy"
                  />
                </div>
                <h3>{d.name}</h3>
                <p>{d.province}, {d.country}</p>
                {d.description ? <p className="muted">{d.description}</p> : null}
                <button className="button inline-button" type="button" onClick={() => startEdit(d)}>
                  Chỉnh sửa
                </button>
              </>
            )}
          </article>
        ))}
      </div>
      ) : null}

      {activeTab === 'list' ? <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} /> : null}

      {activeTab === 'create' ? (
        <section className="panel stack">
          <h2>Tạo điểm đến mới</h2>
          <form className="stack" onSubmit={submit}>
            <input
              placeholder="Tên điểm đến"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <div className="filters">
              <input
                placeholder="Tỉnh/Thành phố"
                value={form.province}
                onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
                required
              />
              <input
                placeholder="Quốc gia"
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                required
              />
            </div>
            <input
              placeholder="Đường dẫn ảnh"
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
            />
            <textarea
              placeholder="Mô tả"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
            {form.imageUrl ? (
              <div className="stack">
                <p className="muted">Ảnh hiện tại:</p>
                <div className="admin-destination-thumb-wrap">
                  <img className="admin-destination-thumb" src={form.imageUrl} alt={form.name || 'Ảnh điểm đến'} />
                </div>
                <button
                  className="button button-secondary inline-button"
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                >
                  Xóa link ảnh
                </button>
              </div>
            ) : null}
            <div className="actions">
              <button className="button" type="submit">
                Tạo điểm đến
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </AdminShell>
  )
}
