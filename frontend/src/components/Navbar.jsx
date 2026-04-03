import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isBuilder = location.pathname.includes('/surveys/');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Toolbar sx={{ maxWidth: 1152, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flexGrow: 1 }}
        >
          <AssignmentIcon sx={{ color: 'white', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
            SurveyTool
          </Typography>
        </Box>

        {!isBuilder && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/surveys/new')}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.5)',
              fontWeight: 700,
              px: 2.5,
              '&:hover': {
                backgroundColor: 'white',
                borderColor: 'white',
                color: '#6366f1',
              },
            }}
          >
            New Survey
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
