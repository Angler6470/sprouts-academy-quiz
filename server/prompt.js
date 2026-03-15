export function buildPrompt({
  subject,
  gradeBand,
  topics,
  difficulty,
  questionType,
  count,
  includeExplanations
}) {
  const topicsText = Array.isArray(topics) ? topics.join(', ') : String(topics || '')

  return `
Create a quiz for homeschooled children.

Brand: Sprouts Academy Quiz Builder

Rules:
- Subject: ${subject}
- Grade band: ${gradeBand}
- Topics: ${topicsText}
- Difficulty: ${difficulty}
- Question type: ${questionType}
- Number of questions: ${count}
- Use kid-friendly wording appropriate for the specified grade band.
- Distribute questions naturally across the listed topics.
- Avoid ambiguity.
- For multiple choice, provide exactly 4 choices and exactly 1 correct answer.
- For fill in the blank, answers should be short and clear.
- ${includeExplanations ? 'Include a short explanation for each answer.' : 'Use an empty explanation string.'}
- Return JSON only.

Title rules:
- The quiz title MUST follow this format:
  "Sprouts Academy <Subject> Quiz: <Primary Topic>"
- Example titles:
  "Sprouts Academy Math Quiz: Multiplication"
  "Sprouts Academy Reading Quiz: Vocabulary"
  "Sprouts Academy Science Quiz: Weather"

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
      "type": "multiple_choice or fill_in_blank",
      "question": "string",
      "choices": ["a", "b", "c", "d"],
      "answer": "string",
      "explanation": "string"
    }
  ]
}
`
}
