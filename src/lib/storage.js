const KEY = 'saved_quizzes'

export function saveQuiz(quiz) {
  const existing = JSON.parse(localStorage.getItem(KEY) || '[]')
  const updated = [quiz, ...existing].slice(0, 5)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function getSavedQuizzes() {
  return JSON.parse(localStorage.getItem(KEY) || '[]')
}
