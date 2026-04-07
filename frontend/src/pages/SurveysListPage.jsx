import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button, Chip,
  IconButton, Snackbar, Alert, Skeleton, Divider, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { deleteSurvey, publishSurvey } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { useSurveys } from '../context/SurveyContext';

// Page title / subtitle per filter
const VIEW_META = {
  published: {
    title: 'Published Surveys',
    subtitle: 'Surveys currently live and accepting responses',
  },
  draft: {
    title: 'Draft Surveys',
    subtitle: 'Surveys not yet published',
  },
  responses: {
    title: 'Total Responses',
    subtitle: 'All surveys ranked by response count',
  },
  default: {
    title: 'Dashboard',
    subtitle: 'Manage and track all your surveys',
  },
};

function SurveysListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter'); // 'published' | 'draft' | 'responses' | null

  const { surveys, setSurveys, loading, refresh } = useSurveys();
  const [actionLoading, setActionLoading] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, title: '' });
  const { snackbar, showSuccess, showError, showInfo, hideSnackbar } = useSnackbar();

  // Load on mount
  useEffect(() => { refresh(); }, [refresh]);

  // Derive the visible list from the active filter
  const filteredSurveys = (() => {
    if (filter === 'published') return surveys.filter((s) => s.is_published);
    if (filter === 'draft') return surveys.filter((s) => !s.is_published);
    if (filter === 'responses') return [...surveys].sort((a, b) => Number(b.response_count || 0) - Number(a.response_count || 0));
    return surveys;
  })();

  const meta = VIEW_META[filter] ?? VIEW_META.default;

  const handleDeleteClick = (id, title) => setConfirmDialog({ open: true, id, title });

  const handleDeleteConfirm = async () => {
    const { id } = confirmDialog;
    setConfirmDialog({ open: false, id: null, title: '' });
    setActionLoading((p) => ({ ...p, [`${id}_delete`]: true }));
    try {
      await deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      showSuccess('Survey deleted successfully.');
    } catch {
      showError('Failed to delete survey. Please try again.');
    } finally {
      setActionLoading((p) => ({ ...p, [`${id}_delete`]: false }));
    }
  };

  const handlePublishToggle = async (survey) => {
    setActionLoading((p) => ({ ...p, [`${survey.id}_publish`]: true }));
    try {
      const res = await publishSurvey(survey.id);
      setSurveys((prev) =>
        prev.map((s) => (s.id === survey.id ? { ...s, is_published: res.data.is_published } : s))
      );
      showSuccess(res.data.is_published ? 'Survey published!' : 'Survey unpublished.');
    } catch {
      showError('Failed to update publish status.');
    } finally {
      setActionLoading((p) => ({ ...p, [`${survey.id}_publish`]: false }));
    }
  };

  const handleShare = (id) => {
    const url = `${window.location.origin}/surveys/${id}/take`;
    navigator.clipboard.writeText(url)
      .then(() => showInfo('Survey link copied to clipboard!'))
      .catch(() => showError('Could not copy link automatically.'));
  };

  return (
    <Box sx={{ maxWidth: 1152, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            {meta.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {meta.subtitle}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large" sx={{ px: 3 }}
          onClick={() => navigate('/surveys/new')}>
          Create Survey
        </Button>
      </Box>

      {/* Responses view: summary card at top */}
      {filter === 'responses' && !loading && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', color: 'white' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, py: '20px !important' }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.8)' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', lineHeight: 1 }}>
                {surveys.reduce((sum, s) => sum + Number(s.response_count || 0), 0)}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, mt: 0.5 }}>
                Total responses across {surveys.length} survey{surveys.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Cards grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Card><CardContent><Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredSurveys.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 10, px: 4, border: '2px dashed #e2e8f0' }}>
          <AssignmentIcon sx={{ fontSize: 80, color: '#e0e7ff', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            {filter === 'published' ? 'No published surveys' : filter === 'draft' ? 'No drafts' : 'No surveys yet'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {filter === 'published'
              ? 'Publish a survey to see it here.'
              : filter === 'draft'
              ? 'All your surveys are published.'
              : 'Create your first survey to get started.'}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} size="large"
            onClick={() => navigate('/surveys/new')}>
            Create Survey
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredSurveys.map((survey) => (
            <Grid item xs={12} md={6} lg={4} key={survey.id}>
              <Card sx={{
                display: 'flex', flexDirection: 'column', height: '100%',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(99,102,241,0.15)' },
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3, flex: 1, pr: 1 }}>
                      {survey.title}
                    </Typography>
                    <Chip
                      label={survey.is_published ? 'Published' : 'Draft'}
                      size="small"
                      sx={{
                        fontWeight: 600, fontSize: '0.7rem', flexShrink: 0,
                        bgcolor: survey.is_published ? '#d1fae5' : '#f1f5f9',
                        color: survey.is_published ? '#065f46' : '#475569',
                      }}
                    />
                  </Box>
                  {survey.description && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 2,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {survey.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: filter === 'responses' ? '#7c3aed' : 'text.secondary' }}>
                      <PeopleIcon sx={{ fontSize: 15 }} />
                      <Typography variant="caption" sx={{ fontWeight: filter === 'responses' ? 700 : 400 }}>
                        {survey.response_count || 0} response{Number(survey.response_count) !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <CalendarTodayIcon sx={{ fontSize: 13 }} />
                      <Typography variant="caption">
                        {new Date(survey.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <Divider />
                <CardActions sx={{ px: 2, py: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                  <Button size="small" variant="outlined" color="secondary" startIcon={<EditIcon />}
                    onClick={() => navigate(`/surveys/${survey.id}/edit`)}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="primary" startIcon={<BarChartIcon />}
                    onClick={() => navigate(`/surveys/${survey.id}/results`)}>
                    Results
                  </Button>
                  <Tooltip title={!survey.is_published ? 'Publish first to share' : 'Copy link'}>
                    <span>
                      <Button
                        size="small" variant="outlined" startIcon={<ShareIcon />}
                        disabled={!survey.is_published}
                        onClick={() => handleShare(survey.id)}
                        sx={{ color: '#0ea5e9', borderColor: '#0ea5e9', '&:hover': { borderColor: '#0284c7', bgcolor: '#f0f9ff' } }}
                      >
                        Share
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    size="small"
                    variant={survey.is_published ? 'outlined' : 'contained'}
                    color={survey.is_published ? 'warning' : 'success'}
                    disabled={!!actionLoading[`${survey.id}_publish`]}
                    onClick={() => handlePublishToggle(survey)}
                    sx={{ minWidth: 90 }}
                  >
                    {actionLoading[`${survey.id}_publish`] ? '...' : survey.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Tooltip title="Delete survey">
                    <IconButton
                      size="small" color="error"
                      disabled={!!actionLoading[`${survey.id}_delete`]}
                      onClick={() => handleDeleteClick(survey.id, survey.title)}
                      sx={{ ml: 'auto' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Survey"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: null, title: '' })}
      />

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

export default SurveysListPage;
