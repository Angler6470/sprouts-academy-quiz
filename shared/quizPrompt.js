import { getPrimaryTopic, isFillInBlank } from './quizConfig.js'
import { sanitizeTopics } from './quizValidation.js'

const GRADE_GUIDANCE = {
  '1-2':
    'Use very short sentences, early elementary vocabulary, direct instructions, concrete examples, and single-step reasoning.',
  '2-3':
    'Use short, clear sentences, familiar vocabulary, straightforward examples, and mostly single-step reasoning with light recall.',
  '3-4':
    'Use clear elementary wording, grade-level vocabulary, practical examples, and mostly one-step reasoning with occasional light multi-step thinking.',
  '4-5':
    'Use upper-elementary wording, slightly richer vocabulary, and moderate reasoning that stays clearly within grade-level expectations.',
  '5-6':
    'Use strong upper-elementary wording, precise academic vocabulary, and more involved reasoning while staying accessible for independent work.'
}

const DIFFICULTY_GUIDANCE = {
  easy:
    'Keep every question on the easier end of the grade band, prioritize direct recall or obvious one-step reasoning, and avoid traps.',
  medium:
    'Keep every question squarely on grade level with standard classroom complexity and no unusual twists.',
  hard:
    'Keep every question at the upper end of the grade band with more careful reading, stronger distractors, or multi-step reasoning when appropriate.',
  expert:
    'Keep every question at the most challenging end of the grade band, but do not exceed the stated grade band or introduce middle-school content.'
}

export function buildQuizPrompt({
  subject,
  gradeBand,
  topics,
  difficulty,
  questionType,
  count,
  includeExplanations
}) {
  const safeTopics = sanitizeTopics(topics)
  const topicsText = safeTopics.join(', ')
  const primaryTopic = getPrimaryTopic(safeTopics)
  const gradeGuidance = GRADE_GUIDANCE[gradeBand] || GRADE_GUIDANCE['3-4']
  const difficultyGuidance = DIFFICULTY_GUIDANCE[difficulty] || DIFFICULTY_GUIDANCE.medium
  const answerInstruction = isFillInBlank(questionType)
    ? 'For each fill-in-the-blank question, set choices to an empty array and provide 1 to 6 acceptedAnswers that include equivalent valid responses when they are truly interchangeable, such as numerals and number words.'
    : 'For each multiple-choice question, provide exactly 4 choices and set acceptedAnswers to an array containing only the one correct answer.'

  return `
Create a quiz worksheet for homeschooled children.

Brand: Sprouts Academy Quiz Builder

Rules:
- Subject: ${subject}
- Grade band: ${gradeBand}
- Topics: ${topicsText}
- Primary topic: ${primaryTopic}
- Difficulty: ${difficulty}
- Question type: ${questionType}
- Number of questions: ${count}
- Use kid-friendly wording appropriate for the specified grade band.
- Grade-level guidance: ${gradeGuidance}
- Difficulty guidance: ${difficultyGuidance}
- Distribute questions naturally across the listed topics when possible.
- Make every question age-appropriate and classroom-safe.
- Avoid ambiguity and trick wording.
- Keep the entire quiz internally consistent so all questions match the same grade band and difficulty target.
- Do not mix easier and harder levels in the same quiz.
- Never exceed the stated grade band, even when difficulty is hard or expert.
- For multiple choice, provide exactly 4 distinct choices and exactly 1 correct answer.
- For fill in the blank, answers should be short, clear, and easy to print.
- ${answerInstruction}
- ${includeExplanations ? 'Include a short explanation for each answer.' : 'Use an empty explanation string.'}
- Return JSON only. No markdown, no prose before or after the JSON.

Title rules:
- The quiz title MUST use the FIRST topic in the provided topics list as the primary topic.
- The quiz title MUST follow this exact format:
  "Sprouts Academy <Subject> Quiz: <First Topic>"

Return JSON in this exact shape:
{
  "title": "string",
  "subject": "string",
  "gradeBand": "string",
  "topics": ["string"],
  "difficulty": "string",
  "questionType": "string",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "string",
      "choices": ["a", "b", "c", "d"],
      "answer": "string",
      "acceptedAnswers": ["string"],
      "explanation": "string"
    },
    {
      "id": "q2",
      "type": "fill_in_blank",
      "question": "string",
      "choices": [],
      "answer": "string",
      "acceptedAnswers": ["string", "string"],
      "explanation": "string"
    }
  ]
}
`
}