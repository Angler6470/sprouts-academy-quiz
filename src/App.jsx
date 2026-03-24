import { useEffect, useMemo, useRef, useState } from 'react'
import sproutLogo from './assets/hero.png'
import QuizForm from './components/QuizForm.jsx'
import QuestionCard from './components/QuestionCard.jsx'
import ResultsCard from './components/ResultsCard.jsx'
import { generateQuiz } from './lib/api.js'
import { exportQuizToPdf } from './lib/pdfExport.js'
import {
  deleteSavedQuiz,
  getSavedQuizzes,
  renameSavedQuiz,
  saveQuiz
} from './lib/storage.js'
import { scoreQuiz } from './lib/scoring.js'

const ETSY_CREDITS_URL =
  'https://www.etsy.com/listing/4472218117/interactive-quiz-builder-for-kids'

function getSubjectTheme(subject) {
  switch (subject) {
    case 'Reading':
      return 'theme-reading'
    case 'Science':
      return 'theme-science'
    case 'Math':
    default:
      return 'theme-math'
  }
}

function getStoredCredits() {
  const raw = localStorage.getItem('sproutsCreditsRemaining')
  if (raw === null) return null

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function buildQuestionDraft(question, index) {
  return {
    ...question,
    id: question.id || `q${index + 1}`,
    choices: Array.isArray(question.choices) ? question.choices : [],
    acceptedAnswers:
      Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0
        ? question.acceptedAnswers
        : [question.answer].filter(Boolean)
  }
}

function normalizeQuizForClient(quiz) {
  if (!quiz) {
    return null
  }

  return {
    ...quiz,
    title: quiz.title || 'Untitled Quiz',
    topics: Array.isArray(quiz.topics) ? quiz.topics : [],
    questions: Array.isArray(quiz.questions)
      ? quiz.questions.map((question, index) => buildQuestionDraft(question, index))
      : []
  }
}

function formatSavedDate(value) {
  if (!value) return 'Unknown date'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown date'

  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getSavedTitle(savedQuiz) {
  return savedQuiz.customTitle || savedQuiz.title
}

const EXPORT_UNLOCK_TIMEOUT_MS = 2000

export default function App() {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(getSavedQuizzes())
  const [printMode, setPrintMode] = useState('quiz')
  const [showBuilder, setShowBuilder] = useState(true)
  const [showSaved, setShowSaved] = useState(false)
  const [notice, setNotice] = useState(null)
  const [isEditingQuiz, setIsEditingQuiz] = useState(false)
  const [savedRenameId, setSavedRenameId] = useState(null)
  const [savedRenameValue, setSavedRenameValue] = useState('')
  const [pdfToolsUnlocked, setPdfToolsUnlocked] = useState(false)

  const [licenseKey, setLicenseKey] = useState(
    localStorage.getItem('sproutsLicenseKey') || ''
  )
  const [creditsRemaining, setCreditsRemaining] = useState(getStoredCredits())
  const [licenseSaved, setLicenseSaved] = useState(
    Boolean(localStorage.getItem('sproutsLicenseKey'))
  )
  const [showLicensePopup, setShowLicensePopup] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.innerWidth > 768
  })

  const quizTopRef = useRef(null)
  const questionRefs = useRef([])
  const exportUnlockRef = useRef({ awaitingP: false, timeoutId: null })

  useEffect(() => {
    document.body.dataset.printMode = printMode
    return () => {
      delete document.body.dataset.printMode
    }
  }, [printMode])

  useEffect(() => {
    if (licenseKey.trim()) {
      localStorage.setItem('sproutsLicenseKey', licenseKey)
    } else {
      localStorage.removeItem('sproutsLicenseKey')
    }
  }, [licenseKey])

  useEffect(() => {
    if (typeof creditsRemaining === 'number') {
      localStorage.setItem('sproutsCreditsRemaining', String(creditsRemaining))
    } else {
      localStorage.removeItem('sproutsCreditsRemaining')
    }
  }, [creditsRemaining])

  useEffect(() => {
    function clearExportUnlockTimer() {
      if (exportUnlockRef.current.timeoutId) {
        window.clearTimeout(exportUnlockRef.current.timeoutId)
      }

      exportUnlockRef.current.awaitingP = false
      exportUnlockRef.current.timeoutId = null
    }

    function handleKeyDown(event) {
      const key = event.key.toLowerCase()

      if (event.altKey && key === 'x') {
        clearExportUnlockTimer()
        exportUnlockRef.current.awaitingP = true
        exportUnlockRef.current.timeoutId = window.setTimeout(() => {
          clearExportUnlockTimer()
        }, EXPORT_UNLOCK_TIMEOUT_MS)
        return
      }

      if (exportUnlockRef.current.awaitingP && event.altKey && key === 'p') {
        clearExportUnlockTimer()
        setPdfToolsUnlocked((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearExportUnlockTimer()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function syncSavedQuizzes() {
    setSaved(getSavedQuizzes())
  }

  function showNotice(type, message) {
    setNotice({ type, message })
  }

  function persistQuiz(quizToPersist, successMessage) {
    const savedQuiz = saveQuiz(normalizeQuizForClient(quizToPersist))
    setQuiz(savedQuiz)
    syncSavedQuizzes()

    if (successMessage) {
      showNotice('success', successMessage)
    }

    return savedQuiz
  }

  async function handleGenerate(formData) {
    const trimmedLicenseKey = licenseKey.trim()

    if (!trimmedLicenseKey) {
      showNotice('error', 'Please enter and activate your license key first.')
      return
    }

    if (typeof creditsRemaining === 'number' && creditsRemaining <= 0) {
      showNotice('error', 'You are out of credits. Purchase more credits to continue.')
      return
    }

    setLoading(true)
    setResults(null)
    setAnswers({})
    setPrintMode('quiz')
    setNotice(null)
    setIsEditingQuiz(false)

    try {
      const data = await generateQuiz({
        ...formData,
        licenseKey: trimmedLicenseKey
      })

      const quizData = normalizeQuizForClient(data?.quiz ?? data)
      const returnedCredits =
        typeof data?.creditsRemaining === 'number' ? data.creditsRemaining : null

      persistQuiz(quizData, 'New quiz generated and saved to your library.')
      setShowBuilder(false)

      if (typeof returnedCredits === 'number') {
        setCreditsRemaining(returnedCredits)
      } else if (typeof creditsRemaining === 'number' && creditsRemaining > 0) {
        setCreditsRemaining((prev) =>
          typeof prev === 'number' && prev > 0 ? prev - 1 : prev
        )
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      showNotice('error', error.message || 'Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerChange(index, value) {
    setAnswers((prev) => ({
      ...prev,
      [index]: value
    }))
  }

  function handleAnswerCommit(index, value) {
    if (isEditingQuiz) {
      return
    }

    if (value === undefined || String(value).trim() === '') {
      return
    }

    const nextQuestion = questionRefs.current[index + 1]

    if (nextQuestion instanceof HTMLElement) {
      nextQuestion.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  function handleSubmitQuiz() {
    if (!quiz?.questions) return

    const scored = scoreQuiz(quiz.questions, answers)
    setResults(scored)
    showNotice('success', 'Quiz scored successfully.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePrintQuiz() {
    setPrintMode('quiz')
    setTimeout(() => window.print(), 50)
  }

  function handlePrintAnswerKey() {
    setPrintMode('answerKey')
    setTimeout(() => window.print(), 50)
  }

  async function handleExportPdf() {
    try {
      const fileName = await exportQuizToPdf(quiz)
      showNotice('success', `Downloaded ${fileName}.`)
    } catch (error) {
      showNotice('error', error.message || 'Failed to export PDF.')
    }
  }

  function handleLoadSavedQuiz(savedQuiz) {
    setQuiz(normalizeQuizForClient(savedQuiz))
    setAnswers({})
    setResults(null)
    setPrintMode('quiz')
    setShowBuilder(false)
    setShowSaved(false)
    setIsEditingQuiz(false)
    setSavedRenameId(null)
    showNotice('info', `Loaded ${getSavedTitle(savedQuiz)}.`)

    setTimeout(() => {
      quizTopRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }

  function handleStartOver() {
    setQuiz(null)
    setAnswers({})
    setResults(null)
    setPrintMode('quiz')
    setShowBuilder(true)
    setIsEditingQuiz(false)
    showNotice('info', 'Ready to build a new quiz.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSaveLicense() {
    const trimmed = licenseKey.trim()

    if (!trimmed) {
      showNotice('error', 'Please enter a license key.')
      return
    }

    setLicenseKey(trimmed)
    setLicenseSaved(true)

    if (getStoredCredits() === null) {
      setCreditsRemaining(500)
    }

    showNotice('success', 'License key saved on this device.')
  }

  function handleClearLicense() {
    setLicenseKey('')
    setLicenseSaved(false)
    setCreditsRemaining(null)
    localStorage.removeItem('sproutsLicenseKey')
    localStorage.removeItem('sproutsCreditsRemaining')
    showNotice('info', 'Saved license key cleared from this device.')
  }

  function updateQuiz(updater) {
    setQuiz((currentQuiz) => {
      if (!currentQuiz) {
        return currentQuiz
      }

      return normalizeQuizForClient(updater(currentQuiz))
    })
    setResults(null)
  }

  function handleToggleEditing() {
    if (!quiz) return

    setIsEditingQuiz((prev) => !prev)
    setResults(null)
    setNotice(null)
  }

  function handleQuizTitleChange(value) {
    updateQuiz((currentQuiz) => ({
      ...currentQuiz,
      title: value
    }))
  }

  function handleQuestionUpdate(index, updates) {
    updateQuiz((currentQuiz) => ({
      ...currentQuiz,
      questions: currentQuiz.questions.map((question, questionIndex) => {
        if (questionIndex !== index) {
          return question
        }

        const nextQuestion = {
          ...question,
          ...updates
        }

        const acceptedAnswers = Array.isArray(nextQuestion.acceptedAnswers)
          ? nextQuestion.acceptedAnswers.filter(Boolean)
          : []

        return {
          ...nextQuestion,
          acceptedAnswers:
            acceptedAnswers.length > 0 ? acceptedAnswers : [nextQuestion.answer].filter(Boolean),
          choices:
            nextQuestion.type === 'multiple_choice'
              ? [...nextQuestion.choices, '', '', '', ''].slice(0, 4)
              : []
        }
      })
    }))
  }

  function handleSaveQuizEdits() {
    if (!quiz) return

    persistQuiz(quiz, 'Quiz edits saved.')
    setIsEditingQuiz(false)
  }

  function handleStartRename(savedQuiz) {
    setSavedRenameId(savedQuiz.savedId)
    setSavedRenameValue(getSavedTitle(savedQuiz))
  }

  function handleRenameCurrentSavedQuiz() {
    const trimmedValue = savedRenameValue.trim()

    if (!savedRenameId || !trimmedValue) {
      showNotice('error', 'Enter a new name before saving.')
      return
    }

    const updatedQuiz = renameSavedQuiz(savedRenameId, trimmedValue)
    syncSavedQuizzes()

    if (quiz?.savedId === savedRenameId && updatedQuiz) {
      setQuiz(normalizeQuizForClient(updatedQuiz))
    }

    setSavedRenameId(null)
    setSavedRenameValue('')
    showNotice('success', 'Saved quiz renamed.')
  }

  function handleDeleteCurrentSavedQuiz(savedId) {
    if (!window.confirm('Delete this saved quiz from your library?')) {
      return
    }

    deleteSavedQuiz(savedId)
    syncSavedQuizzes()

    if (quiz?.savedId === savedId) {
      setQuiz((currentQuiz) => {
        if (!currentQuiz) return currentQuiz

        const { savedId: _savedId, customTitle: _customTitle, ...rest } = currentQuiz
        return rest
      })
    }

    showNotice('info', 'Saved quiz deleted from your library.')
  }

  const subjectTheme = getSubjectTheme(quiz?.subject)

  const stats = useMemo(() => {
    if (!quiz?.questions) {
      return {
        total: 0,
        answered: 0,
        unanswered: 0,
        progressPercent: 0
      }
    }

    const total = quiz.questions.length
    const answered = quiz.questions.filter((_, index) => {
      const value = answers[index]
      return value !== undefined && String(value).trim() !== ''
    }).length

    return {
      total,
      answered,
      unanswered: total - answered,
      progressPercent: total > 0 ? Math.round((answered / total) * 100) : 0
    }
  }, [quiz, answers])

  const creditsAreLow =
    typeof creditsRemaining === 'number' && creditsRemaining > 0 && creditsRemaining <= 25

  const creditsAreEmpty =
    typeof creditsRemaining === 'number' && creditsRemaining <= 0

  const licenseSummary = licenseSaved && licenseKey.trim()
    ? `Saved • ${typeof creditsRemaining === 'number' ? `${creditsRemaining} credits` : 'Credits unavailable'}`
    : 'Tap to enter and save your key'

  return (
    <div className={`app ${subjectTheme}`}>
      <aside
        className={`license-popup no-print ${showLicensePopup ? 'is-open' : 'is-collapsed'}`}
        aria-label="License and credits panel"
      >
        <div className="license-popup-header">
          <div>
            <h3>License & Credits</h3>
            <p className="license-mini-text">For Etsy customers</p>
            <p className="license-summary">{licenseSummary}</p>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowLicensePopup((prev) => !prev)}
            aria-label={showLicensePopup ? 'Collapse license panel' : 'Expand license panel'}
          >
            {showLicensePopup ? '−' : '+'}
          </button>
        </div>

        {showLicensePopup ? (
          <div className="license-popup-body">
            <label htmlFor="licenseKeyInput" className="license-label">
              Enter license key
            </label>

            <input
              id="licenseKeyInput"
              type="text"
              value={licenseKey}
              onChange={(event) => {
                setLicenseKey(event.target.value)
                setLicenseSaved(false)
              }}
              placeholder="SAQB-XXXX-XXXX-XXXX"
              className="license-input"
            />

            <div className="license-button-row">
              <button type="button" className="tiny-btn" onClick={handleSaveLicense}>
                Activate
              </button>
              <button type="button" className="tiny-btn secondary-btn" onClick={handleClearLicense}>
                Clear
              </button>
            </div>

            <div className="license-status-card">
              <p className="license-status-row">
                <span>Status</span>
                <strong>{licenseSaved && licenseKey.trim() ? 'Saved' : 'Not saved'}</strong>
              </p>

              <p className="license-status-row">
                <span>Credits remaining</span>
                <strong>{typeof creditsRemaining === 'number' ? creditsRemaining : '—'}</strong>
              </p>
            </div>

            <p className="license-help">
              One Etsy purchase includes <strong>500 quiz credits</strong>. Each generated quiz uses{' '}
              <strong>1 credit</strong>.
            </p>

            <p className="license-help license-help-secondary">
              Need more? Refill packs add <strong>500 more credits for $5</strong>.
            </p>

            {creditsAreLow || creditsAreEmpty ? (
              <p className={`license-warning ${creditsAreEmpty ? 'license-warning-empty' : ''}`}>
                {creditsAreEmpty
                  ? 'You are out of credits.'
                  : `You are getting low on credits (${creditsRemaining} left).`}
              </p>
            ) : null}

            <a
              href={ETSY_CREDITS_URL}
              target="_blank"
              rel="noreferrer"
              className="buy-credits-link"
            >
              Buy More Credits
            </a>
          </div>
        ) : null}
      </aside>

      <header className="hero card">
        <div className="hero-title-row">
          <img src={sproutLogo} alt="Sprouts Academy logo" className="hero-logo" />
          <h1>Sprouts Academy Quiz Builder</h1>
        </div>
        <p>Generate AI-powered quizzes for homeschool learning and printable worksheet prep.</p>
      </header>

      {notice ? (
        <section className={`card notice-card notice-${notice.type} no-print`}>
          <div className="notice-row">
            <p>{notice.message}</p>
            <button type="button" className="icon-btn notice-dismiss" onClick={() => setNotice(null)}>
              ×
            </button>
          </div>
        </section>
      ) : null}

      <section className="card no-print">
        <div className="collapsible-header" onClick={() => setShowBuilder((prev) => !prev)}>
          <h2>Build a Quiz</h2>
          <span>{showBuilder ? '▼' : '▶'}</span>
        </div>

        {showBuilder ? <QuizForm onGenerate={handleGenerate} loading={loading} /> : null}
      </section>

      {loading ? (
        <section className="card generation-card no-print" aria-live="polite">
          <div className="generation-card-row">
            <div className="generation-spinner generation-spinner-lg" aria-hidden="true" />
            <div>
              <h2>Generating quiz</h2>
              <p className="muted generation-copy">
                The AI is building age-appropriate questions, checking the requested topic mix,
                and preparing printable answer explanations.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {quiz ? (
        <section className="card" ref={quizTopRef}>
          {isEditingQuiz ? (
            <div className="quiz-edit-meta no-print">
              <label htmlFor="quizTitleInput">Worksheet title</label>
              <input
                id="quizTitleInput"
                type="text"
                value={quiz.title}
                onChange={(event) => handleQuizTitleChange(event.target.value)}
              />
            </div>
          ) : (
            <h2>{quiz.title}</h2>
          )}

          <p className="quiz-meta">
            {quiz.subject} • Grades {quiz.gradeBand}
            {Array.isArray(quiz.topics) && quiz.topics.length > 0
              ? ` • ${quiz.topics.join(', ')}`
              : ''}
          </p>

          <div className="action-row no-print">
            <button type="button" onClick={handlePrintQuiz} className="secondary-btn">
              Print Quiz
            </button>

            <button type="button" onClick={handlePrintAnswerKey} className="secondary-btn">
              Print Answer Key
            </button>

            <button type="button" onClick={handleToggleEditing} className="secondary-btn">
              {isEditingQuiz ? 'Stop Editing' : 'Edit Quiz'}
            </button>

            {isEditingQuiz ? (
              <button type="button" onClick={handleSaveQuizEdits} className="secondary-btn">
                Save Edits
              </button>
            ) : null}

            <button type="button" onClick={handleStartOver} className="secondary-btn">
              New Quiz
            </button>
          </div>
        </section>
      ) : null}

      {quiz ? (
        <section className="print-header only-print print-quiz-only">
          <h1>{quiz.title}</h1>

          <div className="worksheet-header">
            <div>Name: __________________________________</div>
            <div>Date: ____________________</div>
          </div>

          <div className="worksheet-score">Score: ______ / ______</div>

          <p>
            {quiz.subject} • Grades {quiz.gradeBand}
            {Array.isArray(quiz.topics) && quiz.topics.length > 0
              ? ` • ${quiz.topics.join(', ')}`
              : ''}
          </p>
        </section>
      ) : null}

      {quiz ? (
        <section className="only-print print-answer-key-only print-answer-key">
          <h1>{quiz.title} - Answer Key</h1>

          <p>
            {quiz.subject} • Grades {quiz.gradeBand}
            {Array.isArray(quiz.topics) && quiz.topics.length > 0
              ? ` • ${quiz.topics.join(', ')}`
              : ''}
          </p>

          <p className="answer-key-meta">
            Generated {formatSavedDate(quiz.savedAt)} • {quiz.difficulty} difficulty • {quiz.questions.length} questions
          </p>

          <div className="answer-key-list">
            {quiz.questions.map((question, index) => (
              <div key={question.id || index} className="answer-key-item">
                <p>
                  <strong>{index + 1}.</strong> {question.question}
                </p>
                <p>
                  <strong>Answer:</strong> {question.answer}
                </p>
                {Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 1 ? (
                  <p>
                    <strong>Accepted answers:</strong> {question.acceptedAnswers.join(', ')}
                  </p>
                ) : null}
                {question.explanation ? (
                  <p>
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {quiz && !results ? (
        <section className="card stats-card no-print">
          <h2>Progress Stats</h2>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Answered</span>
              <strong>{stats.answered}</strong>
            </div>

            <div className="stat-box">
              <span className="stat-label">Remaining</span>
              <strong>{stats.unanswered}</strong>
            </div>

            <div className="stat-box">
              <span className="stat-label">Total</span>
              <strong>{stats.total}</strong>
            </div>

            <div className="stat-box">
              <span className="stat-label">Progress</span>
              <strong>{stats.progressPercent}%</strong>
            </div>
          </div>
        </section>
      ) : null}

      {quiz && !results
        ? quiz.questions.map((question, index) => (
            <div
              key={question.id || index}
              ref={(element) => {
                questionRefs.current[index] = element
              }}
            >
              <QuestionCard
                question={question}
                index={index}
                value={answers[index] || ''}
                onChange={handleAnswerChange}
                onAnswerCommit={handleAnswerCommit}
                editable={isEditingQuiz}
                onQuestionUpdate={handleQuestionUpdate}
              />
            </div>
          ))
        : null}

      {quiz && !results && !isEditingQuiz ? (
        <div className="no-print">
          <button type="button" className="submit-btn" onClick={handleSubmitQuiz}>
            Submit Quiz
          </button>
        </div>
      ) : null}

      {results ? <ResultsCard results={results} /> : null}

      {pdfToolsUnlocked ? (
        <aside className="pdf-export-dock no-print" aria-label="Hidden PDF export tools">
          <div className="pdf-export-dock-inner">
            <p className="pdf-export-label">PDF Export</p>
            <button
              type="button"
              className="pdf-export-btn"
              onClick={handleExportPdf}
              disabled={!quiz || loading}
            >
              Save worksheet PDF
            </button>
            <p className="pdf-export-hint">Includes questions first, then answer key and explanations.</p>
          </div>
        </aside>
      ) : null}

      <section className="card no-print">
        <div className="collapsible-header" onClick={() => setShowSaved((prev) => !prev)}>
          <h2>Saved Quizzes</h2>
          <span>{showSaved ? '▼' : '▶'}</span>
        </div>

        {showSaved ? (
          saved.length === 0 ? (
            <p className="muted">No saved quizzes yet.</p>
          ) : (
            <div className="saved-list">
              {saved.map((item) => (
                <div key={item.savedId} className="saved-item">
                  <div className="saved-item-content">
                    {savedRenameId === item.savedId ? (
                      <div className="saved-rename-row">
                        <input
                          type="text"
                          value={savedRenameValue}
                          onChange={(event) => setSavedRenameValue(event.target.value)}
                          aria-label="Rename saved quiz"
                        />
                        <div className="saved-rename-actions">
                          <button type="button" className="secondary-btn" onClick={handleRenameCurrentSavedQuiz}>
                            Save Name
                          </button>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => {
                              setSavedRenameId(null)
                              setSavedRenameValue('')
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3>{getSavedTitle(item)}</h3>
                        <p className="muted">
                          {item.subject} • Grades {item.gradeBand} • {item.questionCount || item.questions?.length || 0} questions
                        </p>
                        <p className="muted">{item.topicSummary}</p>
                        <p className="muted">Saved {formatSavedDate(item.savedAt)}</p>
                      </>
                    )}
                  </div>

                  <div className="saved-item-actions">
                    <button type="button" className="secondary-btn" onClick={() => handleLoadSavedQuiz(item)}>
                      Load Quiz
                    </button>

                    <button type="button" className="secondary-btn" onClick={() => handleStartRename(item)}>
                      Rename
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleDeleteCurrentSavedQuiz(item.savedId)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </section>
    </div>
  )
}