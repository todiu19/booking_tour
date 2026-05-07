import { useEffect, useState } from 'react'
import { api } from '../api'
import AdminShell from '../components/AdminShell'

export default function AdminCodConfirmPage() {
  const [rows, setRows] = useState([])
  const [hotelRows, setHotelRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  async function loadPayments() {
    try {
      setLoading(true)
      setError('')
      const data = await api.adminListPayments()
      const hotelData = await api.adminListPendingHotelCodBookings()
      setRows(Array.isArray(data) ? data : [])
      setHotelRows(Array.isArray(hotelData) ? hotelData : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  async function confirmCod(paymentId) {
    try {
      setConfirmingId(paymentId)
      setError('')
      const res = await api.adminConfirmCodCollected(paymentId)
      setResult(res)
      await loadPayments()
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally {
      setConfirmingId(null)
    }
  }

  async function confirmHotelCod(bookingId) {
    try {
      setConfirmingId(`hotel-${bookingId}`)
      setError('')
      const res = await api.adminConfirmHotelCodCollected(bookingId)
      setResult({ payment: { id: `hotel-${res?.id}`, paymentStatus: res?.paymentStatus }, invoice: null })
      await loadPayments()
    } catch (e) {
      setError(e.message)
      setResult(null)
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <AdminShell title="Thanh toán" subtitle="Danh sách thanh toán mới nhất; xác nhận COD khi đang chờ">
      <div className="panel stack">
        <div className="panel-head">
          <h3>Tất cả thanh toán</h3>
          <button className="button inline-button" onClick={loadPayments} type="button">
            Tải lại
          </button>
        </div>
        {loading ? (
          <p className="muted">Đang tải danh sách thanh toán...</p>
        ) : rows.length === 0 ? (
          <p className="muted">Không có dữ liệu thanh toán.</p>
        ) : (
          <div className="stack">
            {rows.map((row) => (
              <article className="panel cod-row" key={row.paymentId}>
                <div>
                  <p>
                    <strong>Mã thanh toán:</strong> {row.paymentId}
                  </p>
                  <p>
                    <strong>Email đặt:</strong> {row.bookingEmail || 'Chưa có'}
                  </p>
                  <p>
                    <strong>Tên tour:</strong> {row.tourName || 'Chưa có'}
                  </p>
                  <p>
                    <strong>Số khách:</strong> {row.pax ?? 0}
                  </p>
                  <p>
                    <strong>Tong tien:</strong> {Number(row.totalAmount || 0).toLocaleString('vi-VN')} VND
                  </p>
                  <p>
                    <strong>Cổng thanh toán / Trạng thái:</strong> {row.provider} / {row.paymentStatus}
                  </p>
                </div>
                {row.canConfirmCod ? (
                  <button
                    className="button inline-button"
                    type="button"
                    disabled={confirmingId === row.paymentId}
                    onClick={() => confirmCod(row.paymentId)}
                  >
                    {confirmingId === row.paymentId ? 'Đang xác nhận...' : 'Xác nhận COD'}
                  </button>
                ) : (
                  <span className="muted">Không khả dụng</span>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="panel stack">
        <div className="panel-head">
          <h3>Đơn khách sạn COD chờ xác nhận</h3>
        </div>
        {loading ? (
          <p className="muted">Đang tải đơn khách sạn COD...</p>
        ) : hotelRows.length === 0 ? (
          <p className="muted">Không có đơn khách sạn COD chờ xác nhận.</p>
        ) : (
          <div className="stack">
            {hotelRows.map((row) => (
              <article className="panel cod-row" key={`hotel-${row.id}`}>
                <div>
                  <p>
                    <strong>Mã đơn khách sạn:</strong> {row.id}
                  </p>
                  <p>
                    <strong>Khách sạn:</strong> {row.hotelName || 'Chưa có'}
                  </p>
                  <p>
                    <strong>Email đặt:</strong> {row.contactEmail || 'Chưa có'}
                  </p>
                  <p>
                    <strong>Khach / Phong:</strong> {row.guestCount ?? 0} / {row.roomCount ?? 0}
                  </p>
                  <p>
                    <strong>Tong tien:</strong> {Number(row.totalAmount || 0).toLocaleString('vi-VN')} VND
                  </p>
                  <p>
                    <strong>Trạng thái thanh toán:</strong> {row.paymentStatus}
                  </p>
                </div>
                <button
                  className="button inline-button"
                  type="button"
                  disabled={confirmingId === `hotel-${row.id}`}
                  onClick={() => confirmHotelCod(row.id)}
                >
                  {confirmingId === `hotel-${row.id}` ? 'Đang xác nhận...' : 'Xác nhận COD'}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <article className="panel stack">
          <h3>Đã xác nhận</h3>
          <p>Mã thanh toán: {result?.payment?.id}</p>
          <p>Trạng thái: {result?.payment?.paymentStatus}</p>
          <p>Hóa đơn: {result?.invoice?.invoiceNo || 'Chưa có'}</p>
        </article>
      ) : null}
    </AdminShell>
  )
}
