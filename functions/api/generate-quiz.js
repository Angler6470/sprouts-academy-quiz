export async function onRequestPost(context) {
  try {
    const body = await context.request.json()

    const license = await context.env.LICENSES.get(body.licenseKey)

if (!license) {
  return new Response(
    JSON.stringify({ error: "Invalid license key" }),
    { status: 403 }
  )
}

const licenseData = JSON.parse(license)

if (licenseData.credits <= 0) {
  return new Response(
    JSON.stringify({
      error: "No credits remaining",
      message: "Please purchase more quiz credits."
    }),
    { status: 403 }
  )
}

    const subjects = ['Math', 'Reading', 'Science']
    const gradeBands = ['1-2', '2-3', '3-4', '4-5', '5-6']
    const difficulties = ['easy', 'medium', 'hard', 'expert']
    const questionTypes = ['multiple_choice', 'fill_in_blank']
    const counts = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]

    if (!subjects.includes(body.subject)) {
      return new Response('Invalid subject', { status: 400 })
    }

    if (!gradeBands.includes(body.gradeBand)) {
      return new Response('Invalid grade band', { status: 400 })
    }

    if (!difficulties.includes(body.difficulty)) {
      return new Response('Invalid difficulty', { status: 400 })
    }

    if (!questionTypes.includes(body.questionType)) {
      return new Response('Invalid question type', { status: 400 })
    }

    if (!counts.includes(body.count)) {
      return new Response('Invalid count', { status: 400 })
    }

    if (!Array.isArray(body.topics) || body.topics.length === 0) {
      return new Response('Invalid topics', { status: 400 })
    }

    if (body.topics.length > 10) {
      return new Response('Too many topics', { status: 400 })
    }

    for (const topic of body.topics) {
      if (typeof topic !== 'string' || topic.trim().length === 0 || topic.length > 60) {
        return new Response('Invalid topic', { status: 400 })
      }
    }

    const safeTopics = body.topics
    const topicsText = safeTopics.join(', ')
    const primaryTopic = safeTopics[0]

    const prompt = `
Create a quiz for homeschooled children.

Brand: Sprouts Academy Quiz Builder

Rules:
- Subject: ${body.subject}
- Grade band: ${body.gradeBand}
- Topics: ${topicsText}
- Primary topic: ${primaryTopic}
- Difficulty: ${body.difficulty}
- Question type: ${body.questionType}
- Number of questions: ${body.count}
- Use kid-friendly wording appropriate for the specified grade band.
- Distribute questions naturally across the listed topics when possible.
- Make every question age-appropriate.
- Avoid ambiguity.
- For multiple choice, provide exactly 4 choices and exactly 1 correct answer.
- For fill in the blank, answers should be short and clear.
- ${body.includeExplanations ? 'Include a short explanation for each answer.' : 'Use an empty explanation string.'}
- Return JSON only.

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
      "type": "multiple_choice or fill_in_blank",
      "question": "string",
      "choices": ["a", "b", "c", "d"],
      "answer": "string",
      "explanation": "string"
    }
  ]
}
`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${context.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
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
                  minItems: body.count,
                  maxItems: body.count,
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
              required: [
                'title',
                'subject',
                'gradeBand',
                'topics',
                'difficulty',
                'questionType',
                'questions'
              ]
            }
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(`OpenAI error: ${errorText}`, { status: 500 })
    }

    const data = await response.json()

    // Try the helper field first
    let outputText = data.output_text

    // Fallback: extract from output/content blocks
    if (!outputText && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) continue

        for (const contentItem of item.content) {
          if (typeof contentItem.text === 'string' && contentItem.text.trim()) {
            outputText = contentItem.text
            break
          }

          if (
            typeof contentItem.json === 'object' &&
            contentItem.json !== null
          ) {
            outputText = JSON.stringify(contentItem.json)
            break
          }
        }

        if (outputText) break
      }
    }

    if (!outputText) {
      return new Response(
        `No quiz output returned. Raw response: ${JSON.stringify(data)}`,
        { status: 500 }
      )
    }

    // Validate JSON before returning
    let parsed
    try {
      parsed = JSON.parse(outputText)
    } catch {
      return new Response(
        `Model returned non-JSON output: ${outputText}`,
        { status: 500 }
      )
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    return new Response(`Function error: ${error.message}`, { status: 500 })
  }
}
