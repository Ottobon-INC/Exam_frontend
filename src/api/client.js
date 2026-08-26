const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export async function request(endpoint, options = {}) {
  // If in admin dashboard/views or calling admin endpoints, prioritize admin_token
  const isAdminRequest = window.location.pathname.includes('/admin') || endpoint.includes('/publish') || endpoint.includes('/evaluation') || endpoint.includes('/bulk')
  const token = isAdminRequest
    ? (localStorage.getItem('admin_token') || localStorage.getItem('auth_token'))
    : (localStorage.getItem('candidate_token') || localStorage.getItem('auth_token') || localStorage.getItem('admin_token'))

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`
    const error = new Error(errorMessage)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
