// src/pages/Landing.tsx
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Explore as ExploreIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <Box
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
      }}
    >
        {/* Background Video */}
        <Box
        component="video"
        autoPlay
        loop
        muted
        playsInline
        sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover', // This is the key property
            objectPosition: 'center',
            zIndex: -2,
            }}
        >
        {/* Note: Files in /public are served from root, so use /landing.mp4 not /public/landing.mp4 */}
        <source src="https://pub-f66c9e3e8f8547aab3ba20f2abafee46.r2.dev/images/landing.mp4" type="video/mp4" />
        <source src="https://pub-f66c9e3e8f8547aab3ba20f2abafee46.r2.dev/images/landing.webm" type="video/webm" />
        Your browser does not support the video tag.
        </Box>

      {/* Dark Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: -1,
        }}
      />

      {/* Content */}
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: 'white',
          zIndex: 1,
        }}
      >
        {/* Title */}
        <Typography
            variant="h1"
            component="h1"
            sx={{
                fontWeight: 800,
                fontSize: { xs: '3rem', sm: '4rem', md: '5rem', lg: '6rem' },
                mb: 2,
                textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                letterSpacing: '0.02em',
            }}
            >
            {t('landing.title')}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 400,
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: 6,
            textShadow: '1px 1px 6px rgba(0, 0, 0, 0.8)',
            color: '#d8f3dc',
            maxWidth: '800px',
          }}
        >
          {t('landing.subtitle')}
        </Typography>

        {/* Call to Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/home')}
            startIcon={<ExploreIcon />}
            sx={{
              py: 2,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
                boxShadow: '0 6px 30px rgba(45, 106, 79, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {t('landing.explore')}
          </Button>

          {!isAuthenticated && (
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/register')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                borderColor: 'rgba(255, 255, 255, 0.8)',
                color: 'white',
                borderWidth: 2,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('landing.getStarted')}
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
}