export async function generateQuiz(payload) {
  const response = await fetch('http://localhost:3001/api/generate-quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to generate quiz')
  }

  return response.json()
}
