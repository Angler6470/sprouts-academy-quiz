function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatQuizDate(value) {
  if (!value) return 'Unknown date'

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date'
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function renderQuestionChoices(question) {
  if (question.type !== 'multiple_choice' || !Array.isArray(question.choices)) {
    return '<div class="pdf-answer-line"></div>'
  }

  return `
    <ol class="pdf-choice-list" type="A">
      ${question.choices
        .map((choice) => `<li>${escapeHtml(choice)}</li>`)
        .join('')}
    </ol>
  `
}

function renderAcceptedAnswers(question) {
  if (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.length <= 1) {
    return ''
  }

  return `<p><strong>Accepted answers:</strong> ${escapeHtml(question.acceptedAnswers.join(', '))}</p>`
}

function buildExportHtml(quiz) {
  const topicLine = Array.isArray(quiz.topics) && quiz.topics.length > 0
    ? quiz.topics.join(', ')
    : 'Custom topics'

  const questionMarkup = quiz.questions.map((question, index) => `
    <article class="pdf-question">
      <div class="pdf-question-number">${index + 1}</div>
      <div class="pdf-question-body">
        <h3>${escapeHtml(question.question)}</h3>
        ${renderQuestionChoices(question)}
      </div>
    </article>
  `).join('')

  const answerMarkup = quiz.questions.map((question, index) => `
    <article class="pdf-answer-item">
      <h3>${index + 1}. ${escapeHtml(question.question)}</h3>
      <p><strong>Answer:</strong> ${escapeHtml(question.answer)}</p>
      ${renderAcceptedAnswers(question)}
      ${question.explanation ? `<p><strong>Explanation:</strong> ${escapeHtml(question.explanation)}</p>` : ''}
    </article>
  `).join('')

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(quiz.title)} PDF Export</title>
        <style>
          :root {
            color-scheme: light;
            font-family: Georgia, "Times New Roman", serif;
            line-height: 1.5;
            color: #1f2937;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f4f1ea;
            color: #1f2937;
          }

          .pdf-page {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 32px 56px;
            background: #fffdf8;
          }

          .pdf-banner {
            border: 1px solid #d6c6a8;
            background: linear-gradient(135deg, #f8ecd7 0%, #fffaf0 100%);
            border-radius: 18px;
            padding: 24px 26px;
            margin-bottom: 28px;
          }

          .pdf-kicker {
            margin: 0 0 6px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #8b5e34;
          }

          .pdf-banner h1,
          .pdf-section h2,
          .pdf-question h3,
          .pdf-answer-item h3 {
            margin: 0;
            font-weight: 700;
          }

          .pdf-banner h1 {
            font-size: 32px;
            line-height: 1.15;
            margin-bottom: 12px;
          }

          .pdf-meta,
          .pdf-submeta {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #5b6472;
          }

          .pdf-submeta {
            margin-top: 8px;
            font-size: 14px;
          }

          .pdf-student-row {
            display: grid;
            grid-template-columns: 1fr 220px;
            gap: 18px;
            margin-top: 18px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 14px;
          }

          .pdf-student-cell {
            border-bottom: 1px solid #a8b0ba;
            padding-bottom: 8px;
          }

          .pdf-section {
            margin-top: 30px;
          }

          .pdf-section h2 {
            font-size: 24px;
            margin-bottom: 16px;
          }

          .pdf-question-list,
          .pdf-answer-list {
            display: grid;
            gap: 16px;
          }

          .pdf-question,
          .pdf-answer-item {
            border: 1px solid #e6ded0;
            border-radius: 16px;
            background: #fff;
            padding: 18px 20px;
            break-inside: avoid;
          }

          .pdf-question {
            display: grid;
            grid-template-columns: 44px 1fr;
            gap: 14px;
            align-items: start;
          }

          .pdf-question-number {
            width: 44px;
            height: 44px;
            border-radius: 999px;
            background: #efe3cb;
            color: #7a5429;
            display: grid;
            place-items: center;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 700;
          }

          .pdf-question h3,
          .pdf-answer-item h3 {
            font-size: 20px;
            line-height: 1.35;
            margin-bottom: 12px;
          }

          .pdf-choice-list {
            margin: 0;
            padding-left: 24px;
          }

          .pdf-choice-list li {
            padding-left: 6px;
            margin-bottom: 8px;
          }

          .pdf-answer-line {
            margin-top: 20px;
            border-bottom: 1px solid #b5bcc6;
            height: 22px;
          }

          .pdf-answer-item p {
            margin: 10px 0 0;
            font-size: 16px;
          }

          .pdf-page-break {
            page-break-before: always;
            break-before: page;
          }

          @media print {
            body {
              background: #fff;
            }

            .pdf-page {
              max-width: none;
              padding: 0;
              background: #fff;
            }

            @page {
              margin: 0.6in;
              size: auto;
            }
          }
        </style>
      </head>
      <body>
        <main class="pdf-page">
          <header class="pdf-banner">
            <p class="pdf-kicker">Sprouts Academy Worksheet Export</p>
            <h1>${escapeHtml(quiz.title)}</h1>
            <p class="pdf-meta">${escapeHtml(quiz.subject)} • Grades ${escapeHtml(quiz.gradeBand)} • ${escapeHtml(quiz.difficulty)} difficulty</p>
            <p class="pdf-submeta">Topics: ${escapeHtml(topicLine)} • Generated ${escapeHtml(formatQuizDate(quiz.savedAt || quiz.updatedAt))}</p>

            <div class="pdf-student-row">
              <div class="pdf-student-cell">Name</div>
              <div class="pdf-student-cell">Date</div>
            </div>
          </header>

          <section class="pdf-section">
            <h2>Questions</h2>
            <div class="pdf-question-list">${questionMarkup}</div>
          </section>

          <section class="pdf-section pdf-page-break">
            <h2>Answer Key and Explanations</h2>
            <div class="pdf-answer-list">${answerMarkup}</div>
          </section>
        </main>
      </body>
    </html>
  `
}

export function exportQuizToPdf(quiz) {
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('Generate or load a quiz before exporting a PDF.')
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=1080')

  if (!printWindow) {
    throw new Error('Unable to open the PDF export window. Please allow pop-ups for this site.')
  }

  printWindow.document.open()
  printWindow.document.write(buildExportHtml(quiz))
  printWindow.document.close()

  const handlePrint = () => {
    printWindow.focus()
    printWindow.print()
  }

  if (printWindow.document.readyState === 'complete') {
    setTimeout(handlePrint, 150)
    return
  }

  printWindow.addEventListener('load', () => {
    setTimeout(handlePrint, 150)
  }, { once: true })
}