import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSurveyResults } from '../services/api';

function BarChart({ counts, total }) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return <p className="text-sm text-gray-400 italic">No answers yet.</p>;

  return (
    <div className="space-y-2 mt-2">
      {entries.map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={label}>
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>{label}</span>
              <span className="text-gray-500">{count} ({pct}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingChart({ distribution, average, count }) {
  const max = Math.max(...Object.values(distribution), 1);
  return (
    <div className="mt-2">
      {count > 0 && (
        <p className="text-2xl font-bold text-blue-600 mb-3">
          {average} <span className="text-base font-normal text-gray-500">/ 5 average ({count} rating{count !== 1 ? 's' : ''})</span>
        </p>
      )}
      <div className="flex items-end gap-2 h-20">
        {[1, 2, 3, 4, 5].map((n) => {
          const val = distribution[n] || 0;
          const heightPct = max > 0 ? (val / max) * 100 : 0;
          return (
            <div key={n} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{val}</span>
              <div className="w-full bg-gray-100 rounded" style={{ height: '60px', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  className="w-full bg-blue-400 rounded transition-all duration-500"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await getSurveyResults(id);
        setData(res.data);
      } catch {
        setError('Failed to load results.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-xl">{error}</div>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const { survey, response_count, questions } = data;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{survey.title}</h2>
        {survey.description && <p className="text-gray-500 text-sm mb-4">{survey.description}</p>}
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{response_count}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Responses</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-700">{questions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Questions</p>
          </div>
          <div className="text-center">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              survey.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {survey.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {response_count === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No responses yet.</p>
          {survey.is_published && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/surveys/${id}/take`;
                navigator.clipboard.writeText(url).then(() => alert('Survey link copied!'));
              }}
              className="mt-3 text-blue-600 text-sm hover:underline"
            >
              Copy survey link to share
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="font-medium text-gray-900 mb-1">
                {idx + 1}. {q.question_text}
              </p>
              <p className="text-xs text-gray-400 mb-3 capitalize">{q.question_type.replace('_', ' ')} · {q.answer_count} answer{q.answer_count !== 1 ? 's' : ''}</p>

              {q.aggregated?.type === 'text' && (
                <div className="space-y-1 mt-2 max-h-48 overflow-y-auto">
                  {q.aggregated.answers.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No answers yet.</p>
                  ) : (
                    q.aggregated.answers.map((ans, i) => (
                      <div key={i} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                        {ans}
                      </div>
                    ))
                  )}
                </div>
              )}

              {(q.aggregated?.type === 'multiple_choice' || q.aggregated?.type === 'checkbox') && (
                <BarChart counts={q.aggregated.counts} total={q.answer_count} />
              )}

              {q.aggregated?.type === 'rating' && (
                <RatingChart
                  distribution={q.aggregated.distribution}
                  average={q.aggregated.average}
                  count={q.aggregated.count}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
