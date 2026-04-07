import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Button, Divider, IconButton, Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'All Surveys', icon: <ListAltIcon />, path: '/', exact: true },
  { label: 'New Survey', icon: <AddCircleOutlineIcon />, path: '/surveys/new' },
];

function Sidebar({ mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/') return location.pathname.startsWith(path);
    return false;
  };

  const handleNav = (path) => {
    navigate(path);
    if (!isDesktop) onMobileClose();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Logo */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 1 : 2.5, py: 2,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          minHeight: 64,
        }}
      >
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
          <IconButton size="small" onClick={() => setCollapsed((c) => !c)} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }, ml: collapsed ? 0 : 1 }}>
            {collapsed ? <MenuIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: '#e2e8f0' }} />

      {/* Nav items */}
      <List sx={{ flex: 1, px: collapsed ? 0.5 : 1.5, py: 1.5 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Tooltip key={item.label} title={collapsed ? item.label : ''} placement="right">
              <ListItemButton
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: 2, mb: 0.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 1.5,
                  minHeight: 44,
                  bgcolor: active ? '#ede9fe' : 'transparent',
                  '&:hover': { bgcolor: active ? '#ddd6fe' : '#f1f5f9' },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: active ? '#6366f1' : '#64748b', justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#6366f1' : '#374151' }}
                  />
                )}
                {!collapsed && active && (
                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#6366f1' }} />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#e2e8f0' }} />

      {/* Create button */}
      {!collapsed && (
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth variant="contained" startIcon={<AddCircleOutlineIcon />}
            onClick={() => handleNav('/surveys/new')}
            sx={{ borderRadius: 2, py: 1.2, fontWeight: 700 }}
          >
            New Survey
          </Button>
        </Box>
      )}
      {collapsed && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <Tooltip title="New Survey" placement="right">
            <IconButton onClick={() => handleNav('/surveys/new')} sx={{ bgcolor: '#ede9fe', color: '#6366f1', '&:hover': { bgcolor: '#ddd6fe' } }}>
              <AddCircleOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
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

      {/* Desktop drawer */}
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
