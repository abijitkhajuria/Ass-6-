/**
 * Thin fetch wrapper around the Spring Boot API.
 *
 * Requests go to /api/... and Vite proxies them to localhost:8080 in dev.
 * Set VITE_API_BASE_URL to point at a backend on another origin.
 *
 * Every non-2xx response is turned into an ApiError carrying the readable
 * message the backend produced, which the caller shows as a toast.
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors ?? []
  }
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE}/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError(
      'Could not reach the server. Is the Spring Boot backend running on port 8080?',
      0,
    )
  }

  if (response.status === 204) return null

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload?.fieldErrors)
  }

  return payload
}

const json = (body) => JSON.stringify(body)

export const api = {
  // --- students -------------------------------------------------------
  listStudents: () => request('/students'),
  listStudentSummaries: () => request('/students/summaries'),
  listDivisions: () => request('/students/divisions'),
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (body) => request('/students', { method: 'POST', body: json(body) }),
  updateStudent: (id, body) => request(`/students/${id}`, { method: 'PUT', body: json(body) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  // --- subjects -------------------------------------------------------
  listSubjects: () => request('/subjects'),
  createSubject: (body) => request('/subjects', { method: 'POST', body: json(body) }),
  updateSubject: (id, body) => request(`/subjects/${id}`, { method: 'PUT', body: json(body) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),

  // --- marks ----------------------------------------------------------
  listMarks: (studentId) =>
    request(studentId ? `/marks?studentId=${studentId}` : '/marks'),
  createMark: (body) => request('/marks', { method: 'POST', body: json(body) }),
  updateMark: (id, body) => request(`/marks/${id}`, { method: 'PUT', body: json(body) }),
  deleteMark: (id) => request(`/marks/${id}`, { method: 'DELETE' }),
  saveMarksForStudent: (studentId, entries) =>
    request(`/marks/student/${studentId}`, { method: 'PUT', body: json({ entries }) }),

  // --- results & analytics -------------------------------------------
  getResult: (prn) => request(`/results/${encodeURIComponent(prn)}`),
  getAnalytics: () => request('/analytics/summary'),

  // The grading bands, served as data so the entry screen can preview
  // totals and SGPA without reimplementing the rules in JavaScript.
  getGradingScale: () => request('/grading/scale'),
}
