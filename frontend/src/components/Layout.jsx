import React, { useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Mobile top bar */}
        {!isDesktop && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
              <AssignmentIcon sx={{ mr: 1, fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.3px' }}>
                SurveyTool
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, width: '100%', mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
