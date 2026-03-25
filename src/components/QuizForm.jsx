import { useState } from 'react'
import {
  DIFFICULTIES,
  GRADE_BANDS,
  QUESTION_COUNTS
} from '../../shared/quizConfig.js'

const SUBJECT_TOPICS = {
  Math: [
    'Addition',
    'Subtraction',
    'Multiplication',
    'Division',
    'Fractions',
    'Word Problems',
    'Geometry',
    'Measurement',
    'Time',
    'Money'
  ],
  Reading: [
    'Phonics',
    'Sight Words',
    'Vocabulary',
    'Reading Comprehension',
    'Story Elements',
    'Main Idea',
    'Context Clues',
    'Sequencing',
    'Inference',
    'Grammar'
  ],
  Science: [
    'Animals',
    'Plants',
    'Weather',
    'Space',
    'Earth',
    'Matter',
    'Energy',
    'Human Body',
    'Habitats',
    'Simple Machines'
  ]
}

export default function QuizForm({ onGenerate, loading, generationStatus }) {
  const [form, setForm] = useState({
    subject: 'Math',
    gradeBand: '3-4',
    selectedTopics: ['Addition'],
    difficulty: 'easy',
    questionType: 'multiple_choice',
    count: 5,
    includeExplanations: true
  })

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubjectChange(subject) {
    const nextTopics = SUBJECT_TOPICS[subject]
    setForm((prev) => ({
      ...prev,
      subject,
      selectedTopics: nextTopics.slice(0, 1)
    }))
  }

  function handleTopicToggle(topic) {
    setForm((prev) => {
      const exists = prev.selectedTopics.includes(topic)
      let updatedTopics

      if (exists) {
        updatedTopics = prev.selectedTopics.filter((item) => item !== topic)
      } else {
        updatedTopics = [...prev.selectedTopics, topic]
      }

      if (updatedTopics.length === 0) {
        updatedTopics = [SUBJECT_TOPICS[prev.subject][0]]
      }

      return {
        ...prev,
        selectedTopics: updatedTopics
      }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()

    onGenerate({
      subject: form.subject,
      gradeBand: form.gradeBand,
      topics: form.selectedTopics,
      difficulty: form.difficulty,
      questionType: form.questionType,
      count: Number(form.count),
      includeExplanations: form.includeExplanations
    })
  }

  const availableTopics = SUBJECT_TOPICS[form.subject]

  return (
    <form onSubmit={handleSubmit} className="card no-print">
      <label>Subject</label>
      <select value={form.subject} onChange={(e) => handleSubjectChange(e.target.value)}>
        <option value="Math">Math</option>
        <option value="Reading">Reading</option>
        <option value="Science">Science</option>
      </select>

      <label>Grade Band</label>
      <select value={form.gradeBand} onChange={(e) => updateField('gradeBand', e.target.value)}>
        {GRADE_BANDS.map((band) => (
          <option key={band} value={band}>
            {band}
          </option>
        ))}
      </select>

      <label>Topics</label>
      <div className="topic-grid">
        {availableTopics.map((topic) => (
          <label key={topic} className="topic-chip">
            <input
              type="checkbox"
              checked={form.selectedTopics.includes(topic)}
              onChange={() => handleTopicToggle(topic)}
            />
            <span>{topic}</span>
          </label>
        ))}
      </div>

      <label>Difficulty</label>
      <select value={form.difficulty} onChange={(e) => updateField('difficulty', e.target.value)}>
        {DIFFICULTIES.map((difficulty) => (
          <option key={difficulty} value={difficulty}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </option>
        ))}
      </select>

      <label>Question Type</label>
      <select
        value={form.questionType}
        onChange={(e) => updateField('questionType', e.target.value)}
      >
        <option value="multiple_choice">Multiple Choice</option>
        <option value="fill_in_blank">Fill in the Blank</option>
      </select>

      <label>Question Count</label>
      <select value={form.count} onChange={(e) => updateField('count', Number(e.target.value))}>
        {QUESTION_COUNTS.map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </select>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.includeExplanations}
          onChange={(e) => updateField('includeExplanations', e.target.checked)}
        />
        Include explanations
      </label>

      <button type="submit" disabled={loading}>
        {loading ? `Generating... ${generationStatus?.progressPercent || 0}%` : 'Generate Quiz'}
      </button>

      {loading ? (
        <div className="generation-status" aria-live="polite" aria-busy="true">
          <div className="generation-spinner" aria-hidden="true" />
          <div>
            <strong>{generationStatus?.title || 'Generating your worksheet...'}</strong>
            <p>{generationStatus?.detail || 'Building age-appropriate questions, answers, and explanations now.'}</p>
            <div className="generation-progress-block compact-progress-block">
              <div className="generation-progress-meta">
                <span>{generationStatus?.countLabel}</span>
                <span>{generationStatus?.elapsedLabel || '0s elapsed'}</span>
              </div>
              <div className="generation-progress-track" aria-hidden="true">
                <div
                  className="generation-progress-fill"
                  style={{ width: `${generationStatus?.progressPercent || 6}%` }}
                />
              </div>
              <p className="generation-progress-note">{generationStatus?.remainingLabel}</p>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  )
}
