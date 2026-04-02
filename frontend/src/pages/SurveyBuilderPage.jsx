import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSurvey, createSurvey, updateSurvey } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Answer' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'rating', label: 'Rating (1-5)' },
];

function createNewQuestion() {
  return {
    _tempId: Math.random().toString(36).substr(2, 9),
    question_text: '',
    question_type: 'text',
    options: [],
    is_required: false,
  };
}

function QuestionEditor({ question, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  const handleOptionChange = (optIndex, value) => {
    const newOptions = [...(question.options || [])];
    newOptions[optIndex] = value;
    onChange({ ...question, options: newOptions });
  };

  const handleAddOption = () => {
    const newOptions = [...(question.options || []), ''];
    onChange({ ...question, options: newOptions });
  };

  const handleRemoveOption = (optIndex) => {
    const newOptions = (question.options || []).filter((_, i) => i !== optIndex);
    onChange({ ...question, options: newOptions });
  };

  const handleTypeChange = (newType) => {
    const updated = { ...question, question_type: newType };
    if (newType === 'text' || newType === 'rating') {
      updated.options = [];
    } else if (!updated.options || updated.options.length === 0) {
      updated.options = ['Option 1', 'Option 2'];
    }
    onChange(updated);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Question {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Move down"
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remove question"
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors ml-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
          <input
            type="text"
            value={question.question_text}
            onChange={(e) => onChange({ ...question, question_text: e.target.value })}
            placeholder="Enter your question..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
            <select
              value={question.question_type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id={`required-${question._tempId || question.id}`}
              checked={question.is_required}
              onChange={(e) => onChange({ ...question, is_required: e.target.checked })}
              className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
            />
            <label
              htmlFor={`required-${question._tempId || question.id}`}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Required
            </label>
          </div>
        </div>

        {(question.question_type === 'multiple_choice' || question.question_type === 'checkbox') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options</label>
            <div className="space-y-2">
              {(question.options || []).map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <div className="w-5 h-5 shrink-0">
                    {question.question_type === 'multiple_choice' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded border-2 border-gray-300 mt-0.5" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(optIndex)}
                    disabled={(question.options || []).length <= 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 mt-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Option
              </button>
            </div>
          </div>
        )}

        {question.question_type === 'rating' && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <p className="text-sm text-blue-700 font-medium">Rating Scale: 1 to 5</p>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center text-sm font-semibold text-blue-600">
                  {n}
                </div>
              ))}
            </div>
          </div>
        )}

        {question.question_type === 'text' && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
            <p className="text-sm text-gray-500 italic">Respondents will type a free-text answer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SurveyBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([createNewQuestion()]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (!isEditing) return;
    const fetchSurvey = async () => {
      try {
        setLoading(true);
        const response = await getSurvey(id);
        const survey = response.data;
        setTitle(survey.title);
        setDescription(survey.description || '');
        if (survey.questions && survey.questions.length > 0) {
          setQuestions(
            survey.questions.map((q) => ({
              ...q,
              _tempId: q.id,
              options: q.options || [],
            }))
          );
        } else {
          setQuestions([createNewQuestion()]);
        }
      } catch (err) {
        setError('Failed to load survey. Please try again.');
        console.error('Error loading survey:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [id, isEditing]);

  const validate = () => {
    const errors = [];
    if (!title.trim()) {
      errors.push('Survey title is required.');
    }
    questions.forEach((q, i) => {
      if (!q.question_text.trim()) {
        errors.push(`Question ${i + 1} text is required.`);
      }
      if (
        (q.question_type === 'multiple_choice' || q.question_type === 'checkbox') &&
        (!q.options || q.options.length === 0 || q.options.some((o) => !o.trim()))
      ) {
        errors.push(`Question ${i + 1} has empty or missing options.`);
      }
    });
    return errors;
  };

  const handleSave = async () => {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setValidationErrors([]);
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      questions: questions.map((q, i) => ({
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options:
          q.question_type === 'multiple_choice' || q.question_type === 'checkbox'
            ? q.options.filter((o) => o.trim())
            : null,
        is_required: q.is_required,
        order_index: i,
      })),
    };

    try {
      if (isEditing) {
        await updateSurvey(id, payload);
      } else {
        await createSurvey(payload);
      }
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'Failed to save survey. Please try again.';
      setError(msg);
      console.error('Error saving survey:', err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, createNewQuestion()]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      alert('A survey must have at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = useCallback((index, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  }, []);

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    setQuestions((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading survey..." />;
  }

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
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Survey' : 'Create New Survey'}
        </h1>
      </div>

      {(error || validationErrors.length > 0) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error && <p className="font-medium">{error}</p>}
          {validationErrors.length > 0 && (
            <ul className="list-disc list-inside space-y-1 mt-1">
              {validationErrors.map((e, i) => (
                <li key={i} className="text-sm">{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Survey Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter survey title..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description of this survey..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Questions <span className="text-gray-400 font-normal text-base">({questions.length})</span>
        </h2>
        {questions.map((question, index) => (
          <QuestionEditor
            key={question._tempId || question.id || index}
            question={question}
            index={index}
            total={questions.length}
            onChange={(updated) => handleQuestionChange(index, updated)}
            onRemove={() => handleRemoveQuestion(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
          />
        ))}

        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-500 hover:text-blue-500 rounded-xl py-4 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </button>
      </div>

      <div className="flex items-center gap-4 pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-8 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            isEditing ? 'Save Changes' : 'Create Survey'
          )}
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default SurveyBuilderPage;
