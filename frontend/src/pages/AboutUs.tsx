// src/pages/AboutUs.tsx
import { Box, Container, Typography, Paper, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Slider from 'react-slick';
import MDEditor from '@uiw/react-md-editor';
import { settingsService } from '../services/settingsService';
import type { Settings } from '../types/settings';
import toast from 'react-hot-toast';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export default function AboutUs() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsService.getSettings();
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error(t('errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [t]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary" align="center">
          {t('errors.fetchFailed')}
        </Typography>
      </Container>
    );
  }

  const carouselSettings = {
    dots: true,
    infinite: settings.aboutUsMediaUrls?.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
    adaptiveHeight: true,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Title */}
      <Typography
        variant="h2"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 700,
          mb: 4,
          textAlign: 'center',
        }}
      >
        {settings.aboutUsTitle || t('aboutUs.defaultTitle')}
      </Typography>

      {/* Content */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 2,
        }}
      >
        <Box
          data-color-mode="light"
          sx={{
            '& .wmde-markdown': {
              backgroundColor: 'transparent !important',
              color: 'inherit',
              fontFamily: 'inherit',
            },
            '& .wmde-markdown h1': {
              fontSize: '2rem',
              fontWeight: 700,
              mt: 2,
              mb: 2,
            },
            '& .wmde-markdown h2': {
              fontSize: '1.75rem',
              fontWeight: 600,
              mt: 2,
              mb: 1.5,
            },
            '& .wmde-markdown h3': {
              fontSize: '1.5rem',
              fontWeight: 600,
              mt: 1.5,
              mb: 1,
            },
            '& .wmde-markdown p': {
              fontSize: '1.1rem',
              lineHeight: 1.8,
              mb: 2,
            },
            '& .wmde-markdown ul, & .wmde-markdown ol': {
              fontSize: '1.1rem',
              lineHeight: 1.8,
              mb: 2,
              pl: 3,
            },
            '& .wmde-markdown a': {
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            '& .wmde-markdown img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 1,
              my: 2,
            },
            '& .wmde-markdown blockquote': {
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              pl: 2,
              py: 1,
              my: 2,
              fontStyle: 'italic',
              color: 'text.secondary',
            },
            '& .wmde-markdown code': {
              backgroundColor: 'action.hover',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.9em',
            },
            '& .wmde-markdown pre': {
              backgroundColor: 'action.hover',
              padding: 2,
              borderRadius: 1,
              overflow: 'auto',
              my: 2,
            },
          }}
        >
          <MDEditor.Markdown
            source={settings.aboutUsContent || t('aboutUs.noContent')}
            style={{ backgroundColor: 'transparent' }}
          />
        </Box>
      </Paper>

      {/* Media Carousel */}
      {settings.aboutUsMediaUrls && settings.aboutUsMediaUrls.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            mt: 4,
            overflow: 'hidden',
            borderRadius: 2,
            '& .slick-slider': {
              '& .slick-prev, & .slick-next': {
                zIndex: 1,
                '&:before': {
                  fontSize: '40px',
                  opacity: 0.75,
                },
              },
              '& .slick-prev': {
                left: 25,
              },
              '& .slick-next': {
                right: 25,
              },
              '& .slick-dots': {
                bottom: 25,
                '& li button:before': {
                  fontSize: '12px',
                  opacity: 0.5,
                },
                '& li.slick-active button:before': {
                  opacity: 1,
                },
              },
            },
          }}
        >
          <Slider {...carouselSettings}>
            {settings.aboutUsMediaUrls.map((url, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: { xs: '300px', sm: '400px', md: '500px' },
                }}
              >
                <Box
                  component="img"
                  src={url}
                  alt={`${settings.aboutUsTitle} - ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
              </Box>
            ))}
          </Slider>
        </Paper>
      )}
    </Container>
  );
}
