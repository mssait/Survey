import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Button, Chip,
  LinearProgress, IconButton, Alert, Divider, Paper, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';
import StarIcon from '@mui/icons-material/Star';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { getSurveyResults } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function StatCard({ value, label, icon, color }) {
  return (
    <Card sx={{ textAlign: 'center', py: 3, px: 2 }}>
      <Box sx={{ color, mb: 1 }}>{icon}</Box>
      <Typography variant="h3" sx={{ fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>{label}</Typography>
    </Card>
  );
}

function BarChartResult({ counts, total }) {
  const entries = Object.entries(counts);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {entries.map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const barPct = max > 0 ? (count / max) * 100 : 0;
        return (
          <Box key={label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </Typography>
              <Typography variant="body2" color="text.secondary">{count} ({pct}%)</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={barPct}
              sx={{
                height: 10, borderRadius: 5, bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: 5,
                  transition: 'transform 1s ease',
                },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

function RatingResult({ distribution, average, count }) {
  const max = Math.max(...Object.values(distribution), 1);
  if (count === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>No ratings yet.</Typography>;
  }
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
        <Box sx={{ textAlign: 'center', bgcolor: '#f5f3ff', borderRadius: 3, px: 4, py: 2 }}>
          <Typography variant="h2" sx={{ fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{average}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <StarIcon key={n} sx={{ fontSize: 16, color: n <= Math.round(average) ? '#f59e0b' : '#e2e8f0' }} />
            ))}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">Based on {count} rating{count !== 1 ? 's' : ''}</Typography>
      </Box>
      {[5, 4, 3, 2, 1].map((rating) => {
        const c = distribution[rating] || 0;
        const pct = count > 0 ? Math.round((c / count) * 100) : 0;
        const barPct = max > 0 ? (c / max) * 100 : 0;
        return (
          <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 40 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{rating}</Typography>
              <StarIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
            </Box>
            <LinearProgress
              variant="determinate"
              value={barPct}
              sx={{
                flex: 1, height: 8, borderRadius: 4, bgcolor: '#fef3c7',
                '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b', borderRadius: 4, transition: 'transform 1s ease' },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52, textAlign: 'right' }}>
              {c} ({pct}%)
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function TextResult({ answers }) {
  if (!answers || answers.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>No text answers yet.</Typography>;
  }
  return (
    <Box sx={{ mt: 2, maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {answers.map((text, i) => (
        <Paper key={i} variant="outlined" sx={{ px: 2.5, py: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <FormatQuoteIcon sx={{ fontSize: 16, color: '#6366f1', mt: 0.3, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: '#0f172a' }}>{text}</Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

const TYPE_LABEL = { text: 'Text', multiple_choice: 'Multiple Choice', checkbox: 'Checkbox', rating: 'Rating' };

function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getSurveyResults(id);
        setResults(res.data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Survey not found.' : 'Failed to load results.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading results..." />;

  if (error) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 6 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
          <Button onClick={() => navigate('/')} size="small" sx={{ ml: 2 }}>Dashboard</Button>
        </Alert>
      </Box>
    );
  }

  const { survey, response_count, questions } = results;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/')} sx={{ color: '#64748b', mt: 0.3 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Survey Results
          </Typography>
          <Typography variant="body2" color="text.secondary">{survey.title}</Typography>
        </Box>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard value={response_count} label="Total Responses" icon={<PeopleIcon sx={{ fontSize: 32 }} />} color="#6366f1" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard value={questions.length} label="Questions" icon={<QuizIcon sx={{ fontSize: 32 }} />} color="#64748b" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', py: 3, px: 2 }}>
            <Box sx={{ mb: 1.5 }}>
              <Chip
                label={survey.is_published ? 'Published' : 'Draft'}
                sx={{
                  fontWeight: 700, fontSize: 14, px: 1,
                  bgcolor: survey.is_published ? '#d1fae5' : '#f1f5f9',
                  color: survey.is_published ? '#065f46' : '#475569',
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Status</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* No responses yet */}
      {response_count === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <PeopleIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>No responses yet</Typography>
          <Typography color="text.secondary">
            {survey.is_published ? 'Share your survey to start collecting responses.' : 'Publish your survey first to start collecting responses.'}
          </Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ flex: 1, pr: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>
                      <Box component="span" sx={{ color: '#6366f1', mr: 1 }}>{index + 1}.</Box>
                      {question.question_text}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                    <Chip label={TYPE_LABEL[question.question_type] || question.question_type} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }} />
                    <Chip label={`${question.answer_count} answer${question.answer_count !== 1 ? 's' : ''}`} size="small" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 600, fontSize: '0.7rem' }} />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {question.aggregated?.type === 'text' && <TextResult answers={question.aggregated.answers} />}
                {(question.aggregated?.type === 'multiple_choice' || question.aggregated?.type === 'checkbox') && (
                  <BarChartResult counts={question.aggregated.counts} total={question.answer_count} />
                )}
                {question.aggregated?.type === 'rating' && (
                  <RatingResult
                    distribution={question.aggregated.distribution}
                    average={question.aggregated.average}
                    count={question.aggregated.count}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4, pb: 4 }}>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/surveys/${id}/edit`)}>
          Edit Survey
        </Button>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
}

export default ResultsPage;
