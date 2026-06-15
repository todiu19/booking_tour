import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'

function formatAmount(value) {
  const raw = Number(value || 0)
  if (!Number.isFinite(raw) || raw <= 0) return 'N/A'
  return (raw / 100).toLocaleString('vi-VN') + ' VND'
}

function resolveVnpayMessage(code) {
  if (code === '00') return 'Giao dịch được VNPAY ghi nhận thành công.'
  if (code === '24') return 'Giao dịch đã bị hủy trên cổng VNPAY.'
  if (!code) return 'Không nhận được mã phản hồi từ VNPAY.'
  return `VNPAY trả về mã ${code}.`
}

export default function VnpayReturnPage() {
  const [searchParams] = useSearchParams()
  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const responseCode = params.vnp_ResponseCode || ''
  const transactionStatus = params.vnp_TransactionStatus || ''
  const gatewaySuccess = responseCode === '00' && (!transactionStatus || transactionStatus === '00')
  const hasRequiredParams = Boolean(params.vnp_TxnRef && params.vnp_SecureHash)

  useEffect(() => {
    let active = true

    async function confirmReturn() {
      if (!hasRequiredParams) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError('')
        const data = await api.confirmVnpayReturn(params)
        if (active) setResult(data)
      } catch (e) {
        if (active) setError(e.message || 'Không thể xác nhận kết quả thanh toán')
      } finally {
        if (active) setLoading(false)
      }
    }

    confirmReturn()
    return () => {
      active = false
    }
  }, [hasRequiredParams, params])

  const backendCode = result?.RspCode || ''
  const backendAccepted = backendCode === '00' || backendCode === '02'
  const isSuccess = gatewaySuccess && (!hasRequiredParams || backendAccepted)

  return (
    <section className="stack panel">
      <h1>Kết quả thanh toán VNPAY</h1>

      {!hasRequiredParams ? (
        <p className="error">Thiếu thông tin giao dịch từ VNPAY.</p>
      ) : null}

      {loading ? <p>Đang xác nhận giao dịch...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading ? (
        <>
          <p>
            <strong>Trạng thái:</strong>{' '}
            {isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}
          </p>
          <p>
            <strong>Thông báo:</strong> {resolveVnpayMessage(responseCode)}
          </p>
          <p>
            <strong>Mã giao dịch:</strong> {params.vnp_TxnRef || '-'}
          </p>
          <p>
            <strong>Số tiền:</strong> {formatAmount(params.vnp_Amount)}
          </p>
          <p>
            <strong>Mã phản hồi VNPAY:</strong> {responseCode || '-'}
          </p>
          {result ? (
            <p className="muted">
              Backend: {result.RspCode || '-'} - {result.Message || '-'}
            </p>
          ) : null}

          <div className="actions">
            <Link className="button" to="/bookings">
              Xem đơn hàng
            </Link>
            <Link className="button button-secondary" to="/tours">
              Tiếp tục xem tour
            </Link>
          </div>
        </>
      ) : null}
    </section>
  )
}
