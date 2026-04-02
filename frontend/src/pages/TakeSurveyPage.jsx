import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSurvey, submitResponse } from '../services/api';

export default function TakeSurveyPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await getSurvey(id);
        const s = res.data;
        if (!s.is_published) {
          setError('This survey is not available.');
        } else {
          setSurvey(s);
        }
      } catch {
        setError('Survey not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleCheckbox(questionId, option) {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    // Validate required questions
    for (const q of survey.questions) {
      if (!q.is_required) continue;
      const ans = answers[q.id];
      if (q.question_type === 'checkbox') {
        if (!ans || ans.length === 0) {
          setSubmitError(`Please answer the required question: "${q.question_text}"`);
          return;
        }
      } else {
        if (!ans || (typeof ans === 'string' && !ans.trim())) {
          setSubmitError(`Please answer the required question: "${q.question_text}"`);
          return;
        }
      }
    }

    const payload = {
      survey_id: id,
      answers: survey.questions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
        .map((q) => {
          if (q.question_type === 'checkbox') {
            return { question_id: q.id, answer_options: answers[q.id] || [] };
          }
          return { question_id: q.id, answer_text: String(answers[q.id]) };
        }),
    };

    try {
      setSubmitting(true);
      await submitResponse(payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-xl">
          <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Survey Unavailable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="bg-white border border-gray-200 shadow-sm px-8 py-12 rounded-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-500">Your response has been recorded successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Survey header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h1>
        {survey.description && <p className="text-gray-600">{survey.description}</p>}
        <p className="text-sm text-gray-400 mt-3">{survey.questions.length} question{survey.questions.length !== 1 ? 's' : ''}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {survey.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="font-medium text-gray-900 mb-1">
              {idx + 1}. {q.question_text}
              {q.is_required && <span className="text-red-500 ml-1">*</span>}
            </p>

            {q.question_type === 'text' && (
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Your answer…"
                rows={3}
                className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            )}

            {q.question_type === 'multiple_choice' && (
              <div className="mt-2 space-y-2">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.question_type === 'checkbox' && (
              <div className="mt-2 space-y-2">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={(answers[q.id] || []).includes(opt)}
                      onChange={() => toggleCheckbox(q.id, opt)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.question_type === 'rating' && (
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(q.id, String(n))}
                    className={`w-10 h-10 rounded-lg border-2 text-sm font-semibold transition ${
                      answers[q.id] === String(n)
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                {answers[q.id] && (
                  <span className="ml-2 self-center text-sm text-gray-500">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][parseInt(answers[q.id])]}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {submitting ? 'Submitting…' : 'Submit Response'}
        </button>
      </form>
    </div>
  );
}
