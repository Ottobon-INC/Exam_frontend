import { request } from './client'

export const authService = {
  login: (email, password, portal = 'CANDIDATE') =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, portal }),
    }),
  register: (name, email, password, role) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }), getMe: () => request('/auth/me'),
}

export const examService = {
  getExams: (status) => {
    const query = status ? `?status=${status}` : ''
    return request(`/exams${query}`)
  },
  getExam: (id) => request(`/exams/${id}`),
  createExam: (data) =>
    request('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExam: (id, data) =>
    request(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

export const sectionService = {
  getSections: (examId) => request(`/sections?examId=${examId}`),
  createSection: (data) =>
    request('/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSection: (id, data) =>
    request(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSection: (id) =>
    request(`/sections/${id}`, {
      method: 'DELETE',
    }),
  reorderSections: (sections) =>
    request('/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ sections }),
    }),
}

export const questionService = {
  getQuestions: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.subject) params.append('subject', filters.subject)
    if (filters.type) params.append('type', filters.type)
    if (filters.difficulty) params.append('difficulty', filters.difficulty)
    if (filters.examId) params.append('examId', filters.examId)
    if (filters.sectionId) params.append('sectionId', filters.sectionId)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return request(`/questions${queryString}`)
  },
  createQuestion: (data) =>
    request('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkCreate: (examId, questions, sectionId) =>
    request('/questions/bulk', {
      method: 'POST',
      body: JSON.stringify({ examId, sectionId, questions }),
    }),
  updateQuestion: (id, data) =>
    request(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteQuestion: (id) =>
    request(`/questions/${id}`, {
      method: 'DELETE',
    }),
}

export const attemptService = {
  startAttempt: (examId) =>
    request('/attempts/start', {
      method: 'POST',
      body: JSON.stringify({ examId }),
    }),
  saveAnswer: (attemptId, questionId, selectedOption, textAnswer) =>
    request('/attempts/answer', {
      method: 'POST',
      body: JSON.stringify({ attemptId, questionId, selectedOption, textAnswer }),
    }),
  submitAttempt: (attemptId) =>
    request('/attempts/submit', {
      method: 'POST',
      body: JSON.stringify({ attemptId }),
    }),
}

export const evaluationService = {
  getPendingEvaluations: () => request('/evaluation/pending'),
  submitEvaluation: (answerId, scoreAwarded, remarks) =>
    request('/evaluation/submit', {
      method: 'POST',
      body: JSON.stringify({ answerId, scoreAwarded, remarks }),
    }),
  releaseCandidateResult: (attemptId) =>
    request(`/evaluation/release/${attemptId}`, {
      method: 'POST',
    }),
}

export const resultService = {
  getResults: (examId) => request(`/results/${examId}`),
  togglePublish: (examId, publish) =>
    request(`/results/${examId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ publish }),
    }),
}

export const slotService = {
  getSlots: (examId) => request(`/slots/exams/${examId}/slots`),
  createSlot: (examId, data) =>
    request(`/slots/exams/${examId}/slots`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSlot: (examId, slotId) =>
    request(`/slots/exams/${examId}/slots/${slotId}`, {
      method: 'DELETE',
    }),
  assignCandidates: (examId, candidates) =>
    request(`/slots/exams/${examId}/assign-candidates`, {
      method: 'POST',
      body: JSON.stringify({ candidates }),
    }),
  getAssignedStudents: (examId) => request(`/slots/exams/${examId}/assigned-students`),
  removeAssignedCandidate: (examId, candidateId) =>
    request(`/slots/exams/${examId}/assigned-students/${candidateId}`, {
      method: 'DELETE',
    }),
  getCandidateAssignedExams: () => request('/slots/candidate/assigned-exams'),
  bookSlot: (examId, slotId) =>
    request(`/slots/exams/${examId}/book-slot`, {
      method: 'POST',
      body: JSON.stringify({ slotId }),
    }),
  getMyBooking: (examId) => request(`/slots/exams/${examId}/my-booking`),
}
