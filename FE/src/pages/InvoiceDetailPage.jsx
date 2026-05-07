import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'

function formatPrice(value) {
  if (value == null) return 'N/A'
  return Number(value).toLocaleString('vi-VN') + ' VND'
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const result = await api.getMyInvoiceById(id)
        if (active) setInvoice(result)
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
  }, [id])

  if (loading) return <p>Đang tải chi tiết hóa đơn...</p>
  if (error) return <p className="error">{error}</p>
  if (!invoice) return <p>Không tìm thấy hóa đơn.</p>

  return (
    <section className="stack panel">
      <h1>Hóa đơn {invoice.invoiceNo}</h1>
      <p>Mã đơn tour: {invoice.bookingId || '-'}</p>
      <p>Mã đơn khách sạn: {invoice.hotelBookingId || '-'}</p>
      <p>Ngày phát hành: {invoice.issuedAt || '-'}</p>
      <p>Tạm tính: {formatPrice(invoice.subtotalAmount)}</p>
      <p>Thuế: {formatPrice(invoice.taxAmount)}</p>
      <p>Tổng cộng: {formatPrice(invoice.totalAmount)}</p>
      <h3>Thông tin xuất hóa đơn</h3>
      <p>{invoice.billingName}</p>
      <p>{invoice.billingPhone}</p>
      <p>{invoice.billingEmail}</p>
      <p>{invoice.billingAddress}</p>
      {invoice.note ? <p className="muted">Ghi chú: {invoice.note}</p> : null}
    </section>
  )
}
