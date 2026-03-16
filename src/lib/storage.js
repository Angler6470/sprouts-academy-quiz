const KEY = 'saved_quizzes'
const MAX_SAVED_QUIZZES = 10

function readSavedQuizzes() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function writeSavedQuizzes(quizzes) {
  localStorage.setItem(KEY, JSON.stringify(quizzes))
}

function createSavedId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function deriveTopicSummary(quiz) {
  return Array.isArray(quiz.topics) ? quiz.topics.join(', ') : ''
}

function normalizeSavedQuiz(quiz) {
  const now = new Date().toISOString()
  const questions = Array.isArray(quiz.questions) ? quiz.questions : []

  return {
    ...quiz,
    savedId: quiz.savedId || createSavedId(),
    savedAt: quiz.savedAt || now,
    updatedAt: now,
    questionCount: typeof quiz.questionCount === 'number' ? quiz.questionCount : questions.length,
    topicSummary: quiz.topicSummary || deriveTopicSummary(quiz),
    customTitle: typeof quiz.customTitle === 'string' ? quiz.customTitle.trim() : ''
  }
}

export function saveQuiz(quiz) {
  const record = normalizeSavedQuiz(quiz)
  const existing = readSavedQuizzes().filter((item) => item.savedId !== record.savedId)
  const updated = [record, ...existing]
    .sort((left, right) => Date.parse(right.updatedAt || right.savedAt || 0) - Date.parse(left.updatedAt || left.savedAt || 0))
    .slice(0, MAX_SAVED_QUIZZES)

  writeSavedQuizzes(updated)
  return record
}

export function getSavedQuizzes() {
  return readSavedQuizzes().sort(
    (left, right) => Date.parse(right.updatedAt || right.savedAt || 0) - Date.parse(left.updatedAt || left.savedAt || 0)
  )
}

export function updateSavedQuiz(savedId, updates) {
  let updatedRecord = null

  const updated = readSavedQuizzes().map((quiz) => {
    if (quiz.savedId !== savedId) {
      return quiz
    }

    updatedRecord = normalizeSavedQuiz({
      ...quiz,
      ...updates,
      savedId: quiz.savedId,
      savedAt: quiz.savedAt
    })

    return updatedRecord
  })

  writeSavedQuizzes(updated)
  return updatedRecord
}

export function renameSavedQuiz(savedId, customTitle) {
  return updateSavedQuiz(savedId, { customTitle })
}

export function deleteSavedQuiz(savedId) {
  const updated = readSavedQuizzes().filter((quiz) => quiz.savedId !== savedId)
  writeSavedQuizzes(updated)
}
