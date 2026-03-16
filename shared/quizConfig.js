export const SUBJECTS = ['Math', 'Reading', 'Science']
export const GRADE_BANDS = ['1-2', '2-3', '3-4', '4-5', '5-6']
export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert']
export const QUESTION_TYPES = ['multiple_choice', 'fill_in_blank']
export const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'

export function isMultipleChoice(questionType) {
  return questionType === 'multiple_choice'
}

export function isFillInBlank(questionType) {
  return questionType === 'fill_in_blank'
}

export function getPrimaryTopic(topics) {
  return Array.isArray(topics) && topics.length > 0 ? topics[0] : 'Practice'
}