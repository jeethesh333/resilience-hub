import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        mt: 8, 
        p: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Typography variant="h4" gutterBottom>
          Test Page
        </Typography>
        <Typography variant="body1" paragraph>
          If you can see this page, the app is working correctly.
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Go to Welcome
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default TestPage; 