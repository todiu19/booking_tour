import { useEffect, useState } from 'react'
import { api } from '../api'
import Pagination from '../components/Pagination'
import AdminShell from '../components/AdminShell'

export default function AdminHotelsPage() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('list')
  const [expandedHotelId, setExpandedHotelId] = useState(null)
  const [editingHotelId, setEditingHotelId] = useState(null)
  const [destinationOptions, setDestinationOptions] = useState([])
  const [hotelTypeOptions, setHotelTypeOptions] = useState([])
  const [editForm, setEditForm] = useState({
    name: '',
    location: '',
    description: '',
    basePrice: 0,
    roomCapacity: 1,
    hotelTypeId: '',
    imageUrlsText: '',
  })
  const [form, setForm] = useState({
    name: '',
    address: '',
    location: '',
    description: '',
    basePrice: 0,
    roomCapacity: 1,
    destinationId: '',
    hotelTypeId: '',
    imageUrlsText: '',
    status: 'active',
  })

  function parseImageUrlsText(value) {
    return String(value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }

  function normalizeHotelTypeOptions(rawList) {
    return (rawList || [])
      .map((item) => {
        if (item && typeof item === 'object') {
          const id = item.id ?? item.value ?? item.name
          const name = item.name ?? item.label ?? String(id ?? '').trim()
          if (id == null || !name) return null
          return { id: String(id), name: String(name) }
        }
        const text = String(item || '').trim()
        if (!text) return null
        return { id: text, name: text }
      })
      .filter(Boolean)
  }

  async function load(nextPage = page) {
    try {
      setLoading(true)
      setError('')
      const result = await api.adminListHotels(nextPage, 10)
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

  useEffect(() => {
    let active = true
    async function loadOptions() {
      try {
        const [destinations, hotelTypes] = await Promise.all([
          api.getDestinations({ page: 0, size: 500 }),
          api.getHotelTypes(),
        ])
        if (!active) return
        setDestinationOptions(destinations?.content || [])
        setHotelTypeOptions(normalizeHotelTypeOptions(hotelTypes))
      } catch {
        if (!active) return
        setDestinationOptions([])
        setHotelTypeOptions([])
      }
    }
    loadOptions()
    return () => {
      active = false
    }
  }, [])

  async function createHotel(e) {
    e.preventDefault()
    try {
      const payload = {
        name: form.name,
        address: form.address || undefined,
        location: form.location || undefined,
        description: form.description || undefined,
        basePrice: Number(form.basePrice || 0),
        roomCapacity: Number(form.roomCapacity || 1),
        destinationId: form.destinationId ? Number(form.destinationId) : undefined,
        hotelTypeId: form.hotelTypeId ? Number(form.hotelTypeId) || undefined : undefined,
        imageUrls: parseImageUrlsText(form.imageUrlsText),
        status: form.status,
      }
      await api.adminCreateHotel(payload)
      setMessage('Tạo khách sạn thành công')
      setError('')
      setForm({
        name: '',
        address: '',
        location: '',
        description: '',
        basePrice: 0,
        roomCapacity: 1,
        destinationId: '',
        hotelTypeId: '',
        imageUrlsText: '',
        status: 'active',
      })
      setPage(0)
      setActiveTab('list')
      await load(0)
    } catch (err) {
      setError(err.message)
    }
  }

  async function blockHotel(id) {
    try {
      await api.adminBlockHotel(id)
      setMessage('Đã khóa khách sạn')
      setError('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function unblockHotel(id) {
    try {
      await api.adminUnblockHotel(id)
      setMessage('Đã mở khóa khách sạn')
      setError('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateHotelStatus(hotel, nextStatus) {
    if (nextStatus === hotel.status) return
    if (nextStatus === 'blocked') {
      await blockHotel(hotel.id)
      return
    }
    if (nextStatus === 'active') {
      await unblockHotel(hotel.id)
    }
  }

  function toggleExpandedHotel(id) {
    setExpandedHotelId((prev) => (prev === id ? null : id))
  }

  function startEditHotel(hotel) {
    setEditingHotelId(hotel.id)
    setEditForm({
      name: hotel.name || '',
      location: hotel.location || '',
      description: hotel.description || '',
      basePrice: hotel.basePrice ?? 0,
      roomCapacity: hotel.roomCapacity ?? 1,
      hotelTypeId: hotel.hotelTypeId ? String(hotel.hotelTypeId) : '',
      imageUrlsText: '',
    })
  }

  async function saveEditHotel(hotel) {
    try {
      const payload = {
        name: editForm.name,
        address: hotel.address || undefined,
        location: editForm.location || undefined,
        description: editForm.description || undefined,
        basePrice: Number(editForm.basePrice || 0),
        roomCapacity: Number(editForm.roomCapacity || 1),
        destinationId: hotel.destinationId ?? undefined,
        hotelTypeId: editForm.hotelTypeId ? Number(editForm.hotelTypeId) || undefined : undefined,
        imageUrls: parseImageUrlsText(editForm.imageUrlsText),
        status: hotel.status || 'active',
      }
      await api.adminUpdateHotel(hotel.id, payload)
      setMessage('Cập nhật khách sạn thành công')
      setError('')
      setEditingHotelId(null)
      await load(page)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <AdminShell title="Quản lý khách sạn" subtitle="Tạo mới, cập nhật và khóa/mở khóa khách sạn">
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="bookings-tabs" role="tablist" aria-label="Quan ly khach san">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'list'}
          className={`bookings-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Danh sách khách sạn
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'create'}
          className={`bookings-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Tạo mới khách sạn
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {loading ? <p>Đang tải danh sách khách sạn...</p> : null}
          <div className="stack">
            {(data?.content || []).map((h) => (
              <article
                className="panel admin-tour-card"
                key={h.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleExpandedHotel(h.id)}
                onKeyDown={(e) => {
                  const tag = e.target?.tagName
                  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleExpandedHotel(h.id)
                  }
                }}
              >
                <div className="admin-tour-card-thumb-wrap">
                  <img
                    className="admin-tour-card-thumb"
                    src={h.thumbnailUrl || h.imageUrl || 'https://placehold.co/400x300?text=Khong+co+anh'}
                    alt={h.name || 'Ảnh khách sạn'}
                    loading="lazy"
                  />
                </div>
                <div className="admin-tour-card-main">
                  <div className="panel-head">
                    <h3>{h.name}</h3>
                    <select
                      id={`hotel-status-${h.id}`}
                      className={`badge tour-status-badge-select ${h.status === 'blocked' ? 'badge-danger' : 'badge-ok'}`}
                      value={h.status || 'active'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateHotelStatus(h, e.target.value)}
                    >
                      <option value="active">đang hoạt động</option>
                      <option value="blocked">đã khóa</option>
                    </select>
                  </div>
                  <p>{h.location || h.address || 'Chưa có vị trí'}</p>
                  <p>Giá: {h.basePrice != null ? Number(h.basePrice).toLocaleString('vi-VN') : 0} đ</p>
                </div>
                {expandedHotelId === h.id ? (
                  <div className="stack admin-tour-card-details">
                    {editingHotelId === h.id ? (
                      <>
                        <label>
                          <strong>Tên khách sạn:</strong>
                          <input
                            value={editForm.name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Vị trí:</strong>
                          <input
                            value={editForm.location}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Mô tả:</strong>
                          <textarea
                            rows={3}
                            value={editForm.description}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Giá cơ bản:</strong>
                          <input
                            type="number"
                            min="0"
                            value={editForm.basePrice}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, basePrice: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Sức chứa phòng:</strong>
                          <input
                            type="number"
                            min="1"
                            value={editForm.roomCapacity}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, roomCapacity: e.target.value }))}
                          />
                        </label>
                        <label>
                          <strong>Loại khách sạn:</strong>
                          <select
                            value={editForm.hotelTypeId}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, hotelTypeId: e.target.value }))}
                          >
                            <option value="">Chọn loại khách sạn</option>
                            {hotelTypeOptions.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <strong>Thêm ảnh bằng link (mỗi dòng 1 link):</strong>
                          <textarea
                            rows={3}
                            value={editForm.imageUrlsText}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrlsText: e.target.value }))}
                            placeholder="https://.../hotel1.jpg&#10;https://.../hotel2.jpg"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong>Tên khách sạn:</strong> {h.name || 'Chưa có'}
                        </p>
                        <p>
                          <strong>Vị trí:</strong> {h.location || 'Chưa có'}
                        </p>
                        <p>
                          <strong>Mô tả:</strong> {h.description || 'Chưa có'}
                        </p>
                        <p>
                          <strong>Giá cơ bản:</strong>{' '}
                          {h.basePrice != null ? Number(h.basePrice).toLocaleString('vi-VN') : 0} đ
                        </p>
                        <p>
                          <strong>Sức chứa phòng:</strong> {h.roomCapacity ?? 'Chưa có'}
                        </p>
                        <p>
                          <strong>Loại khách sạn:</strong> {h.hotelTypeName || h.hotelTypeId || 'Chưa có'}
                        </p>
                        <p>
                          <strong>Trạng thái:</strong> {h.status || 'Chưa rõ'}
                        </p>
                      </>
                    )}
                    <div className="actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingHotelId === h.id) {
                            saveEditHotel(h)
                          } else {
                            startEditHotel(h)
                          }
                        }}
                      >
                        {editingHotelId === h.id ? 'Lưu' : 'Chỉnh sửa'}
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
          <h2>Tạo mới khách sạn</h2>
          <form className="stack" onSubmit={createHotel}>
            <label>
              <strong>Tên khách sạn:</strong>
              <input
                placeholder="Tên khách sạn"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </label>
            <label>
              <strong>Địa chỉ:</strong>
              <input
                placeholder="Địa chỉ"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </label>
            <label>
              <strong>Khu vực:</strong>
              <input
                placeholder="Khu vực"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
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
              <strong>Sức chứa phòng:</strong>
              <input
                type="number"
                min="1"
                placeholder="Sức chứa phòng"
                value={form.roomCapacity}
                onChange={(e) => setForm((p) => ({ ...p, roomCapacity: e.target.value }))}
                required
              />
            </label>
            <label>
              <strong>Điểm đến:</strong>
              <select value={form.destinationId} onChange={(e) => setForm((p) => ({ ...p, destinationId: e.target.value }))}>
                <option value="">Chọn điểm đến</option>
                {destinationOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <strong>Loại khách sạn:</strong>
              <select value={form.hotelTypeId} onChange={(e) => setForm((p) => ({ ...p, hotelTypeId: e.target.value }))}>
                <option value="">Chọn loại khách sạn</option>
                {hotelTypeOptions.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <strong>Trạng thái:</strong>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="active">đang hoạt động</option>
                <option value="blocked">đã khóa</option>
              </select>
            </label>
            <label>
              <strong>Thêm ảnh bằng link (mỗi dòng 1 link):</strong>
              <textarea
                rows={3}
                value={form.imageUrlsText}
                onChange={(e) => setForm((p) => ({ ...p, imageUrlsText: e.target.value }))}
                placeholder="https://.../hotel1.jpg&#10;https://.../hotel2.jpg"
              />
            </label>
            <div className="actions">
              <button className="button" type="submit">
                Tạo mới khách sạn
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </AdminShell>
  )
}
