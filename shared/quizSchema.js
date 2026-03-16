export function buildQuizResponseSchema(questionCount) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      subject: { type: 'string' },
      gradeBand: { type: 'string' },
      topics: {
        type: 'array',
        minItems: 1,
        items: { type: 'string' }
      },
      difficulty: { type: 'string' },
      questionType: { type: 'string' },
      questions: {
        type: 'array',
        minItems: questionCount,
        maxItems: questionCount,
        items: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                type: { type: 'string', const: 'multiple_choice' },
                question: { type: 'string' },
                choices: {
                  type: 'array',
                  minItems: 4,
                  maxItems: 4,
                  items: { type: 'string' }
                },
                answer: { type: 'string' },
                acceptedAnswers: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 1,
                  items: { type: 'string' }
                },
                explanation: { type: 'string' }
              },
              required: [
                'id',
                'type',
                'question',
                'choices',
                'answer',
                'acceptedAnswers',
                'explanation'
              ]
            },
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                type: { type: 'string', const: 'fill_in_blank' },
                question: { type: 'string' },
                answer: { type: 'string' },
                acceptedAnswers: {
                  type: 'array',
                  minItems: 1,
                  maxItems: 6,
                  items: { type: 'string' }
                },
                explanation: { type: 'string' }
              },
              required: ['id', 'type', 'question', 'answer', 'acceptedAnswers', 'explanation']
            }
          ]
        }
      }
    },
    required: ['title', 'subject', 'gradeBand', 'topics', 'difficulty', 'questionType', 'questions']
  }
}