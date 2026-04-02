import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSurvey, submitResponse } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function TakeSurveyPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getSurvey(id);
        const data = response.data;
        if (!data.is_published) {
          setError('This survey is not currently available.');
        } else {
          setSurvey(data);
          const initialAnswers = {};
          (data.questions || []).forEach((q) => {
            initialAnswers[q.id] = q.question_type === 'checkbox' ? [] : '';
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Survey not found.');
        } else {
          setError('Failed to load survey. Please try again later.');
        }
        console.error('Error loading survey:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [id]);

  const handleTextChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleRadioChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId, value, checked) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      if (checked) {
        return { ...prev, [questionId]: [...current, value] };
      } else {
        return { ...prev, [questionId]: current.filter((v) => v !== value) };
      }
    });
  };

  const handleRatingChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: String(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate required questions
    for (const question of survey.questions) {
      if (question.is_required) {
        const answer = answers[question.id];
        if (question.question_type === 'checkbox') {
          if (!answer || answer.length === 0) {
            setSubmitError(`Please answer the required question: "${question.question_text}"`);
            return;
          }
        } else {
          if (!answer || answer.toString().trim() === '') {
            setSubmitError(`Please answer the required question: "${question.question_text}"`);
            return;
          }
        }
      }
    }

    const formattedAnswers = survey.questions.map((q) => {
      const answer = answers[q.id];
      if (q.question_type === 'checkbox') {
        return {
          question_id: q.id,
          answer_text: null,
          answer_options: Array.isArray(answer) ? answer : [],
        };
      } else if (q.question_type === 'multiple_choice') {
        return {
          question_id: q.id,
          answer_text: answer || null,
          answer_options: null,
        };
      } else {
        return {
          question_id: q.id,
          answer_text: answer || null,
          answer_options: null,
        };
      }
    });

    setSubmitting(true);
    try {
      await submitResponse({ survey_id: id, answers: formattedAnswers });
      setSubmitted(true);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Failed to submit your response. Please try again.';
      setSubmitError(msg);
      console.error('Error submitting response:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading survey..." />;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-700 mb-2">Survey Unavailable</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
          <p className="text-gray-500 text-lg">Your response has been submitted successfully.</p>
          <p className="text-gray-400 text-sm mt-2">We appreciate you taking the time to complete this survey.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{survey.title}</h1>
        {survey.description && (
          <p className="text-gray-500 text-base">{survey.description}</p>
        )}
        <div className="mt-4 text-sm text-gray-400">
          {survey.questions?.length} question{survey.questions?.length !== 1 ? 's' : ''}
          {survey.questions?.some((q) => q.is_required) && (
            <span className="ml-3">
              <span className="text-red-500">*</span> Required
            </span>
          )}
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {(survey.questions || []).map((question, index) => (
          <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-4">
              <p className="text-base font-medium text-gray-900">
                <span className="text-gray-400 mr-2">{index + 1}.</span>
                {question.question_text}
                {question.is_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </p>
            </div>

            {question.question_type === 'text' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleTextChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            )}

            {question.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                {(question.options || []).map((opt, optIndex) => (
                  <label key={optIndex} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={opt}
                      checked={answers[question.id] === opt}
                      onChange={() => handleRadioChange(question.id, opt)}
                      className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'checkbox' && (
              <div className="space-y-2">
                {(question.options || []).map((opt, optIndex) => (
                  <label key={optIndex} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      value={opt}
                      checked={Array.isArray(answers[question.id]) && answers[question.id].includes(opt)}
                      onChange={(e) => handleCheckboxChange(question.id, opt, e.target.checked)}
                      className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'rating' && (
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleRatingChange(question.id, n)}
                    className={`w-12 h-12 rounded-full font-semibold text-lg transition-all duration-150 ${
                      answers[question.id] === String(n)
                        ? 'bg-blue-500 text-white shadow-md scale-110'
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="pb-8">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-base"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Response'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TakeSurveyPage;
