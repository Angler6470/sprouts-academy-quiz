export default function ResultsCard({ results }) {
  const percent = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0

  return (
    <div className="card">
      <h2>
        Score: {results.correct} / {results.total} ({percent}%)
      </h2>

      {results.graded.map((item, index) => (
        <div key={item.id || index} className="result-item">
          <p>
            <strong>Q{index + 1}:</strong> {item.question}
          </p>
          <p>Your answer: {item.userAnswer || 'No answer'}</p>
          <p>Correct answer: {item.answer}</p>
            {Array.isArray(item.acceptedAnswers) && item.acceptedAnswers.length > 1 ? (
              <p>Accepted answers: {item.acceptedAnswers.join(', ')}</p>
            ) : null}
            <p>{item.isCorrect ? 'Correct' : 'Incorrect'}</p>
          {item.explanation ? <p>Explanation: {item.explanation}</p> : null}
          <hr />
        </div>
      ))}
    </div>
  )
}
