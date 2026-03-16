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

export function parseQuizResponsePayload(data) {
  const outputText = extractOutputText(data)

  if (!outputText) {
    throw new Error(`No quiz output returned. Raw response: ${JSON.stringify(data)}`)
  }

  try {
    return JSON.parse(outputText)
  } catch {
    throw new Error(`Model returned non-JSON output: ${outputText}`)
  }
}