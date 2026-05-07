import { useEffect, useState } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'
import AdminShell from '../components/AdminShell'

function collectDeparturePointOptions(tours) {
  const base = ['Ha Noi', 'Da Nang', 'TP HCM']
  const values = new Set(base)
  ;(tours || []).forEach((tour) => {
    const value = String(tour?.departurePoint || '').trim()
    if (value) values.add(value)
  })
  return Array.from(values)
}

function collectDestinationOptions(tours) {
  const values = new Set()
  ;(tours || []).forEach((tour) => {
    const raw = String(tour?.destinationList || '')
    raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => values.add(item))
  })
  return Array.from(values)
}

function parseDestinationNames(rawValue) {
  const raw = String(rawValue || '').trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean)
    }
  } catch {
    // Fallback to CSV-like parsing below
  }
  return raw
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((item) => item.replace(/^"+|"+$/g, '').trim())
    .filter(Boolean)
}

function parseDepartureDatesText(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseImageUrlsText(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function AdminToursPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [expandedTourId, setExpandedTourId] = useState(null)
  const [editingTourId, setEditingTourId] = useState(null)
  const [createDestinationOpen, setCreateDestinationOpen] = useState(false)
  const [editDestinationOpen, setEditDestinationOpen] = useState(false)
  const [originOptions, setOriginOptions] = useState(['Hà Nội', 'Đà Nẵng', 'TP HCM'])
  const [destinationCatalog, setDestinationCatalog] = useState([])
  const [editDateDraft, setEditDateDraft] = useState('')
  const [createDateDraft, setCreateDateDraft] = useState('')
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    basePrice: 0,
    description: '',
    durationDays: 1,
    departurePoint: '',
    departureDatesText: '',
    destinationIds: [],
    imageUrlsText: '',
  })
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    durationDays: 1,
    departureDatesText: '',
    basePrice: 0,
    destinationIds: [],
    departurePoint: '',
    status: 'published',
    imageUrlsText: '',
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

  useEffect(() => {
    let active = true
    async function loadOriginOptions() {
      try {
        const result = await api.getDestinations({ page: 0, size: 200 })
        if (!active) return
        const normalized = (value) => {
          const raw = String(value || '').trim()
          const compact = raw.toLowerCase().replace(/[.\s_-]+/g, '')
          if (
            compact === 'tphcm' ||
            compact === 'hochiminh' ||
            compact === 'thanhphohochiminh' ||
            compact === 'tphochiminh'
          ) {
            return 'TP HCM'
          }
          return raw
        }
        const provinces = Array.from(
          new Set(
            (result?.content || [])
              .map((item) => normalized(item?.province))
              .filter(Boolean)
          )
        )
        const priority = ['Hà Nội', 'Đà Nẵng', 'TP HCM']
        const prioritySet = new Set(priority)
        const rest = provinces
          .filter((name) => !prioritySet.has(name))
          .sort((a, b) => a.localeCompare(b, 'vi'))
        setOriginOptions(priority.concat(rest))
      } catch {
        if (active) setOriginOptions(['Hà Nội', 'Đà Nẵng', 'TP HCM'])
      }
    }
    loadOriginOptions()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    async function loadDestinationCatalog() {
      try {
        const result = await api.getDestinations({ page: 0, size: 500 })
        if (!active) return
        setDestinationCatalog(result?.content || [])
      } catch {
        if (active) setDestinationCatalog([])
      }
    }
    loadDestinationCatalog()
    return () => {
      active = false
    }
  }, [])

  async function archive(id) {
    try {
      await api.adminArchiveTour(id)
      setMessage('Đã lưu trữ tour')
      loadTours()
    } catch (e) {
      setError(e.message)
    }
  }

  async function publish(id) {
    try {
      await api.adminPublishTour(id)
      setMessage('Đã xuất bản tour')
      loadTours()
    } catch (e) {
      setError(e.message)
    }
  }

  async function createTour(e) {
    e.preventDefault()
    try {
      const payload = {
        code: form.code,
        name: form.name,
        description: form.description,
        durationDays: Number(form.durationDays),
        basePrice: Number(form.basePrice),
        destinationList: destinationCatalog
          .filter((d) => form.destinationIds.includes(String(d.id)))
          .map((d) => d.name)
          .filter(Boolean)
          .join(', '),
        departurePoint: form.departurePoint.trim() || undefined,
        status: form.status,
        departureDates: form.departureDatesText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        destinationIds: form.destinationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
        imageUrls: parseImageUrlsText(form.imageUrlsText),
      }
      await api.adminCreateTour(payload)
      setMessage('Tạo tour thành công')
      setError('')
      setForm({
        code: '',
        name: '',
        description: '',
        durationDays: 1,
        departureDatesText: '',
        basePrice: 0,
        destinationIds: [],
        departurePoint: '',
        status: 'published',
        imageUrlsText: '',
      })
      setPage(0)
      setActiveTab('list')
      await loadTours(0)
    } catch (e) {
      setError(e.message)
    }
  }

  function toggleExpandedTour(id) {
    setExpandedTourId((prev) => (prev === id ? null : id))
  }

  function toggleEditDestination(destinationId, checked) {
    setEditForm((prev) => {
      const current = new Set(prev.destinationIds || [])
      if (checked) current.add(destinationId)
      else current.delete(destinationId)
      return { ...prev, destinationIds: Array.from(current) }
    })
  }

  function toggleCreateDestination(destinationId, checked) {
    setForm((prev) => {
      const current = new Set(prev.destinationIds || [])
      if (checked) current.add(destinationId)
      else current.delete(destinationId)
      return { ...prev, destinationIds: Array.from(current) }
    })
  }

  function addEditDate() {
    const date = String(editDateDraft || '').trim()
    if (!date) return
    setEditForm((prev) => {
      const next = Array.from(new Set([...parseDepartureDatesText(prev.departureDatesText), date])).sort()
      return { ...prev, departureDatesText: next.join(', ') }
    })
    setEditDateDraft('')
  }

  function removeEditDate(date) {
    setEditForm((prev) => {
      const next = parseDepartureDatesText(prev.departureDatesText).filter((item) => item !== date)
      return { ...prev, departureDatesText: next.join(', ') }
    })
  }

  function addCreateDate() {
    const date = String(createDateDraft || '').trim()
    if (!date) return
    setForm((prev) => {
      const next = Array.from(new Set([...parseDepartureDatesText(prev.departureDatesText), date])).sort()
      return { ...prev, departureDatesText: next.join(', ') }
    })
    setCreateDateDraft('')
  }

  function removeCreateDate(date) {
    setForm((prev) => {
      const next = parseDepartureDatesText(prev.departureDatesText).filter((item) => item !== date)
      return { ...prev, departureDatesText: next.join(', ') }
    })
  }

  const tours = data?.content || []
  const departurePointOptions = originOptions.length ? originOptions : collectDeparturePointOptions(tours)
  const destinationOptions =
    destinationCatalog.length > 0
      ? destinationCatalog.map((d) => ({ id: String(d.id), label: d.name || d.province || `Điểm đến #${d.id}` }))
      : collectDestinationOptions(tours).map((name) => ({ id: name, label: name }))

  function startEditTour(tour) {
    setEditingTourId(tour.id)
    setEditDestinationOpen(false)
    setEditDateDraft('')
    setEditForm({
      code: tour.code || '',
      name: tour.name || '',
      basePrice: tour.basePrice || 0,
      description: tour.description || '',
      durationDays: tour.durationDays || 1,
      departurePoint: tour.departurePoint || '',
      departureDatesText: Array.isArray(tour.departureDates) ? tour.departureDates.join(', ') : '',
      destinationIds: destinationCatalog.length
        ? destinationCatalog
            .filter((d) => parseDestinationNames(tour.destinationList).includes(String(d.name || '').trim()))
            .map((d) => String(d.id))
        : [],
      imageUrlsText: '',
    })
  }

  async function saveEditTour(tour) {
    try {
      const payload = {
        code: editForm.code,
        name: editForm.name,
        description: editForm.description,
        durationDays: Number(editForm.durationDays || 1),
        basePrice: Number(editForm.basePrice || 0),
        departurePoint: editForm.departurePoint.trim() || undefined,
        status: tour.status || 'published',
        departureDates: editForm.departureDatesText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        destinationIds: editForm.destinationIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
        imageUrls: parseImageUrlsText(editForm.imageUrlsText),
      }
      await api.adminUpdateTour(tour.id, payload)
      setMessage('Cập nhật tour thành công')
      setError('')
      setEditingTourId(null)
      setEditDestinationOpen(false)
      await loadTours(page)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <AdminShell title="Quản lý tour" subtitle="Tạo mới, cập nhật và lưu trữ tour">
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="bookings-tabs" role="tablist" aria-label="Quan ly tour">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'list'}
          className={`bookings-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Danh sách tour
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'create'}
          className={`bookings-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Tạo mới tour
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {loading ? <p>Đang tải danh sách tour...</p> : null}
          <div className="stack">
            {tours.map((t) => (
              <article
                key={t.id}
                className="panel admin-tour-card"
                role="button"
                tabIndex={0}
                onClick={() => toggleExpandedTour(t.id)}
                onKeyDown={(e) => {
                  const tag = e.target?.tagName
                  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleExpandedTour(t.id)
                  }
                }}
              >
                <div className="admin-tour-card-thumb-wrap">
                  <img
                    className="admin-tour-card-thumb"
                    src={t.thumbnailUrl || 'https://placehold.co/400x300?text=Khong+co+anh'}
                    alt={t.name || 'Ảnh tour'}
                    loading="lazy"
                  />
                </div>
                <div className="admin-tour-card-main">
                  <div className="panel-head">
                    <h3>{t.name}</h3>
                    <select
                      id={`tour-status-${t.id}`}
                      className={`badge tour-status-badge-select ${t.status === 'archived' ? 'badge-danger' : 'badge-ok'}`}
                      value={t.status || 'published'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const nextStatus = e.target.value
                        if (nextStatus === 'archived' && t.status !== 'archived') {
                          archive(t.id)
                        } else if (nextStatus === 'published' && t.status !== 'published') {
                          publish(t.id)
                        }
                      }}
                    >
                      <option value="published">đang xuất bản</option>
                      <option value="archived">đã lưu trữ</option>
                    </select>
                  </div>
                  <p>Mã: {t.code}</p>
                  <p>Giá: {t.basePrice}</p>
                </div>
                {expandedTourId === t.id ? (
                  <div className="stack admin-tour-card-details">
                    {editingTourId === t.id ? (
                      <>
                        <label>
                          <strong>Mã tour:</strong>
                          <input
                            value={editForm.code}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Tên tour:</strong>
                          <input
                            value={editForm.name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Giá tiền:</strong>
                          <input
                            type="number"
                            min="0"
                            value={editForm.basePrice}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, basePrice: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Mô tả:</strong>
                          <input
                            value={editForm.description}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Thời lượng (ngày):</strong>
                          <input
                            type="number"
                            min="1"
                            value={editForm.durationDays}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, durationDays: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Điểm xuất phát:</strong>
                          <select
                            value={editForm.departurePoint || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, departurePoint: e.target.value }))}
                          >
                            <option value="">Chọn điểm xuất phát</option>
                            {departurePointOptions.map((point) => (
                              <option value={point} key={point}>
                                {point}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <strong>Ngày khởi hành:</strong>
                          <div className="actions" onClick={(e) => e.stopPropagation()}>
                            <input type="date" value={editDateDraft} onChange={(e) => setEditDateDraft(e.target.value)} />
                            <button type="button" className="button button-secondary" onClick={addEditDate}>
                              Thêm ngày
                            </button>
                          </div>
                          <div className="actions">
                            {parseDepartureDatesText(editForm.departureDatesText).map((date) => (
                              <button
                                key={date}
                                type="button"
                                className="button button-secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeEditDate(date)
                                }}
                              >
                                {date} ×
                              </button>
                            ))}
                          </div>
                        </label>
                        <label>
                          <strong>Danh sách điểm đến:</strong>
                          <div className="destination-picker" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="destination-picker-trigger"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditDestinationOpen((prev) => !prev)
                              }}
                            >
                              Chọn điểm đến
                            </button>
                            {editDestinationOpen ? (
                              <div className="destination-picker-menu stack">
                                {destinationOptions.map((destination) => (
                                  <label key={destination.id} className="muted">
                                    <input
                                      type="checkbox"
                                      checked={editForm.destinationIds.includes(destination.id)}
                                      onChange={(e) => toggleEditDestination(destination.id, e.target.checked)}
                                    />{' '}
                                    {destination.label}
                                  </label>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </label>
                        <label>
                          <strong>Thêm ảnh bằng link (mỗi dòng 1 link):</strong>
                          <textarea
                            rows={3}
                            value={editForm.imageUrlsText}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                            placeholder="https://.../tour1.jpg&#10;https://.../tour2.jpg"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong>Mô tả:</strong> {t.description || 'Chưa có'}
                        </p>
                        <p>
                          <strong>Thời lượng:</strong> {t.durationDays || 0} ngày
                        </p>
                        <p>
                          <strong>Điểm xuất phát:</strong> {t.departurePoint || 'Chưa có'}
                        </p>
                        <p>
                          <strong>Ngày khởi hành:</strong>{' '}
                          {Array.isArray(t.departureDates) && t.departureDates.length > 0
                            ? t.departureDates.join(', ')
                            : 'Chưa có'}
                        </p>
                        <p>
                          <strong>Danh sách điểm đến:</strong> {t.destinationList || 'Chưa có'}
                        </p>
                      </>
                    )}
                    <div className="actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingTourId === t.id) {
                            saveEditTour(t)
                          } else {
                            startEditTour(t)
                          }
                        }}
                      >
                        {editingTourId === t.id ? 'Lưu' : 'Chỉnh sửa'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          <Pagination page={data?.page || 0} totalPages={data?.totalPages || 0} onPageChange={setPage} />
        </>
      ) : null}

      {activeTab === 'create' ? (
        <section className="panel stack">
          <h2>Tạo mới tour</h2>
          <form className="stack" onSubmit={createTour}>
            <label>
              <strong>Tên tour:</strong>
              <input
                placeholder="Tên tour"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </label>
            <label>
              <strong>Mã tour:</strong>
              <input
                placeholder="Mã tour"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                required
              />
            </label>
            <label>
              <strong>Mô tả:</strong>
              <textarea
                rows={4}
                placeholder="Mô tả"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </label>
            <label>
              <strong>Số ngày:</strong>
              <input
                type="number"
                min="1"
                placeholder="Số ngày"
                value={form.durationDays}
                onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))}
                required
              />
            </label>
            <label>
              <strong>Giá cơ bản:</strong>
              <input
                type="number"
                min="0"
                placeholder="Giá cơ bản"
                value={form.basePrice}
                onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))}
                required
              />
            </label>
            <label>
              <strong>Trạng thái:</strong>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="published">đang xuất bản</option>
                <option value="archived">đã lưu trữ</option>
              </select>
            </label>
            <label>
              <strong>Điểm xuất phát:</strong>
              <select
                value={form.departurePoint || ''}
                onChange={(e) => setForm((p) => ({ ...p, departurePoint: e.target.value }))}
              >
                <option value="">Chọn điểm xuất phát</option>
                {departurePointOptions.map((point) => (
                  <option value={point} key={point}>
                    {point}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <strong>Ngày khởi hành:</strong>
              <div className="actions">
                <input
                  type="date"
                  value={createDateDraft}
                  onChange={(e) => setCreateDateDraft(e.target.value)}
                />
                <button type="button" className="button button-secondary inline-button" onClick={addCreateDate}>
                  Thêm ngày
                </button>
              </div>
              <div className="actions">
                {parseDepartureDatesText(form.departureDatesText).map((date) => (
                  <button type="button" key={date} className="button button-secondary" onClick={() => removeCreateDate(date)}>
                    {date} ×
                  </button>
                ))}
              </div>
            </label>
            <label>
              <strong>Danh sách điểm đến:</strong>
              <div className="destination-picker">
                <button
                  type="button"
                  className="destination-picker-trigger"
                  onClick={() => setCreateDestinationOpen((prev) => !prev)}
                >
                  Chọn điểm đến
                </button>
                {createDestinationOpen
                  ? (
                    <div className="destination-picker-menu stack">
                      {destinationOptions.map((destination) => (
                        <label key={destination.id} className="muted">
                          <input
                            type="checkbox"
                            checked={form.destinationIds.includes(destination.id)}
                            onChange={(e) => toggleCreateDestination(destination.id, e.target.checked)}
                          />{' '}
                          {destination.label}
                        </label>
                      ))}
                    </div>
                    )
                  : null}
              </div>
            </label>
            <label>
              <strong>Thêm ảnh bằng link (mỗi dòng 1 link):</strong>
              <textarea
                rows={3}
                value={form.imageUrlsText}
                onChange={(e) => setForm((p) => ({ ...p, imageUrlsText: e.target.value }))}
                placeholder="https://.../tour1.jpg&#10;https://.../tour2.jpg"
              />
            </label>
            <div className="actions">
              <button className="button" type="submit">
                Tạo mới tour
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </AdminShell>
  )
}
