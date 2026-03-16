import {
  DIFFICULTIES,
  GRADE_BANDS,
  QUESTION_COUNTS,
  QUESTION_TYPES,
  SUBJECTS
} from './quizConfig.js'

export function validateQuizRequest(body) {
  if (!body || typeof body !== 'object') return 'Invalid request body'
  if (!SUBJECTS.includes(body.subject)) return 'Invalid subject'
  if (!GRADE_BANDS.includes(body.gradeBand)) return 'Invalid grade band'
  if (!DIFFICULTIES.includes(body.difficulty)) return 'Invalid difficulty'
  if (!QUESTION_TYPES.includes(body.questionType)) return 'Invalid question type'
  if (!QUESTION_COUNTS.includes(body.count)) return 'Invalid count'
  if (typeof body.includeExplanations !== 'boolean') return 'Invalid explanation setting'
  if (!Array.isArray(body.topics) || body.topics.length === 0) return 'Invalid topics'
  if (body.topics.length > 10) return 'Too many topics'

  for (const topic of body.topics) {
    if (typeof topic !== 'string' || topic.trim().length === 0 || topic.trim().length > 60) {
      return 'Invalid topic'
    }
  }

  return null
}

export function sanitizeTopics(topics) {
  return topics.map((topic) => topic.trim())
}