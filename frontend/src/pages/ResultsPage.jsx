import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurveyResults } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function BarChart({ counts, total }) {
  const entries = Object.entries(counts);
  const maxCount = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-2 mt-3">
      {entries.map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32 shrink-0 truncate" title={label}>
              {label}
            </span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 w-20 text-right shrink-0">
              {count} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RatingDistribution({ distribution, average, count }) {
  const max = Math.max(...Object.values(distribution), 1);
  return (
    <div className="mt-3">
      {count > 0 ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-3 text-center">
              <p className="text-3xl font-bold text-blue-600">{average}</p>
              <p className="text-xs text-blue-400 font-medium">Average</p>
            </div>
            <div className="text-sm text-gray-400">
              Based on {count} rating{count !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const ratingCount = distribution[rating] || 0;
              const barWidth = max > 0 ? (ratingCount / max) * 100 : 0;
              const pct = count > 0 ? Math.round((ratingCount / count) * 100) : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="text-sm font-medium text-gray-600">{rating}</span>
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-20 text-right shrink-0">
                    {ratingCount} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400 italic">No ratings yet.</p>
      )}
    </div>
  );
}

function TextAnswers({ answers }) {
  if (!answers || answers.length === 0) {
    return <p className="text-sm text-gray-400 italic mt-2">No text answers yet.</p>;
  }
  return (
    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
      {answers.map((text, i) => (
        <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
          <p className="text-sm text-gray-700">{text}</p>
        </div>
      ))}
    </div>
  );
}

function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getSurveyResults(id);
        setResults(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Survey not found.');
        } else {
          setError('Failed to load results. Please try again.');
        }
        console.error('Error loading results:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading results..." />;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-red-600 underline hover:no-underline text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { survey, response_count, questions } = results;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Survey Results</h1>
          <p className="text-gray-500 text-sm mt-0.5">{survey.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-4xl font-bold text-blue-600">{response_count}</p>
          <p className="text-sm text-gray-500 mt-1">Total Responses</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <p className="text-4xl font-bold text-gray-800">{questions.length}</p>
          <p className="text-sm text-gray-500 mt-1">Questions</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              survey.is_published
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {survey.is_published ? 'Published' : 'Draft'}
          </span>
          <p className="text-sm text-gray-500 mt-1">Status</p>
        </div>
      </div>

      {response_count === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No responses yet</h2>
          <p className="text-gray-400 text-sm">
            {survey.is_published
              ? 'Share your survey to start collecting responses.'
              : 'Publish your survey to start collecting responses.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-base">
                    <span className="text-gray-400 mr-2">{index + 1}.</span>
                    {question.question_text}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                      {question.question_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {question.answer_count} answer{question.answer_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {question.aggregated?.type === 'text' && (
                <TextAnswers answers={question.aggregated.answers} />
              )}

              {(question.aggregated?.type === 'multiple_choice' ||
                question.aggregated?.type === 'checkbox') && (
                <BarChart
                  counts={question.aggregated.counts}
                  total={question.answer_count}
                />
              )}

              {question.aggregated?.type === 'rating' && (
                <RatingDistribution
                  distribution={question.aggregated.distribution}
                  average={question.aggregated.average}
                  count={question.aggregated.count}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pb-8 flex gap-4">
        <button
          onClick={() => navigate(`/surveys/${id}/edit`)}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg transition-colors duration-200"
        >
          Edit Survey
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;
