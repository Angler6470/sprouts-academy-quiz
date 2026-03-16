import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import { parseQuizResponsePayload } from '../shared/openaiResponse.js'
import { DEFAULT_OPENAI_MODEL } from '../shared/quizConfig.js'
import { buildQuizPrompt } from '../shared/quizPrompt.js'
import { buildQuizResponseSchema } from '../shared/quizSchema.js'
import { validateQuizRequest } from '../shared/quizValidation.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001
const localLicenses = new Map()

const defaultLicenseKey = process.env.DEV_LICENSE_KEY || 'sprouts-local-dev'
const defaultCredits = Number(process.env.DEV_LICENSE_CREDITS || 500)

localLicenses.set(defaultLicenseKey, Number.isFinite(defaultCredits) ? defaultCredits : 500)

app.use(cors())
app.use(express.json())

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

function getLocalCredits(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return null
  }

  return localLicenses.has(licenseKey) ? localLicenses.get(licenseKey) : null
}

app.get('/', (req, res) => {
  res.send('Quiz server is running')
})

app.get('/api/dev-license', (req, res) => {
  res.json({
    devLicenseKey: defaultLicenseKey,
    creditsRemaining: getLocalCredits(defaultLicenseKey)
  })
})

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const error = validateQuizRequest(req.body)
    if (error) {
      return res.status(400).json({ error })
    }

    const licenseKey = typeof req.body.licenseKey === 'string' ? req.body.licenseKey.trim() : ''
    const credits = getLocalCredits(licenseKey)

    if (!licenseKey || credits === null) {
      return res.status(403).json({ error: 'Invalid license key' })
    }

    if (credits <= 0) {
      return res.status(403).json({
        error: 'No credits remaining',
        message: 'Please purchase more quiz credits.'
      })
    }

    const prompt = buildQuizPrompt(req.body)

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      input: prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'quiz_schema',
          schema: buildQuizResponseSchema(req.body.count)
        }
      }
    })

    const quiz = parseQuizResponsePayload(response)
    const nextCredits = credits - 1

    localLicenses.set(licenseKey, nextCredits)

    res.json({
      quiz,
      creditsRemaining: nextCredits
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err.message || 'Failed to generate quiz'
    })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
