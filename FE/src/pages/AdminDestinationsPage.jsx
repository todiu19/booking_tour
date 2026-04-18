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
  const [form, setForm] = useState({
    name: '',
    province: '',
    country: '',
    imageUrl: '',
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
        setMessage('Destination updated')
      } else {
        await api.adminCreateDestination(form)
        setMessage('Destination created')
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
    })
  }

  return (
    <AdminShell title="Destination Management" subtitle="Maintain destinations used by tours">
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading destinations...</p> : null}

      <div className="grid">
        {(data?.content || []).map((d) => (
          <article className="panel" key={d.id}>
            <h3>{d.name}</h3>
            <p>{d.province}, {d.country}</p>
            <button className="button inline-button" type="button" onClick={() => startEdit(d)}>
              Edit
            </button>
          </article>
        ))}
      </div>

      <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} />

      <section className="panel stack">
        <h2>{editId ? `Update destination #${editId}` : 'Create destination'}</h2>
        <form className="stack" onSubmit={submit}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <div className="filters">
            <input
              placeholder="Province"
              value={form.province}
              onChange={(e) => setForm((p) => ({ ...p, province: e.target.value }))}
              required
            />
            <input
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              required
            />
          </div>
          <input
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
          />
          <div className="actions">
            <button className="button" type="submit">
              {editId ? 'Update destination' : 'Create destination'}
            </button>
            {editId ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEditId('')
                  setForm({ name: '', province: '', country: '', imageUrl: '' })
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
