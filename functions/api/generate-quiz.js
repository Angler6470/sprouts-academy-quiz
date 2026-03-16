import { parseQuizResponsePayload } from '../../shared/openaiResponse.js'
import { DEFAULT_OPENAI_MODEL } from '../../shared/quizConfig.js'
import { buildQuizPrompt } from '../../shared/quizPrompt.js'
import { buildQuizResponseSchema } from '../../shared/quizSchema.js'
import { validateQuizRequest } from '../../shared/quizValidation.js'

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  })
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : ''
    const licenseStore = context.env?.LICENSES

    if (!licenseStore) {
      return jsonResponse({
        error: 'License store is not configured for this environment.'
      }, 500)
    }

    const license = await licenseStore.get(licenseKey)

    if (!license) {
      return jsonResponse({ error: 'Invalid license key' }, 403)
    }

    const licenseData = JSON.parse(license)

    if (licenseData.credits <= 0) {
      return jsonResponse({
        error: 'No credits remaining',
        message: 'Please purchase more quiz credits.'
      }, 403)
    }

    const validationError = validateQuizRequest(body)

    if (validationError) {
      return jsonResponse({ error: validationError }, 400)
    }

    const prompt = buildQuizPrompt(body)

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: context.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'quiz_schema',
            schema: buildQuizResponseSchema(body.count)
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return jsonResponse({ error: `OpenAI error: ${errorText}` }, 500)
    }

    const data = await response.json()
    const parsed = parseQuizResponsePayload(data)

    licenseData.credits -= 1

    await licenseStore.put(
      licenseKey,
      JSON.stringify(licenseData)
    )

    return jsonResponse({
      quiz: parsed,
      creditsRemaining: licenseData.credits
    })
  } catch (error) {
    return jsonResponse({ error: `Function error: ${error.message}` }, 500)
  }
}
