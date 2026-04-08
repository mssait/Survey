import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, IconButton, Tooltip, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PublicIcon from '@mui/icons-material/Public';
import DraftsIcon from '@mui/icons-material/Drafts';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

export const SIDEBAR_WIDTH = 248;
export const SIDEBAR_COLLAPSED_WIDTH = 68;

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon fontSize="small" />,
    path: '/',
    filter: null,
    color: '#6366f1',
    bg: '#ede9fe',
    bgHover: '#ddd6fe',
  },
  {
    label: 'Published',
    icon: <PublicIcon fontSize="small" />,
    path: '/?filter=published',
    filter: 'published',
    color: '#059669',
    bg: '#d1fae5',
    bgHover: '#a7f3d0',
  },
  {
    label: 'Drafts',
    icon: <DraftsIcon fontSize="small" />,
    path: '/?filter=draft',
    filter: 'draft',
    color: '#d97706',
    bg: '#fef3c7',
    bgHover: '#fde68a',
  },
  {
    label: 'Responses',
    icon: <PeopleIcon fontSize="small" />,
    path: '/?filter=responses',
    filter: 'responses',
    color: '#7c3aed',
    bg: '#ede9fe',
    bgHover: '#ddd6fe',
  },
];

function Sidebar({ mobileOpen, onMobileClose, counts }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const currentFilter = new URLSearchParams(location.search).get('filter');
  const isNewSurveyActive = location.pathname === '/surveys/new';

  const isActive = (item) => {
    if (item.filter === null) return location.pathname === '/' && !currentFilter;
    return currentFilter === item.filter;
  };

  const handleNav = (path) => {
    navigate(path);
    if (!isDesktop) onMobileClose();
  };

  const getBadge = (filter) => {
    if (!counts) return null;
    if (filter === 'published') return counts.published;
    if (filter === 'draft') return counts.drafts;
    if (filter === 'responses') return counts.totalResponses;
    return counts.total;
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: '#ffffff' }}>

      {/* Logo / Brand */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        px: collapsed ? 1.5 : 3, py: 2.5,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        minHeight: 68,
      }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => handleNav('/')}>
            <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AssignmentIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.5px', fontSize: 16 }}>
              SurveyTool
            </Typography>
          </Box>
        )}
        {collapsed && (
          <Tooltip title="SurveyTool" placement="right">
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleNav('/')}>
              <AssignmentIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
          </Tooltip>
        )}
        {isDesktop && (
          <IconButton size="small" onClick={() => setCollapsed((c) => !c)}
            sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.12)' }, ml: collapsed ? 0 : 0.5 }}>
            {collapsed ? <MenuIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* Nav section */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: collapsed ? 1 : 2, pt: 2, pb: 1 }}>

        {/* New Survey — special CTA item */}
        <Tooltip title={collapsed ? 'New Survey' : ''} placement="right">
          <ListItemButton
            onClick={() => handleNav('/surveys/new')}
            sx={{
              borderRadius: 2.5, mb: 2,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1.5 : 2,
              minHeight: 46,
              background: isNewSurveyActive
                ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 6px 20px rgba(99,102,241,0.45)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 32, color: 'white', justifyContent: 'center' }}>
              <AddCircleIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="New Survey"
                primaryTypographyProps={{ fontSize: 14, fontWeight: 700, color: 'white' }}
              />
            )}
          </ListItemButton>
        </Tooltip>

        {/* Section label */}
        {!collapsed && (
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', px: 1.5, mb: 1, display: 'block' }}>
            Overview
          </Typography>
        )}

        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const badge = getBadge(item.filter);
            return (
              <Tooltip key={item.label} title={collapsed ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => handleNav(item.path)}
                  sx={{
                    borderRadius: 2, mb: 0.5,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1.5 : 1.5,
                    minHeight: 42,
                    bgcolor: active ? item.bg : 'transparent',
                    '&:hover': { bgcolor: active ? item.bgHover : '#f8fafc' },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, color: active ? item.color : '#94a3b8', justifyContent: 'center' }}>
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? item.color : '#475569' }}
                      />
                      {badge !== null && badge !== undefined && (
                        <Chip
                          label={badge}
                          size="small"
                          sx={{
                            height: 20, fontSize: '0.68rem', fontWeight: 700,
                            bgcolor: active ? item.color : '#f1f5f9',
                            color: active ? 'white' : '#64748b',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      )}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Divider sx={{ borderColor: '#f1f5f9' }} />
      <Box sx={{ px: collapsed ? 1 : 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Typography sx={{ color: 'white', fontSize: 13, fontWeight: 700 }}>U</Typography>
        </Box>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: 13, lineHeight: 1.3 }}>User</Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 11 }}>Admin</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.1)' },
        }}>
        {drawerContent}
      </Drawer>

      <Drawer variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width, flexShrink: 0,
          '& .MuiDrawer-paper': { width, boxSizing: 'border-box', border: 'none', borderRight: '1px solid #f1f5f9', transition: 'width 0.2s ease' },
        }}
        open>
        {drawerContent}
      </Drawer>
    </>
  );
}

export default Sidebar;
