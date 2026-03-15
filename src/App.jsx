import { useEffect, useMemo, useRef, useState } from 'react'
import QuizForm from './components/QuizForm.jsx'
import QuestionCard from './components/QuestionCard.jsx'
import ResultsCard from './components/ResultsCard.jsx'
import { generateQuiz } from './lib/api.js'
import { saveQuiz, getSavedQuizzes } from './lib/storage.js'
import { scoreQuiz } from './lib/scoring.js'

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

export default function App() {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(getSavedQuizzes())
  const [printMode, setPrintMode] = useState('quiz')
  const [showBuilder, setShowBuilder] = useState(true)
  const [showSaved, setShowSaved] = useState(false)

  const [licenseKey, setLicenseKey] = useState(
    localStorage.getItem('sproutsLicenseKey') || ''
  )
  const [creditsRemaining, setCreditsRemaining] = useState(getStoredCredits())
  const [licenseSaved, setLicenseSaved] = useState(
    Boolean(localStorage.getItem('sproutsLicenseKey'))
  )
  const [showLicensePopup, setShowLicensePopup] = useState(true)

  const quizTopRef = useRef(null)

  useEffect(() => {
    document.body.dataset.printMode = printMode
    return () => {
      delete document.body.dataset.printMode
    }
  }, [printMode])

  useEffect(() => {
    localStorage.setItem('sproutsLicenseKey', licenseKey)
  }, [licenseKey])

  useEffect(() => {
    if (typeof creditsRemaining === 'number') {
      localStorage.setItem('sproutsCreditsRemaining', String(creditsRemaining))
    } else {
      localStorage.removeItem('sproutsCreditsRemaining')
    }
  }, [creditsRemaining])

  async function handleGenerate(formData) {
    setLoading(true)
    setResults(null)
    setAnswers({})
    setPrintMode('quiz')

    try {
      const data = await generateQuiz({
        ...formData,
        licenseKey: licenseKey.trim()
      })

      const quizData = data?.quiz ?? data
      const returnedCredits =
        typeof data?.creditsRemaining === 'number' ? data.creditsRemaining : null

      const quizToSave = {
        ...quizData,
        savedAt: new Date().toISOString()
      }

      setQuiz(quizData)
      saveQuiz(quizToSave)
      setSaved(getSavedQuizzes())
      setShowBuilder(false)

      if (typeof returnedCredits === 'number') {
        setCreditsRemaining(returnedCredits)
      } else if (licenseKey.trim() && typeof creditsRemaining === 'number' && creditsRemaining > 0) {
        setCreditsRemaining((prev) => (typeof prev === 'number' && prev > 0 ? prev - 1 : prev))
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      alert(error.message || 'Failed to generate quiz')
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

  function handleSubmitQuiz() {
    if (!quiz?.questions) return
    const scored = scoreQuiz(quiz.questions, answers)
    setResults(scored)
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

  function handleLoadSavedQuiz(savedQuiz) {
    setQuiz(savedQuiz)
    setAnswers({})
    setResults(null)
    setPrintMode('quiz')
    setShowBuilder(false)
    setShowSaved(false)

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSaveLicense() {
    const trimmed = licenseKey.trim()

    if (!trimmed) {
      alert('Please enter a license key.')
      return
    }

    setLicenseKey(trimmed)
    setLicenseSaved(true)

    if (getStoredCredits() === null) {
      setCreditsRemaining(500)
    }
  }

  function handleClearLicense() {
    setLicenseKey('')
    setLicenseSaved(false)
    setCreditsRemaining(null)
    localStorage.removeItem('sproutsLicenseKey')
    localStorage.removeItem('sproutsCreditsRemaining')
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
    const answered = quiz.questions.filter((_, i) => {
      const value = answers[i]
      return value !== undefined && String(value).trim() !== ''
    }).length

    return {
      total,
      answered,
      unanswered: total - answered,
      progressPercent: total > 0 ? Math.round((answered / total) * 100) : 0
    }
  }, [quiz, answers])

  return (
    <div className={`app ${subjectTheme}`}>
      <aside className="license-popup no-print" aria-label="License and credits panel">
        <div className="license-popup-header">
          <div>
            <h3>License & Credits</h3>
            <p className="license-mini-text">For Etsy customers</p>
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

        {showLicensePopup && (
          <div className="license-popup-body">
            <label htmlFor="licenseKeyInput" className="license-label">
              Enter license key
            </label>

            <input
              id="licenseKeyInput"
              type="text"
              value={licenseKey}
              onChange={(e) => {
                setLicenseKey(e.target.value)
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
              <strong>1 credit</strong>. Refill packs add <strong>500 more for $5</strong>.
            </p>
          </div>
        )}
      </aside>

      <header className="hero card">
        <h1>Sprouts Academy Quiz Builder</h1>
        <p>Generate AI-powered quizzes for homeschool learning.</p>
      </header>

      <section className="card no-print">
        <div
          className="collapsible-header"
          onClick={() => setShowBuilder(!showBuilder)}
        >
          <h2>Build a Quiz</h2>
          <span>{showBuilder ? '▼' : '▶'}</span>
        </div>

        {showBuilder && (
          <QuizForm onGenerate={handleGenerate} loading={loading} />
        )}
      </section>

      {quiz && (
        <section className="card" ref={quizTopRef}>
          <h2>{quiz.title}</h2>

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

            <button
              type="button"
              onClick={handlePrintAnswerKey}
              className="secondary-btn"
            >
              Print Answer Key
            </button>

            <button type="button" onClick={handleStartOver} className="secondary-btn">
              New Quiz
            </button>
          </div>
        </section>
      )}

      {quiz && (
        <section className="print-header only-print print-quiz-only">
          <h1>{quiz.title}</h1>

          <div className="worksheet-header">
            <div>Name: __________________________________</div>
            <div>Date: ____________________</div>
          </div>

          <div className="worksheet-score">
            Score: ______ / ______
          </div>

          <p>
            {quiz.subject} • Grades {quiz.gradeBand}
            {Array.isArray(quiz.topics) && quiz.topics.length > 0
              ? ` • ${quiz.topics.join(', ')}`
              : ''}
          </p>
        </section>
      )}

      {quiz && (
        <section className="only-print print-answer-key-only print-answer-key">
          <h1>{quiz.title} — Answer Key</h1>

          <p>
            {quiz.subject} • Grades {quiz.gradeBand}
            {Array.isArray(quiz.topics) && quiz.topics.length > 0
              ? ` • ${quiz.topics.join(', ')}`
              : ''}
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
                {question.explanation ? (
                  <p>
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {quiz && !results && (
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
      )}

      {quiz && !results && quiz.questions.map((q, i) => (
        <QuestionCard
          key={q.id || i}
          question={q}
          index={i}
          value={answers[i] || ''}
          onChange={handleAnswerChange}
        />
      ))}

      {quiz && !results && (
        <div className="no-print">
          <button type="button" className="submit-btn" onClick={handleSubmitQuiz}>
            Submit Quiz
          </button>
        </div>
      )}

      {results && <ResultsCard results={results} />}

      <section className="card no-print">
        <div
          className="collapsible-header"
          onClick={() => setShowSaved(!showSaved)}
        >
          <h2>Saved Quizzes</h2>
          <span>{showSaved ? '▼' : '▶'}</span>
        </div>

        {showSaved &&
          (saved.length === 0 ? (
            <p className="muted">No saved quizzes yet.</p>
          ) : (
            <div className="saved-list">
              {saved.map((item, index) => (
                <div key={index} className="saved-item">
                  <div>
                    <h3>{item.title}</h3>
                    <p className="muted">
                      {item.subject} • Grades {item.gradeBand}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => handleLoadSavedQuiz(item)}
                  >
                    Load Quiz
                  </button>
                </div>
              ))}
            </div>
          ))}
      </section>
    </div>
  )
}
