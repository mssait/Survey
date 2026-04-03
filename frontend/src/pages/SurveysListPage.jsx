import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button, Chip,
  IconButton, Snackbar, Alert, Skeleton, Divider, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DraftsIcon from '@mui/icons-material/Drafts';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getSurveys, deleteSurvey, publishSurvey } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';

const buildStats = (surveys) => {
  const published = surveys.filter((s) => s.is_published).length;
  const drafts = surveys.length - published;
  const totalResponses = surveys.reduce((sum, s) => sum + Number(s.response_count || 0), 0);
  return [
    {
      label: 'Total Surveys', value: surveys.length,
      icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
    {
      label: 'Published', value: published,
      icon: <PublicIcon sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      label: 'Drafts', value: drafts,
      icon: <DraftsIcon sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    {
      label: 'Total Responses', value: totalResponses,
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    },
  ];
};

function SurveysListPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, title: '' });
  const { snackbar, showSuccess, showError, showInfo, hideSnackbar } = useSnackbar();

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSurveys();
      setSurveys(res.data);
    } catch {
      showError('Failed to load surveys. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetchSurveys(); }, [fetchSurveys]);

  const handleDeleteClick = (id, title) => {
    setConfirmDialog({ open: true, id, title });
  };

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

  const stats = buildStats(surveys);

  return (
    <Box sx={{ maxWidth: 1152, mx: 'auto', px: { xs: 2, sm: 3 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            My Surveys
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and track your surveys
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large" sx={{ px: 3 }}
          onClick={() => navigate('/surveys/new')}>
          Create Survey
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <Card sx={{
              background: stat.gradient, color: 'white',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' },
            }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: '16px !important' }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1, color: 'white' }}>
                    {loading ? '—' : stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5, fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </Box>
                <Box sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>{stat.icon}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Survey Cards Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Card><CardContent><Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      ) : surveys.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 10, px: 4, border: '2px dashed #e2e8f0' }}>
          <AssignmentIcon sx={{ fontSize: 80, color: '#e0e7ff', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
            No surveys yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Create your first survey to start collecting responses.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} size="large"
            onClick={() => navigate('/surveys/new')}>
            Create Your First Survey
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {surveys.map((survey) => (
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
                  <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 15 }} />
                      <Typography variant="caption">
                        {survey.response_count || 0} response{Number(survey.response_count) !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
