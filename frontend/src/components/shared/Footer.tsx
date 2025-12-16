// src/components/Footer.tsx
import { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Divider, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { settingsService } from '../../services/settingsService';
import type { Settings } from '../../types/settings';

export default function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsService.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const textColor = theme.palette.primary.contrastText;

  const footerLinks = settings ? [
    { label: t('footer.aboutUs'), path: '/aboutus' },
    { label: t('footer.contact'), path: '/contact' },
    { label: t('footer.terms'), path: '/terms' },
    { label: t('footer.privacy'), path: '/privacy' },
  ] : [];

  if (loading) {
    return (
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          background: theme.palette.mode === 'light'
            ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
          color: textColor,
          py: 6,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: textColor }} />
      </Box>
    );
  }

  if (!settings) return null;

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        background: theme.palette.mode === 'light'
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
          : `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        color: textColor,
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              {settings.companyName}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              {settings.companyDescription}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {settings.facebookUrl && (
                <IconButton
                  component="a"
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ 
                    color: textColor,
                    '&:hover': { 
                      color: theme.palette.primary.light,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    } 
                  }}
                  aria-label="Facebook"
                >
                  <FacebookIcon />
                </IconButton>
              )}
              {settings.instagramUrl && (
                <IconButton
                  component="a"
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ 
                    color: textColor,
                    '&:hover': { 
                      color: theme.palette.primary.light,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    } 
                  }}
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </IconButton>
              )}
              {settings.twitterUrl && (
                <IconButton
                  component="a"
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ 
                    color: textColor,
                    '&:hover': { 
                      color: theme.palette.primary.light,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    } 
                  }}
                  aria-label="Twitter"
                >
                  <TwitterIcon />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              {t('footer.quickLinks')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: textColor,
                    textDecoration: 'none',
                    opacity: 0.9,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      opacity: 1,
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={700}>
              {t('footer.contact')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {settings.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" sx={{ color: theme.palette.primary.light }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {settings.email}
                  </Typography>
                </Box>
              )}
              {settings.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" sx={{ color: theme.palette.primary.light }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {settings.phone}
                  </Typography>
                </Box>
              )}
              {settings.address && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon fontSize="small" sx={{ color: theme.palette.primary.light }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {settings.address}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider 
          sx={{ 
            my: 4, 
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }} 
        />

        {/* Copyright */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} {settings.companyName}. {t('footer.rights')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}