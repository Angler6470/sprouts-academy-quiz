const NUMBER_WORDS = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
  thirteen: '13',
  fourteen: '14',
  fifteen: '15',
  sixteen: '16',
  seventeen: '17',
  eighteen: '18',
  nineteen: '19',
  twenty: '20'
}

const DIGIT_WORDS = Object.fromEntries(
  Object.entries(NUMBER_WORDS).map(([word, digit]) => [digit, word])
)

const FRACTION_ALIASES = {
  '1/2': ['one half', 'a half', 'half'],
  '1/3': ['one third', 'a third'],
  '1/4': ['one fourth', 'a fourth', 'one quarter', 'a quarter'],
  '3/4': ['three fourths', 'three quarters']
}

function normalize(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9/\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
}

function expandEquivalentAnswers(answer) {
  const normalized = normalize(answer)
  const variants = new Set()

  if (!normalized) {
    return variants
  }

  variants.add(normalized)

  if (DIGIT_WORDS[normalized]) {
    variants.add(DIGIT_WORDS[normalized])
  }

  if (NUMBER_WORDS[normalized]) {
    variants.add(NUMBER_WORDS[normalized])
  }

  if (FRACTION_ALIASES[normalized]) {
    for (const alias of FRACTION_ALIASES[normalized]) {
      variants.add(normalize(alias))
    }
  }

  for (const [fraction, aliases] of Object.entries(FRACTION_ALIASES)) {
    if (aliases.includes(normalized)) {
      variants.add(normalize(fraction))
    }
  }

  return variants
}

function getAcceptedAnswers(question) {
  const rawAnswers = Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0
    ? question.acceptedAnswers
    : [question.answer]

  const accepted = new Set()

  for (const answer of rawAnswers) {
    for (const variant of expandEquivalentAnswers(answer)) {
      accepted.add(variant)
    }
  }

  return accepted
}

function isAnswerCorrect(question, userAnswer) {
  const normalizedUserAnswer = normalize(userAnswer)

  if (!normalizedUserAnswer) {
    return false
  }

  if (question.type === 'multiple_choice') {
    return normalizedUserAnswer === normalize(question.answer)
  }

  return getAcceptedAnswers(question).has(normalizedUserAnswer)
}

export function scoreQuiz(questions, userAnswers) {
  let correct = 0

  const graded = questions.map((question, index) => {
    const userAnswer = userAnswers[index] ?? ''
    const isCorrect = isAnswerCorrect(question, userAnswer)

    if (isCorrect) {
      correct += 1
    }

    return {
      ...question,
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
