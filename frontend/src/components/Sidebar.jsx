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
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
    filter: null,
    color: '#6366f1',
    bg: '#ede9fe',
    bgHover: '#ddd6fe',
  },
  {
    label: 'Published',
    icon: <PublicIcon />,
    path: '/?filter=published',
    filter: 'published',
    color: '#059669',
    bg: '#d1fae5',
    bgHover: '#a7f3d0',
  },
  {
    label: 'Drafts',
    icon: <DraftsIcon />,
    path: '/?filter=draft',
    filter: 'draft',
    color: '#d97706',
    bg: '#fef3c7',
    bgHover: '#fde68a',
  },
  {
    label: 'Total Responses',
    icon: <PeopleIcon />,
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        px: collapsed ? 1 : 2.5, py: 2,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        minHeight: 64,
      }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => handleNav('/')}>
            <AssignmentIcon sx={{ color: 'white', fontSize: 26 }} />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.3px', fontSize: 17 }}>
              SurveyTool
            </Typography>
          </Box>
        )}
        {collapsed && (
          <Tooltip title="SurveyTool" placement="right">
            <AssignmentIcon sx={{ color: 'white', fontSize: 26, cursor: 'pointer' }} onClick={() => handleNav('/')} />
          </Tooltip>
        )}
        {isDesktop && (
          <IconButton size="small" onClick={() => setCollapsed((c) => !c)}
            sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }, ml: collapsed ? 0 : 1 }}>
            {collapsed ? <MenuIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: '#e2e8f0' }} />

      {/* Nav items */}
      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1.5, py: 1.5 }}>
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
                  px: collapsed ? 1 : 1.5,
                  minHeight: 44,
                  bgcolor: active ? item.bg : 'transparent',
                  '&:hover': { bgcolor: active ? item.bgHover : '#f1f5f9' },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: active ? item.color : '#64748b', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? item.color : '#374151' }}
                    />
                    {badge !== null && badge !== undefined && (
                      <Chip
                        label={badge}
                        size="small"
                        sx={{
                          height: 20, fontSize: '0.7rem', fontWeight: 700,
                          bgcolor: active ? item.color : '#e2e8f0',
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
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none', boxShadow: '4px 0 20px rgba(0,0,0,0.08)' },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width, boxSizing: 'border-box', border: 'none', boxShadow: '1px 0 0 #e2e8f0', transition: 'width 0.2s ease' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export default Sidebar;
