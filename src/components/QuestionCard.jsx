import { useState } from 'react'

function toAcceptedAnswersText(acceptedAnswers) {
  return Array.isArray(acceptedAnswers) ? acceptedAnswers.join(', ') : ''
}

export default function QuestionCard({
  question,
  index,
  value,
  onChange,
  onAnswerCommit,
  editable = false,
  onQuestionUpdate
}) {
  const [showAnswer, setShowAnswer] = useState(false)

  function handleAcceptedAnswersChange(nextValue) {
    onQuestionUpdate(index, {
      acceptedAnswers: nextValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    })
  }

  return (
    <div className="card question-card print-card">
      <div className="question-top-row">
        <h3>
          {index + 1}. {question.question}
        </h3>

        {!editable ? (
          <button
            type="button"
            className="secondary-btn small-btn no-print"
            onClick={() => setShowAnswer((prev) => !prev)}
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
        ) : null}
      </div>

      {editable ? (
        <div className="question-editor no-print">
          <label>
            Question prompt
            <textarea
              value={question.question}
              rows={3}
              onChange={(event) => onQuestionUpdate(index, { question: event.target.value })}
            />
          </label>

          {question.type === 'multiple_choice' ? (
            <div className="editor-choice-grid">
              {question.choices.map((choice, choiceIndex) => (
                <label key={`${question.id}-${choiceIndex}`}>
                  Choice {choiceIndex + 1}
                  <input
                    type="text"
                    value={choice}
                    onChange={(event) => {
                      const nextChoices = question.choices.map((item, indexToUpdate) =>
                        indexToUpdate === choiceIndex ? event.target.value : item
                      )

                      onQuestionUpdate(index, { choices: nextChoices })
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}

          <div className="editor-meta-grid">
            <label>
              Correct answer
              <input
                type="text"
                value={question.answer}
                onChange={(event) => {
                  const nextAnswer = event.target.value
                  const nextUpdates = { answer: nextAnswer }

                  if (question.type === 'multiple_choice') {
                    nextUpdates.acceptedAnswers = [nextAnswer].filter(Boolean)
                  }

                  onQuestionUpdate(index, nextUpdates)
                }}
              />
            </label>

            <label>
              Accepted answers
              <input
                type="text"
                value={toAcceptedAnswersText(question.acceptedAnswers)}
                onChange={(event) => handleAcceptedAnswersChange(event.target.value)}
                placeholder="Separate multiple answers with commas"
              />
            </label>
          </div>

          <label>
            Explanation
            <textarea
              value={question.explanation}
              rows={3}
              onChange={(event) => onQuestionUpdate(index, { explanation: event.target.value })}
            />
          </label>
        </div>
      ) : question.type === 'multiple_choice' ? (
        <div className="choices">
          {question.choices.map((choice) => (
            <label key={choice} className="choice">
              <input
                type="radio"
                name={`question-${index}`}
                value={choice}
                checked={value === choice}
                onChange={(event) => {
                  onChange(index, event.target.value)
                  onAnswerCommit?.(index, event.target.value)
                }}
              />
              {choice}
            </label>
          ))}
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={value || ''}
            onChange={(event) => onChange(index, event.target.value)}
            onBlur={(event) => onAnswerCommit?.(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onAnswerCommit?.(index, event.currentTarget.value)
              }
            }}
            placeholder="Type your answer"
            className="no-print"
          />
          <div className="only-print print-line" />
        </div>
      )}

      {showAnswer && !editable ? (
        <div className="answer-box no-print">
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
      ) : null}
    </div>
  )
}