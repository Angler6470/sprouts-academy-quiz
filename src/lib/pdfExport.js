import html2pdf from 'html2pdf.js'

const PDF_OPTIONS = {
  margin: [28, 28, 28, 28],
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollY: 0
  },
  jsPDF: {
    unit: 'pt',
    format: 'letter',
    orientation: 'portrait'
  },
  pagebreak: { mode: ['css', 'legacy'] }
}

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

function buildFileName(title) {
  const sanitized = String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${sanitized || 'worksheet'}.pdf`
}

function buildExportMarkup(quiz) {
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

      .pdf-page {
        width: 760px;
        margin: 0 auto;
        padding: 40px 32px 56px;
        background: #fffdf8;
        color: #1f2937;
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
        break-before: page;
        page-break-before: always;
      }
    </style>
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
  `
}

function createExportContainer(markup) {
  const container = document.createElement('div')
  container.setAttribute('aria-hidden', 'true')
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '0'
  container.style.width = '820px'
  container.style.pointerEvents = 'none'
  container.style.opacity = '0'
  container.innerHTML = markup
  document.body.appendChild(container)
  return container
}

async function renderPdfBlob(container, fileName) {
  const worker = html2pdf().set({
    ...PDF_OPTIONS,
    filename: fileName
  }).from(container)

  const pdf = await worker.toPdf().get('pdf')
  return pdf.output('blob')
}

function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

export async function exportQuizToPdf(quiz) {
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('Generate or load a quiz before exporting a PDF.')
  }

  const fileName = buildFileName(quiz.title)
  const container = createExportContainer(buildExportMarkup(quiz))

  try {
    const pdfBlob = await renderPdfBlob(container, fileName)
    downloadPdfBlob(pdfBlob, fileName)
    return fileName
  } finally {
    container.remove()
  }
}