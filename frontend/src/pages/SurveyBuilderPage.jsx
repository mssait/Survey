import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, IconButton,
  Select, MenuItem, FormControl, InputLabel, FormControlLabel, Switch,
  Chip, Snackbar, Alert, CircularProgress, Divider, Tooltip, Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getSurvey, createSurvey, updateSurvey } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSnackbar } from '../hooks/useSnackbar';

const QUESTION_TYPES = [
  { value: 'text', label: 'Text Answer' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'rating', label: 'Rating (1–5)' },
];

function newQuestion() {
  return {
    _id: Math.random().toString(36).slice(2),
    question_text: '',
    question_type: 'text',
    options: [],
    is_required: false,
    errors: {},
  };
}

function QuestionCard({ question, index, total, onChange, onRemove, onMoveUp, onMoveDown, showErrors }) {
  const handleTypeChange = (newType) => {
    const updated = { ...question, question_type: newType, errors: {} };
    if (newType === 'text' || newType === 'rating') {
      updated.options = [];
    } else if (!updated.options || updated.options.length < 2) {
      updated.options = ['Option 1', 'Option 2'];
    }
    onChange(updated);
  };

  const handleOptionChange = (i, val) => {
    const opts = [...question.options];
    opts[i] = val;
    onChange({ ...question, options: opts, errors: { ...question.errors, options: null, [`opt_${i}`]: val.trim() ? null : 'Option cannot be empty' } });
  };

  const addOption = () => onChange({ ...question, options: [...question.options, ''] });

  const removeOption = (i) => {
    if (question.options.length <= 1) return;
    onChange({ ...question, options: question.options.filter((_, idx) => idx !== i) });
  };

  const hasOptionsType = question.question_type === 'multiple_choice' || question.question_type === 'checkbox';
  const textError = showErrors && !question.question_text.trim();
  const optionsError = showErrors && hasOptionsType && question.options.filter((o) => o.trim()).length < 2;

  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, border: (textError || optionsError) ? '1.5px solid #ef4444' : '1px solid #e2e8f0' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Chip label={`Question ${index + 1}`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600 }} />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Move up">
              <span>
                <IconButton size="small" disabled={index === 0} onClick={onMoveUp}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton size="small" disabled={index === total - 1} onClick={onMoveDown}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove question">
              <IconButton size="small" color="error" onClick={onRemove}><DeleteIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Question Text */}
        <TextField
          fullWidth
          label="Question Text"
          placeholder="Enter your question..."
          value={question.question_text}
          onChange={(e) => onChange({ ...question, question_text: e.target.value, errors: { ...question.errors, text: null } })}
          onBlur={() => {
            if (!question.question_text.trim()) onChange({ ...question, errors: { ...question.errors, text: 'Question text is required' } });
          }}
          error={!!(showErrors && !question.question_text.trim()) || !!question.errors.text}
          helperText={(showErrors && !question.question_text.trim()) ? 'Question text is required' : question.errors.text}
          sx={{ mb: 2 }}
          required
        />

        {/* Type + Required row */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: hasOptionsType ? 2 : 0 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Question Type</InputLabel>
            <Select
              value={question.question_type}
              label="Question Type"
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {QUESTION_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={question.is_required}
                onChange={(e) => onChange({ ...question, is_required: e.target.checked })}
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Required</Typography>}
          />
        </Box>

        {/* Options (MC / Checkbox) */}
        {hasOptionsType && (
          <Box>
            {optionsError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                Add at least 2 options
              </Typography>
            )}
            {question.options.map((opt, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: question.question_type === 'multiple_choice' ? '50%' : '3px', border: '2px solid #94a3b8', flexShrink: 0 }} />
                <TextField
                  size="small"
                  fullWidth
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  error={showErrors && !opt.trim()}
                  helperText={showErrors && !opt.trim() ? 'Option cannot be empty' : ''}
                />
                <IconButton size="small" color="error" onClick={() => removeOption(i)} disabled={question.options.length <= 1}>
                  <RemoveCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={addOption} sx={{ mt: 0.5 }}>
              Add Option
            </Button>
          </Box>
        )}

        {/* Rating Preview */}
        {question.question_type === 'rating' && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
              Rating scale preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Box key={n} sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#e0e7ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {n}
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Text Answer Note */}
        {question.question_type === 'text' && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Respondents will type a free-text answer.
            </Typography>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
}

function SurveyBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([newQuestion()]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { snackbar, showSuccess, showError, showInfo, hideSnackbar } = useSnackbar();

  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getSurvey(id);
        const s = res.data;
        setTitle(s.title);
        setDescription(s.description || '');
        setQuestions(
          s.questions?.length
            ? s.questions.map((q) => ({ ...q, _id: q.id, options: q.options || [], errors: {} }))
            : [newQuestion()]
        );
      } catch {
        showError('Failed to load survey.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEditing, showError]);

  const validateTitle = (val) => {
    if (!val.trim()) return 'Title is required';
    if (val.trim().length < 3) return 'Title must be at least 3 characters';
    return '';
  };

  const validate = () => {
    const titleErr = validateTitle(title);
    setTitleError(titleErr);
    setShowErrors(true);
    if (titleErr) return false;
    for (const q of questions) {
      if (!q.question_text.trim()) return false;
      const hasOpts = q.question_type === 'multiple_choice' || q.question_type === 'checkbox';
      if (hasOpts && q.options.filter((o) => o.trim()).length < 2) return false;
      if (hasOpts && q.options.some((o) => !o.trim())) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      showError('Please fix the highlighted errors before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      questions: questions.map((q, i) => ({
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options: ['multiple_choice', 'checkbox'].includes(q.question_type)
          ? q.options.filter((o) => o.trim())
          : null,
        is_required: q.is_required,
        order_index: i,
      })),
    };

    try {
      if (isEditing) {
        await updateSurvey(id, payload);
        showSuccess('Survey updated successfully!');
      } else {
        await createSurvey(payload);
        showSuccess('Survey created successfully!');
      }
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to save survey.';
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      showInfo('A survey needs at least 1 question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = useCallback((index, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  }, []);

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setQuestions((prev) => { const a = [...prev]; [a[index - 1], a[index]] = [a[index], a[index - 1]]; return a; });
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    setQuestions((prev) => { const a = [...prev]; [a[index], a[index + 1]] = [a[index + 1], a[index]]; return a; });
  };

  if (loading) return <LoadingSpinner message="Loading survey..." />;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 12 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/')} sx={{ color: '#64748b' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {isEditing ? 'Edit Survey' : 'Create New Survey'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditing ? 'Update your survey details and questions' : 'Build your survey with custom questions'}
          </Typography>
        </Box>
      </Box>

      {/* Survey Details Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, color: '#0f172a' }}>
            Survey Details
          </Typography>
          <TextField
            fullWidth
            label="Survey Title"
            placeholder="e.g. Customer Satisfaction Survey"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleError(validateTitle(e.target.value)); }}
            onBlur={() => setTitleError(validateTitle(title))}
            error={!!titleError}
            helperText={titleError}
            required
            sx={{ mb: 2.5 }}
          />
          <TextField
            fullWidth
            label="Description"
            placeholder="Brief description of this survey (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            multiline
            rows={3}
            inputProps={{ maxLength: 500 }}
            helperText={`${description.length}/500 characters`}
          />
        </CardContent>
      </Card>

      {/* Questions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
          Questions{' '}
          <Typography component="span" variant="body2" color="text.secondary">
            ({questions.length})
          </Typography>
        </Typography>

        {questions.map((q, index) => (
          <QuestionCard
            key={q._id || q.id || index}
            question={q}
            index={index}
            total={questions.length}
            onChange={(updated) => handleQuestionChange(index, updated)}
            onRemove={() => handleRemoveQuestion(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            showErrors={showErrors}
          />
        ))}

        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setQuestions((prev) => [...prev, newQuestion()])}
          sx={{
            py: 1.5, borderStyle: 'dashed', borderColor: '#c7d2fe',
            color: '#6366f1', '&:hover': { borderColor: '#6366f1', bgcolor: '#f5f3ff', borderStyle: 'dashed' },
          }}
        >
          Add Question
        </Button>
      </Box>

      {/* Sticky bottom action bar */}
      <Paper
        elevation={4}
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          py: 2, px: 3, display: 'flex', gap: 2, justifyContent: 'flex-end',
          bgcolor: 'white', borderTop: '1px solid #e2e8f0', zIndex: 10,
        }}
      >
        <Button variant="outlined" color="inherit" onClick={() => navigate('/')} sx={{ color: '#64748b' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ px: 4 }}
        >
          {saving ? 'Saving...' : isEditing ? 'Update Survey' : 'Save Survey'}
        </Button>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 5000 : 3000}
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

export default SurveyBuilderPage;
