import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api'
import AdminShell from '../components/AdminShell'

function formatMoney(v) {
  return `${Number(v || 0).toLocaleString('vi-VN')} đ`
}

function normalizeMonthlyItems(rawItems) {
  if (!Array.isArray(rawItems)) return []
  return rawItems.map((item) => ({
    month: item?.month || '',
    totalRevenue: Number(item?.totalRevenue || 0),
    tourRevenue: Number(item?.tourRevenue || 0),
    hotelRevenue: Number(item?.hotelRevenue || 0),
    totalBookings: Number(item?.totalBookings || 0),
    cancelledBookings: Number(item?.cancelledBookings || 0),
    tourBookings: Number(item?.tourBookings || 0),
    hotelBookings: Number(item?.hotelBookings || 0),
  }))
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="panel stack">
      <div>
        <h3>{title}</h3>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      <div className="dashboard-chart-canvas">{children}</div>
    </section>
  )
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        setError('')
        const [summaryRes, monthlyRes] = await Promise.all([
          api.getDashboardSummary(),
          api.getDashboardMonthly(12),
        ])
        if (!active) return
        setSummary(summaryRes)
        setMonthly(normalizeMonthlyItems(monthlyRes?.items))
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
  }, [])

  const hasMonthlyData = monthly.some(
    (item) =>
      item.totalRevenue > 0 ||
      item.tourRevenue > 0 ||
      item.hotelRevenue > 0 ||
      item.totalBookings > 0 ||
      item.cancelledBookings > 0 ||
      item.tourBookings > 0 ||
      item.hotelBookings > 0
  )

  return (
    <AdminShell title="Bảng điều khiển" subtitle="Tổng quan hoạt động của nền tảng đặt dịch vụ" showSidebar={false}>
      {loading ? <p>Đang tải bảng điều khiển...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error ? (
        <>
          <section className="panel stack">
            <h3>Tổng quan nhanh</h3>
            <p className="muted">
              Tổng doanh thu: <strong>{formatMoney(summary?.successfulRevenue)}</strong> | Tổng đơn đặt:{' '}
              <strong>{Number(summary?.totalBookings || 0).toLocaleString('vi-VN')}</strong>
            </p>
          </section>

          {!monthly.length || !hasMonthlyData ? (
            <section className="panel">
              <p className="muted">Chưa có dữ liệu thống kê theo tháng để vẽ biểu đồ.</p>
            </section>
          ) : (
            <>
              <ChartCard
                title="Thống kê tổng doanh thu theo tháng"
                subtitle="Tổng doanh thu đã thanh toán theo từng tháng"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalRevenue"
                      name="Tổng doanh thu"
                      stroke="#2563eb"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Thống kê doanh thu tour/khách sạn theo tháng"
              >
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Legend />
                    <Bar dataKey="tourRevenue" name="Doanh thu tour" fill="#0891b2" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="hotelRevenue" name="Doanh thu khách sạn" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Số lượng đơn đặt và đơn bị hủy theo tháng"
              >
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalBookings" name="Tổng đơn đặt" stroke="#7c3aed" strokeWidth={3} />
                    <Line type="monotone" dataKey="cancelledBookings" name="Đơn bị hủy" stroke="#dc2626" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Số lượng đơn đặt tour/khách sạn theo tháng"
              >
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tourBookings" name="Booking tour" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="hotelBookings" name="Đơn khách sạn" fill="#059669" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </>
      ) : null}
    </AdminShell>
  )
}
