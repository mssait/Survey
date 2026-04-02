import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSurveys, deleteSurvey, publishSurvey } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function SurveysListPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [copySuccess, setCopySuccess] = useState(null);

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSurveys();
      setSurveys(response.data);
    } catch (err) {
      setError('Failed to load surveys. Please check your connection and try again.');
      console.error('Error fetching surveys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [id + '_delete']: true }));
    try {
      await deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Failed to delete survey. Please try again.');
      console.error('Error deleting survey:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id + '_delete']: false }));
    }
  };

  const handlePublishToggle = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id + '_publish']: true }));
    try {
      const response = await publishSurvey(id);
      setSurveys((prev) => prev.map((s) => (s.id === id ? { ...s, is_published: response.data.is_published } : s)));
    } catch (err) {
      alert('Failed to update publish status. Please try again.');
      console.error('Error toggling publish:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id + '_publish']: false }));
    }
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/surveys/${id}/take`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
    }).catch(() => {
      prompt('Copy this survey link:', url);
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading surveys..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Surveys</h1>
          <p className="text-gray-500 mt-1">{surveys.length} survey{surveys.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => navigate('/surveys/new')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Survey
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSurveys} className="text-red-700 underline hover:no-underline ml-4 text-sm font-medium">
            Retry
          </button>
        </div>
      )}

      {surveys.length === 0 && !error ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No surveys yet</h2>
          <p className="text-gray-400 mb-6">Create your first survey to get started collecting responses.</p>
          <button
            onClick={() => navigate('/surveys/new')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200"
          >
            Create Your First Survey
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2 flex-1 pr-2">
                    {survey.title}
                  </h2>
                  <span
                    className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      survey.is_published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {survey.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                {survey.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{survey.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {survey.response_count || 0} response{(survey.response_count || 0) !== 1 ? 's' : ''}
                  </span>
                  <span>{new Date(survey.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-50 bg-gray-50 rounded-b-xl">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/surveys/${survey.id}/results`)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                  >
                    Results
                  </button>
                  <button
                    onClick={() => handleShare(survey.id)}
                    disabled={!survey.is_published}
                    title={!survey.is_published ? 'Publish to share' : 'Copy share link'}
                    className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 ${
                      survey.is_published
                        ? copySuccess === survey.id
                          ? 'bg-green-500 text-white border border-green-500'
                          : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                        : 'bg-white border border-gray-200 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {copySuccess === survey.id ? 'Copied!' : 'Share'}
                  </button>
                  <button
                    onClick={() => handlePublishToggle(survey.id)}
                    disabled={actionLoading[survey.id + '_publish']}
                    className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 ${
                      survey.is_published
                        ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-700'
                        : 'bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700'
                    } disabled:opacity-50`}
                  >
                    {actionLoading[survey.id + '_publish']
                      ? '...'
                      : survey.is_published
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(survey.id, survey.title)}
                    disabled={actionLoading[survey.id + '_delete']}
                    className="flex-1 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-150 disabled:opacity-50"
                  >
                    {actionLoading[survey.id + '_delete'] ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SurveysListPage;
