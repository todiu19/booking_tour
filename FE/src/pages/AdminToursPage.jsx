import { useEffect, useState } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'
import AdminShell from '../components/AdminShell'

export default function AdminToursPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState('')
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    durationDays: 1,
    departureDate: '',
    basePrice: 0,
    destinationList: '',
    status: 'published',
  })

  async function loadTours(nextPage = page) {
    try {
      setLoading(true)
      setError('')
      const result = await api.adminListTours(nextPage, 10)
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTours(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function submit(e) {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        durationDays: Number(form.durationDays),
        basePrice: Number(form.basePrice),
        departureDate: form.departureDate || null,
        destinationIds: [],
      }
      if (editId) {
        await api.adminUpdateTour(editId, payload)
        setMessage('Tour updated')
      } else {
        await api.adminCreateTour(payload)
        setMessage('Tour created')
      }
      loadTours()
    } catch (err) {
      setError(err.message)
    }
  }

  async function archive(id) {
    try {
      await api.adminArchiveTour(id)
      setMessage('Tour archived')
      loadTours()
    } catch (e) {
      setError(e.message)
    }
  }

  function startEdit(tour) {
    setEditId(tour.id)
    setForm({
      code: tour.code || '',
      name: tour.name || '',
      description: tour.description || '',
      durationDays: tour.durationDays || 1,
      departureDate: tour.departureDate || '',
      basePrice: tour.basePrice || 0,
      destinationList: tour.destinationList || '',
      status: tour.status || 'published',
    })
  }

  return (
    <AdminShell title="Tour Management" subtitle="Create, update and archive tours">
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading tours...</p> : null}

      <div className="stack">
        {(data?.content || []).map((t) => (
          <article key={t.id} className="panel">
            <div className="panel-head">
              <h3>{t.name}</h3>
              <span className={`badge ${t.status === 'archived' ? 'badge-danger' : 'badge-ok'}`}>
                {t.status}
              </span>
            </div>
            <p>Code: {t.code}</p>
            <p>Price: {t.basePrice}</p>
            <div className="actions">
              <button className="button" type="button" onClick={() => startEdit(t)}>
                Edit
              </button>
              {t.status !== 'archived' ? (
                <button className="button button-secondary" type="button" onClick={() => archive(t.id)}>
                  Archive
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} />

      <section className="panel stack">
        <h2>{editId ? `Update tour #${editId}` : 'Create tour'}</h2>
        <form className="stack" onSubmit={submit}>
          <div className="filters">
            <input
              placeholder="Code"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              required
            />
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="filters">
            <input
              type="number"
              min="1"
              placeholder="Duration days"
              value={form.durationDays}
              onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))}
              required
            />
            <input
              type="date"
              value={form.departureDate}
              onChange={(e) => setForm((p) => ({ ...p, departureDate: e.target.value }))}
            />
            <input
              type="number"
              min="0"
              placeholder="Base price"
              value={form.basePrice}
              onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))}
              required
            />
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <input
            placeholder="Destination list text (json/string)"
            value={form.destinationList}
            onChange={(e) => setForm((p) => ({ ...p, destinationList: e.target.value }))}
          />
          <div className="actions">
            <button className="button" type="submit">
              {editId ? 'Update tour' : 'Create tour'}
            </button>
            {editId ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEditId('')
                  setForm({
                    code: '',
                    name: '',
                    description: '',
                    durationDays: 1,
                    departureDate: '',
                    basePrice: 0,
                    destinationList: '',
                    status: 'published',
                  })
                }}
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </AdminShell>
  )
}
