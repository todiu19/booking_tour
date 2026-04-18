import { useEffect, useState } from 'react'
import { api } from '../api'
import AdminShell from '../components/AdminShell'

export default function AdminCodConfirmPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  async function loadPayments() {
    try {
      setLoading(true)
      setError('')
      const data = await api.adminListPayments()
      setRows(Array.isArray(data) ? data : [])
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

  return (
    <AdminShell title="Payments" subtitle="All payments by latest time; confirm COD when pending">
      <div className="panel stack">
        <div className="panel-head">
          <h3>All Payments</h3>
          <button className="button inline-button" onClick={loadPayments} type="button">
            Reload
          </button>
        </div>
        {loading ? (
          <p className="muted">Loading payments...</p>
        ) : rows.length === 0 ? (
          <p className="muted">No payments found.</p>
        ) : (
          <div className="stack">
            {rows.map((row) => (
              <article className="panel cod-row" key={row.paymentId}>
                <div>
                  <p>
                    <strong>Payment ID:</strong> {row.paymentId}
                  </p>
                  <p>
                    <strong>Email dat:</strong> {row.bookingEmail || 'N/A'}
                  </p>
                  <p>
                    <strong>Ten tour:</strong> {row.tourName || 'N/A'}
                  </p>
                  <p>
                    <strong>Pax:</strong> {row.pax ?? 0}
                  </p>
                  <p>
                    <strong>Tong tien:</strong> {Number(row.totalAmount || 0).toLocaleString('vi-VN')} VND
                  </p>
                  <p>
                    <strong>Provider / Status:</strong> {row.provider} / {row.paymentStatus}
                  </p>
                </div>
                {row.canConfirmCod ? (
                  <button
                    className="button inline-button"
                    type="button"
                    disabled={confirmingId === row.paymentId}
                    onClick={() => confirmCod(row.paymentId)}
                  >
                    {confirmingId === row.paymentId ? 'Confirming...' : 'Confirm COD'}
                  </button>
                ) : (
                  <span className="muted">Not actionable</span>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <article className="panel stack">
          <h3>Confirmed</h3>
          <p>Payment ID: {result?.payment?.id}</p>
          <p>Status: {result?.payment?.paymentStatus}</p>
          <p>Invoice: {result?.invoice?.invoiceNo || 'N/A'}</p>
        </article>
      ) : null}
    </AdminShell>
  )
}
