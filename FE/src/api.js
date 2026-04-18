const API_BASE_URL = 'http://localhost:8080'

function toQueryString(params) {
  const q = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, String(v))
    }
  })
  const raw = q.toString()
  return raw ? `?${raw}` : ''
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    if (res.status === 401 && path !== '/me') {
      window.dispatchEvent(new CustomEvent('app:auth-required'))
    }
    const message = body?.message || `Request failed with status ${res.status}`
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  return body?.data
}

export const api = {
  getHome(size = 8) {
    return request(`/home${toQueryString({ size })}`)
  },
  getTours(filters) {
    return request(`/tours${toQueryString(filters)}`)
  },
  getTourById(id) {
    return request(`/tours/${id}`)
  },
  getDestinations(filters) {
    return request(`/destinations${toQueryString(filters)}`)
  },
  getTopDestinations(size = 8) {
    return request(`/destinations/top${toQueryString({ size })}`)
  },
  getDestinationById(id) {
    return request(`/destinations/${id}`)
  },
  getToursByDestination(id, page = 0, size = 8) {
    return request(`/destinations/${id}/tours${toQueryString({ page, size })}`)
  },
  login(payload) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  logout() {
    return request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  getMe() {
    return request('/me')
  },
  updateProfile(payload) {
    return request('/update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  changePassword(payload) {
    return request('/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  createBooking(payload) {
    return request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  getMyBookings(page = 0, size = 10) {
    return request(`/bookings/me${toQueryString({ page, size })}`)
  },
  getMyBookingById(id) {
    return request(`/bookings/me/${id}`)
  },
  cancelBooking(id) {
    return request(`/bookings/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({}),
    })
  },
  createPayment(payload) {
    return request('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  createReview(payload) {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  getReviewsByTour(tourId, page = 0, size = 20) {
    return request(`/reviews/tour/${tourId}${toQueryString({ page, size })}`)
  },
  getMyInvoiceById(id) {
    return request(`/invoices/me/${id}`)
  },
  getDashboardSummary() {
    return request('/dashboard')
  },
  adminListUsers(page = 0, size = 20) {
    return request(`/admin/users${toQueryString({ page, size })}`)
  },
  adminGetUserById(id) {
    return request(`/admin/users/${id}`)
  },
  adminCreateUser(payload) {
    return request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  adminBlockUser(id) {
    return request(`/admin/users/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({}),
    })
  },
  adminListTours(page = 0, size = 20) {
    return request(`/admin/tours${toQueryString({ page, size })}`)
  },
  adminCreateTour(payload) {
    return request('/admin/tour', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  adminUpdateTour(id, payload) {
    return request(`/admin/tour/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  adminArchiveTour(id) {
    return request(`/admin/tour/${id}/archive`, {
      method: 'PUT',
      body: JSON.stringify({}),
    })
  },
  adminCreateDestination(payload) {
    return request('/admin/destination', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  adminUpdateDestination(id, payload) {
    return request(`/admin/destination/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
  adminConfirmCodCollected(paymentId) {
    return request(`/admin/payments/${paymentId}/confirm-cod`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  adminListPayments() {
    return request('/admin/payments')
  },
}
