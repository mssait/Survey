import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, RadioGroup,
  FormControlLabel, Radio, Checkbox, FormGroup, LinearProgress,
  Alert, Snackbar, CircularProgress, Chip, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { getSurvey, submitResponse } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSnackbar } from '../hooks/useSnackbar';

function TakeSurveyPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [invalidIds, setInvalidIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const questionRefs = useRef({});
  const { snackbar, showError, hideSnackbar } = useSnackbar();

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getSurvey(id);
        if (!res.data.is_published) { setError('This survey is not currently available.'); return; }
        setSurvey(res.data);
        const init = {};
        (res.data.questions || []).forEach((q) => {
          init[q.id] = q.question_type === 'checkbox' ? [] : '';
        });
        setAnswers(init);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Survey not found.' : 'Failed to load survey.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const answered = Object.values(answers).filter((a) => (Array.isArray(a) ? a.length > 0 : a !== '')).length;
  const total = survey?.questions?.length || 0;
  const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

  const handleTextChange = (qid, val) => {
    setAnswers((p) => ({ ...p, [qid]: val }));
    if (val.trim()) setInvalidIds((prev) => { const s = new Set(prev); s.delete(qid); return s; });
  };

  const handleRadioChange = (qid, val) => {
    setAnswers((p) => ({ ...p, [qid]: val }));
    setInvalidIds((prev) => { const s = new Set(prev); s.delete(qid); return s; });
  };

  const handleCheckboxChange = (qid, val, checked) => {
    setAnswers((p) => {
      const cur = Array.isArray(p[qid]) ? p[qid] : [];
      const next = checked ? [...cur, val] : cur.filter((v) => v !== val);
      if (next.length > 0) setInvalidIds((prev) => { const s = new Set(prev); s.delete(qid); return s; });
      return { ...p, [qid]: next };
    });
  };

  const handleRatingChange = (qid, val) => {
    setAnswers((p) => ({ ...p, [qid]: val }));
    setInvalidIds((prev) => { const s = new Set(prev); s.delete(qid); return s; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = new Set();
    for (const q of survey.questions) {
      if (!q.is_required) continue;
      const ans = answers[q.id];
      const empty = Array.isArray(ans) ? ans.length === 0 : !ans || ans.toString().trim() === '';
      if (empty) invalid.add(q.id);
    }
    if (invalid.size > 0) {
      setInvalidIds(invalid);
      showError(`Please answer ${invalid.size} required question${invalid.size > 1 ? 's' : ''}.`);
      const firstId = [...invalid][0];
      questionRefs.current[firstId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const formattedAnswers = survey.questions.map((q) => {
      const ans = answers[q.id];
      return {
        question_id: q.id,
        answer_text: q.question_type === 'checkbox' ? null : ans || null,
        answer_options: q.question_type === 'checkbox' ? (Array.isArray(ans) ? ans : []) : null,
      };
    });

    setSubmitting(true);
    try {
      await submitResponse({ survey_id: id, answers: formattedAnswers });
      setSubmitted(true);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading survey..." />;

  if (error) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 10, textAlign: 'center' }}>
        <Card sx={{ p: 6 }}>
          <ErrorOutlineIcon sx={{ fontSize: 56, color: '#fca5a5', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>Survey Unavailable</Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Card>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', px: 2, py: 10, textAlign: 'center' }}>
        <Card sx={{ p: 6 }}>
          <CheckCircleIcon sx={{ fontSize: 72, color: '#10b981', mb: 3 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>Thank You!</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, mb: 1 }}>
            Your response has been recorded.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We appreciate you taking the time to complete this survey.
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      {/* Survey Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
            {survey.title}
          </Typography>
          {survey.description && (
            <Typography color="text.secondary" sx={{ mb: 2 }}>{survey.description}</Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip label={`${total} question${total !== 1 ? 's' : ''}`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569' }} />
            {survey.questions?.some((q) => q.is_required) && (
              <Typography variant="caption" color="text.secondary">
                <Box component="span" sx={{ color: '#ef4444', mr: 0.5 }}>*</Box>Required
              </Typography>
            )}
          </Box>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Progress</Typography>
              <Typography variant="caption" color="text.secondary">{answered}/{total}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 3 } }}
            />
          </Box>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        {(survey.questions || []).map((question, index) => {
          const isInvalid = invalidIds.has(question.id);
          return (
            <Card
              key={question.id}
              ref={(el) => { questionRefs.current[question.id] = el; }}
              variant="outlined"
              sx={{
                mb: 2, borderRadius: 2,
                border: isInvalid ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                transition: 'border-color 0.2s',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5 }}>
                  <Box sx={{
                    minWidth: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0, mt: 0.2,
                  }}>
                    {index + 1}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
                    {question.question_text}
                    {question.is_required && <Box component="span" sx={{ color: '#ef4444', ml: 0.5 }}>*</Box>}
                  </Typography>
                </Box>

                {isInvalid && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1.5, ml: 0.5 }}>
                    This field is required.
                  </Typography>
                )}

                {/* Text */}
                {question.question_type === 'text' && (
                  <TextField
                    fullWidth multiline rows={4}
                    placeholder="Type your answer here..."
                    value={answers[question.id] || ''}
                    onChange={(e) => handleTextChange(question.id, e.target.value)}
                    error={isInvalid}
                  />
                )}

                {/* Multiple Choice */}
                {question.question_type === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onChange={(e) => handleRadioChange(question.id, e.target.value)}
                  >
                    {(question.options || []).map((opt, i) => (
                      <FormControlLabel
                        key={i} value={opt}
                        control={<Radio sx={{ color: isInvalid ? '#ef4444' : undefined }} />}
                        label={opt}
                        sx={{
                          mb: 0.5, borderRadius: 2, px: 1.5, mx: 0,
                          border: '1px solid', borderColor: answers[question.id] === opt ? '#6366f1' : '#e2e8f0',
                          bgcolor: answers[question.id] === opt ? '#f5f3ff' : 'transparent',
                          '&:hover': { bgcolor: '#fafafa' },
                        }}
                      />
                    ))}
                  </RadioGroup>
                )}

                {/* Checkbox */}
                {question.question_type === 'checkbox' && (
                  <FormGroup>
                    {(question.options || []).map((opt, i) => {
                      const checked = Array.isArray(answers[question.id]) && answers[question.id].includes(opt);
                      return (
                        <FormControlLabel
                          key={i}
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={(e) => handleCheckboxChange(question.id, opt, e.target.checked)}
                              sx={{ color: isInvalid ? '#ef4444' : undefined }}
                            />
                          }
                          label={opt}
                          sx={{
                            mb: 0.5, borderRadius: 2, px: 1.5, mx: 0,
                            border: '1px solid', borderColor: checked ? '#6366f1' : '#e2e8f0',
                            bgcolor: checked ? '#f5f3ff' : 'transparent',
                            '&:hover': { bgcolor: '#fafafa' },
                          }}
                        />
                      );
                    })}
                  </FormGroup>
                )}

                {/* Rating */}
                {question.question_type === 'rating' && (
                  <ToggleButtonGroup
                    exclusive
                    value={answers[question.id] || null}
                    onChange={(_, val) => { if (val !== null) handleRatingChange(question.id, val); }}
                    sx={{ gap: 1 }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <ToggleButton
                        key={n} value={String(n)}
                        sx={{
                          width: 48, height: 48, borderRadius: '50% !important',
                          fontWeight: 700, fontSize: 16,
                          border: `2px solid ${isInvalid ? '#ef4444' : '#e2e8f0'} !important`,
                          '&.Mui-selected': {
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            borderColor: '#6366f1 !important',
                          },
                        }}
                      >
                        {n}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ py: 1.8, fontSize: 16, mb: 4 }}
        >
          {submitting ? 'Submitting...' : 'Submit Response'}
        </Button>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TakeSurveyPage;
