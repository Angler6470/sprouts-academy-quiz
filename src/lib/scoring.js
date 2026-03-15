function normalize(text) {
  return String(text).trim().toLowerCase().replace(/[^\w\s]/g, '')
}

export function scoreQuiz(questions, userAnswers) {
  let correct = 0

  const graded = questions.map((q, index) => {
    const userAnswer = userAnswers[index] ?? ''
    const isCorrect = normalize(userAnswer) === normalize(q.answer)
    if (isCorrect) correct++

    return {
      ...q,
      userAnswer,
      isCorrect
    }
  })

  return {
    correct,
    total: questions.length,
    graded
  }
}
