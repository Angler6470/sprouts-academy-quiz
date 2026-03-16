import { getPrimaryTopic, isFillInBlank } from './quizConfig.js'
import { sanitizeTopics } from './quizValidation.js'

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
  const answerInstruction = isFillInBlank(questionType)
    ? 'For each fill-in-the-blank question, provide 1 to 6 acceptedAnswers that include equivalent valid responses when they are truly interchangeable, such as numerals and number words.'
    : 'For each multiple-choice question, set acceptedAnswers to an array containing only the one correct answer.'

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
- Distribute questions naturally across the listed topics when possible.
- Make every question age-appropriate and classroom-safe.
- Avoid ambiguity and trick wording.
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
      "answer": "string",
      "acceptedAnswers": ["string", "string"],
      "explanation": "string"
    }
  ]
}
`
}