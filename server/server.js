import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import { buildPrompt } from './prompt.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

function validateInput(body) {
  const subjects = ['Math', 'Reading', 'Science']
  const gradeBands = ['1-2', '2-3', '3-4', '4-5', '5-6']
  const difficulties = ['easy', 'medium', 'hard', 'expert']
  const questionTypes = ['multiple_choice', 'fill_in_blank']
  const counts = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]

  if (!subjects.includes(body.subject)) return 'Invalid subject'
  if (!gradeBands.includes(body.gradeBand)) return 'Invalid grade band'
  if (!difficulties.includes(body.difficulty)) return 'Invalid difficulty'
  if (!questionTypes.includes(body.questionType)) return 'Invalid question type'
  if (!counts.includes(body.count)) return 'Invalid count'
  if (!Array.isArray(body.topics) || body.topics.length === 0) return 'Invalid topics'
  if (body.topics.length > 10) return 'Too many topics'

  for (const topic of body.topics) {
    if (typeof topic !== 'string' || topic.trim().length === 0 || topic.length > 60) {
      return 'Invalid topic'
    }
  }

  return null
}

app.get('/', (req, res) => {
  res.send('Quiz server is running')
})

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const error = validateInput(req.body)
    if (error) {
      return res.status(400).send(error)
    }

    const prompt = buildPrompt(req.body)

    const response = await client.responses.create({
      model: 'gpt-5.4',
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'quiz_schema',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              subject: { type: 'string' },
              gradeBand: { type: 'string' },
              topics: {
                type: 'array',
                items: { type: 'string' }
              },
              difficulty: { type: 'string' },
              questionType: { type: 'string' },
              questions: {
                type: 'array',
                minItems: req.body.count,
                maxItems: req.body.count,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    question: { type: 'string' },
                    choices: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    answer: { type: 'string' },
                    explanation: { type: 'string' }
                  },
                  required: ['id', 'type', 'question', 'choices', 'answer', 'explanation']
                }
              }
            },
            required: ['title', 'subject', 'gradeBand', 'topics', 'difficulty', 'questionType', 'questions']
          }
        }
      }
    })

    const text = response.output_text
    const quiz = JSON.parse(text)

    res.json(quiz)
  } catch (err) {
    console.error(err)
    res.status(500).send('Failed to generate quiz')
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
