import { useState } from 'react'

export default function QuestionCard({ question, index, value, onChange }) {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="card question-card print-card">
      <div className="question-top-row">
        <h3>
          {index + 1}. {question.question}
        </h3>

        <button
          type="button"
          className="secondary-btn small-btn no-print"
          onClick={() => setShowAnswer((prev) => !prev)}
        >
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </button>
      </div>

      {question.type === 'multiple_choice' ? (
        <div className="choices">
          {question.choices.map((choice) => (
            <label key={choice} className="choice">
              <input
                type="radio"
                name={`question-${index}`}
                value={choice}
                checked={value === choice}
                onChange={(e) => onChange(index, e.target.value)}
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
            onChange={(e) => onChange(index, e.target.value)}
            placeholder="Type your answer"
            className="no-print"
          />
          <div className="only-print print-line" />
        </div>
      )}

      {showAnswer && (
        <div className="answer-box no-print">
          <p>
            <strong>Answer:</strong> {question.answer}
          </p>
          {question.explanation ? (
            <p>
              <strong>Explanation:</strong> {question.explanation}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
