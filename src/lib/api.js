export async function generateQuiz(payload) {
  const response = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const responseBody = isJson ? await response.json().catch(() => null) : await response.text()

  if (!response.ok) {
    if (typeof responseBody === 'string') {
      throw new Error(responseBody || 'Failed to generate quiz')
    }

    throw new Error(
      responseBody?.message || responseBody?.error || 'Failed to generate quiz'
    )
  }

  return responseBody
}
