import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button, Chip,
  IconButton, Snackbar, Alert, Skeleton, Divider, Tooltip, Paper, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PublicIcon from '@mui/icons-material/Public';
import DraftsIcon from '@mui/icons-material/Drafts';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { deleteSurvey, publishSurvey } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSnackbar } from '../hooks/useSnackbar';
import { useSurveys } from '../context/SurveyContext';

const STAT_CARDS = (counts) => [
  {
    label: 'Total Surveys',
    value: counts.total,
    icon: <AssignmentIcon sx={{ fontSize: 26 }} />,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    light: '#ede9fe',
    textColor: '#6366f1',
  },
  {
    label: 'Published',
    value: counts.published,
    icon: <PublicIcon sx={{ fontSize: 26 }} />,
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    light: '#d1fae5',
    textColor: '#059669',
  },
  {
    label: 'Drafts',
    value: counts.drafts,
    icon: <DraftsIcon sx={{ fontSize: 26 }} />,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    light: '#fef3c7',
    textColor: '#d97706',
  },
  {
    label: 'Total Responses',
    value: counts.totalResponses,
    icon: <PeopleIcon sx={{ fontSize: 26 }} />,
    gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
    light: '#f3e8ff',
    textColor: '#7c3aed',
  },
];

const VIEW_META = {
  published: { title: 'Published Surveys', subtitle: 'Surveys currently live and accepting responses' },
  draft: { title: 'Draft Surveys', subtitle: 'Surveys not yet published' },
  responses: { title: 'Total Responses', subtitle: 'All surveys ranked by response count' },
  default: { title: 'Dashboard', subtitle: 'Manage and track all your surveys' },
};

function StatCard({ stat, loading }) {
  return (
    <Card sx={{
      position: 'relative', overflow: 'hidden', height: '100%',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' },
    }}>
      {/* Decorative circle */}
      <Box sx={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: stat.gradient, opacity: 0.12,
      }} />
      <CardContent sx={{ p: 3, pb: '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1, mb: 1.5 }}>
              {loading ? <Skeleton width={40} /> : stat.value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon sx={{ fontSize: 14, color: stat.textColor }} />
              <Typography variant="caption" sx={{ color: stat.textColor, fontWeight: 600 }}>
                All time
              </Typography>
            </Box>
          </Box>
          <Avatar sx={{ background: stat.gradient, width: 48, height: 48, boxShadow: `0 4px 14px ${stat.textColor}40` }}>
            {stat.icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

function SurveysListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter');

  const { surveys, setSurveys, loading, refresh, counts } = useSurveys();
  const [actionLoading, setActionLoading] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, title: '' });
  const { snackbar, showSuccess, showError, showInfo, hideSnackbar } = useSnackbar();

  useEffect(() => { refresh(); }, [refresh]);

  const filteredSurveys = (() => {
    if (filter === 'published') return surveys.filter((s) => s.is_published);
    if (filter === 'draft') return surveys.filter((s) => !s.is_published);
    if (filter === 'responses') return [...surveys].sort((a, b) => Number(b.response_count || 0) - Number(a.response_count || 0));
    return surveys;
  })();

  const meta = VIEW_META[filter] ?? VIEW_META.default;
  const statCards = STAT_CARDS(counts);

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
      setSurveys((prev) => prev.map((s) => s.id === survey.id ? { ...s, is_published: res.data.is_published } : s));
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
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

      {/* Welcome banner — only on Dashboard (no filter) */}
      {!filter && (
        <Paper elevation={0} sx={{
          mb: 4, p: { xs: 3, md: 4 }, borderRadius: 3, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)',
        }}>
          {/* Decorative blobs */}
          <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
          <Box sx={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />

          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px' }}>
                Welcome back 👋
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, mb: 2.5 }}>
                You have <strong style={{ color: 'white' }}>{counts.total}</strong> survey{counts.total !== 1 ? 's' : ''} — <strong style={{ color: 'white' }}>{counts.published}</strong> published, <strong style={{ color: 'white' }}>{counts.totalResponses}</strong> total responses.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/surveys/new')}
                sx={{ bgcolor: 'white', color: '#6366f1', fontWeight: 700, '&:hover': { bgcolor: '#f5f3ff' }, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
              >
                Create New Survey
              </Button>
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
              {[
                { label: 'Published', value: counts.published, bg: 'rgba(255,255,255,0.15)' },
                { label: 'Responses', value: counts.totalResponses, bg: 'rgba(255,255,255,0.1)' },
              ].map((s) => (
                <Box key={s.label} sx={{ textAlign: 'center', bgcolor: s.bg, borderRadius: 3, px: 3, py: 2, backdropFilter: 'blur(4px)' }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, lineHeight: 1 }}>{s.value}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, mt: 0.5 }}>{s.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Stats cards — only on Dashboard */}
      {!filter && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((stat) => (
            <Grid item xs={6} lg={3} key={stat.label}>
              <StatCard stat={stat} loading={loading} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Section header for filtered views */}
      {filter && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.4px' }}>
              {meta.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{meta.subtitle}</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/surveys/new')}>
            Create Survey
          </Button>
        </Box>
      )}

      {/* Responses summary banner */}
      {filter === 'responses' && !loading && (
        <Paper elevation={0} sx={{
          mb: 3, p: 3, borderRadius: 3,
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <PeopleIcon sx={{ fontSize: 28, color: 'white' }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {counts.totalResponses}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              Total responses across {surveys.length} survey{surveys.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Dashboard "All Surveys" label */}
      {!filter && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>
            All Surveys
            <Chip label={surveys.length} size="small" sx={{ ml: 1.5, bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }} />
          </Typography>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => navigate('/surveys/new')}
            sx={{ color: '#6366f1', borderColor: '#c7d2fe', '&:hover': { bgcolor: '#f5f3ff', borderColor: '#6366f1' } }}>
            Add Survey
          </Button>
        </Box>
      )}

      {/* Cards grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Card sx={{ height: 200 }}><CardContent><Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredSurveys.length === 0 ? (
        <Paper elevation={0} sx={{ textAlign: 'center', py: 10, px: 4, borderRadius: 3, border: '2px dashed #e2e8f0', bgcolor: 'transparent' }}>
          <Avatar sx={{ width: 72, height: 72, bgcolor: '#ede9fe', mx: 'auto', mb: 2 }}>
            <AssignmentIcon sx={{ fontSize: 36, color: '#6366f1' }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            {filter === 'published' ? 'No published surveys' : filter === 'draft' ? 'No drafts' : 'No surveys yet'}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
            {filter === 'published' ? 'Publish a survey to see it here.'
              : filter === 'draft' ? 'All your surveys are published.'
              : 'Create your first survey to start collecting responses.'}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/surveys/new')}>
            Create Survey
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSurveys.map((survey) => (
            <Grid item xs={12} md={6} lg={4} key={survey.id}>
              <Card sx={{
                display: 'flex', flexDirection: 'column', height: '100%',
                borderRadius: 3, border: '1px solid #f1f5f9',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(99,102,241,0.12)', borderColor: '#c7d2fe' },
                transition: 'all 0.2s ease',
              }}>
                {/* Card top accent bar */}
                <Box sx={{ height: 4, background: survey.is_published ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '12px 12px 0 0' }} />

                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.35, flex: 1, pr: 1, fontSize: 15 }}>
                      {survey.title}
                    </Typography>
                    <Chip
                      label={survey.is_published ? 'Live' : 'Draft'}
                      size="small"
                      sx={{
                        fontWeight: 700, fontSize: '0.68rem', flexShrink: 0, height: 22,
                        bgcolor: survey.is_published ? '#d1fae5' : '#fef3c7',
                        color: survey.is_published ? '#065f46' : '#92400e',
                      }}
                    />
                  </Box>

                  {survey.description && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 2, fontSize: 13, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {survey.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: filter === 'responses' ? '#f3e8ff' : '#f8fafc', borderRadius: 1.5, px: 1.5, py: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 13, color: filter === 'responses' ? '#7c3aed' : '#94a3b8' }} />
                      <Typography variant="caption" sx={{ fontWeight: filter === 'responses' ? 700 : 500, color: filter === 'responses' ? '#7c3aed' : '#64748b', fontSize: 11.5 }}>
                        {survey.response_count || 0} resp.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11.5 }}>
                        {new Date(survey.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <Divider sx={{ borderColor: '#f8fafc' }} />
                <CardActions sx={{ px: 2, py: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                  <Tooltip title="Edit">
                    <Button size="small" variant="outlined" color="secondary" startIcon={<EditIcon />}
                      onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                      sx={{ fontSize: 12 }}>
                      Edit
                    </Button>
                  </Tooltip>
                  <Tooltip title="View Results">
                    <Button size="small" variant="outlined" color="primary" startIcon={<BarChartIcon />}
                      onClick={() => navigate(`/surveys/${survey.id}/results`)}
                      sx={{ fontSize: 12 }}>
                      Results
                    </Button>
                  </Tooltip>
                  <Tooltip title={!survey.is_published ? 'Publish first to share' : 'Copy link'}>
                    <span>
                      <Button size="small" variant="outlined" startIcon={<ShareIcon />}
                        disabled={!survey.is_published}
                        onClick={() => handleShare(survey.id)}
                        sx={{ fontSize: 12, color: '#0ea5e9', borderColor: '#bae6fd', '&:hover': { borderColor: '#0ea5e9', bgcolor: '#f0f9ff' } }}>
                        Share
                      </Button>
                    </span>
                  </Tooltip>
                  <Button size="small"
                    variant={survey.is_published ? 'outlined' : 'contained'}
                    color={survey.is_published ? 'warning' : 'success'}
                    disabled={!!actionLoading[`${survey.id}_publish`]}
                    onClick={() => handlePublishToggle(survey)}
                    sx={{ fontSize: 12, minWidth: 86 }}>
                    {actionLoading[`${survey.id}_publish`] ? '...' : survey.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error"
                      disabled={!!actionLoading[`${survey.id}_delete`]}
                      onClick={() => handleDeleteClick(survey.id, survey.title)}
                      sx={{ ml: 'auto', '&:hover': { bgcolor: '#fee2e2' } }}>
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
        message={`Are you sure you want to delete "${confirmDialog.title}"? This cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDialog({ open: false, id: null, title: '' })}
      />

      <Snackbar open={snackbar.open} autoHideDuration={snackbar.severity === 'error' ? 5000 : 3000}
        onClose={hideSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SurveysListPage;
