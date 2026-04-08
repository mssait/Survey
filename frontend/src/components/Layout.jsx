import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, IconButton, Typography, Avatar, Tooltip,
  Badge, useMediaQuery, useTheme, Breadcrumbs, Link,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { useSurveys } from '../context/SurveyContext';

// Derive a readable page label from route + filter
function usePageTitle() {
  const location = useLocation();
  const filter = new URLSearchParams(location.search).get('filter');
  if (location.pathname === '/surveys/new') return { crumb: 'New Survey', title: 'Create New Survey' };
  if (location.pathname.endsWith('/edit')) return { crumb: 'Edit Survey', title: 'Edit Survey' };
  if (location.pathname.endsWith('/results')) return { crumb: 'Results', title: 'Survey Results' };
  if (filter === 'published') return { crumb: 'Published', title: 'Published Surveys' };
  if (filter === 'draft') return { crumb: 'Drafts', title: 'Draft Surveys' };
  if (filter === 'responses') return { crumb: 'Responses', title: 'Total Responses' };
  return { crumb: 'Dashboard', title: 'Dashboard' };
}

function TopNavbar({ onMenuClick }) {
  const { title, crumb } = usePageTitle();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        borderBottom: '1px solid #f1f5f9',
        zIndex: theme.zIndex.drawer - 1,
        color: '#0f172a',
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: '60px !important', px: { xs: 2, md: 3 } }}>
        {/* Mobile hamburger */}
        {!isDesktop && (
          <IconButton edge="start" onClick={onMenuClick} sx={{ color: '#64748b', mr: 0.5 }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* Breadcrumb / Page Title */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {isDesktop && (
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" sx={{ color: '#cbd5e1' }} />} sx={{ mb: 0.25 }}>
              <Link underline="hover" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                Home
              </Link>
              <Typography sx={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>{crumb}</Typography>
            </Breadcrumbs>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: 16, md: 17 }, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
            {title}
          </Typography>
        </Box>

        {/* Right actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Help">
            <IconButton size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#6366f1', bgcolor: '#f5f3ff' } }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#6366f1', bgcolor: '#f5f3ff' } }}>
              <Badge badgeContent={0} color="error">
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Profile">
            <Avatar
              sx={{ width: 32, height: 32, ml: 1, cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: 13, fontWeight: 700 }}
            >
              U
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { counts } = useSurveys();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6fb' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} counts={counts} />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopNavbar onMenuClick={() => setMobileOpen(true)} />

        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1280, width: '100%', mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
