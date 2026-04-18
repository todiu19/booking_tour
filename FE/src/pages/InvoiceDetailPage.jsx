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

  if (loading) return <p>Loading invoice detail...</p>
  if (error) return <p className="error">{error}</p>
  if (!invoice) return <p>Invoice not found.</p>

  return (
    <section className="stack panel">
      <h1>Invoice {invoice.invoiceNo}</h1>
      <p>Booking ID: {invoice.bookingId}</p>
      <p>Issued at: {invoice.issuedAt || '-'}</p>
      <p>Subtotal: {formatPrice(invoice.subtotalAmount)}</p>
      <p>Tax: {formatPrice(invoice.taxAmount)}</p>
      <p>Total: {formatPrice(invoice.totalAmount)}</p>
      <h3>Billing info</h3>
      <p>{invoice.billingName}</p>
      <p>{invoice.billingPhone}</p>
      <p>{invoice.billingEmail}</p>
      <p>{invoice.billingAddress}</p>
      {invoice.note ? <p className="muted">Note: {invoice.note}</p> : null}
    </section>
  )
}
