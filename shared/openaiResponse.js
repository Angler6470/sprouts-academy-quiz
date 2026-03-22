export function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim()
  }

  if (!Array.isArray(data?.output)) {
    return null
  }

  for (const item of data.output) {
    if (!Array.isArray(item?.content)) continue

    for (const contentItem of item.content) {
      if (typeof contentItem?.text === 'string' && contentItem.text.trim()) {
        return contentItem.text.trim()
      }

      if (contentItem?.json && typeof contentItem.json === 'object') {
        return JSON.stringify(contentItem.json)
      }
    }
  }

  return null
}

function normalize(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function hashSeed(value) {
  let hash = 0

  for (const char of value) {
    hash = ((hash << 5) - hash) + char.charCodeAt(0)
    hash |= 0
  }

  return Math.abs(hash)
}

function moveItem(array, fromIndex, toIndex) {
  if (fromIndex === toIndex) {
    return array.slice()
  }

  const next = array.slice()
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

function assortMultipleChoiceAnswers(quiz) {
  if (!quiz || !Array.isArray(quiz.questions)) {
    return quiz
  }

  const seedSource = [quiz.title, quiz.subject, ...(quiz.topics || [])].join('|')
  const multipleChoiceQuestions = quiz.questions.filter((question) => question?.type === 'multiple_choice')

  if (multipleChoiceQuestions.length < 2) {
    return quiz
  }

  const startingIndex = hashSeed(seedSource) % 4
  let multipleChoiceIndex = 0

  const questions = quiz.questions.map((question) => {
    if (question?.type !== 'multiple_choice' || !Array.isArray(question.choices) || question.choices.length !== 4) {
      return question
    }

    const currentIndex = question.choices.findIndex((choice) => normalize(choice) === normalize(question.answer))

    if (currentIndex === -1) {
      multipleChoiceIndex += 1
      return question
    }

    const targetIndex = (startingIndex + multipleChoiceIndex) % question.choices.length
    multipleChoiceIndex += 1

    if (currentIndex === targetIndex) {
      return {
        ...question,
        acceptedAnswers: [question.answer]
      }
    }

    return {
      ...question,
      choices: moveItem(question.choices, currentIndex, targetIndex),
      acceptedAnswers: [question.answer]
    }
  })

  return {
    ...quiz,
    questions
  }
}

export function parseQuizResponsePayload(data) {
  const outputText = extractOutputText(data)

  if (!outputText) {
    throw new Error(`No quiz output returned. Raw response: ${JSON.stringify(data)}`)
  }

  try {
    return assortMultipleChoiceAnswers(JSON.parse(outputText))
  } catch {
    throw new Error(`Model returned non-JSON output: ${outputText}`)
  }
}