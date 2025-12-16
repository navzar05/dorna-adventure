// src/components/admin/SettingsManagement.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { MuiTelInput } from 'mui-tel-input';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';
import type { Settings } from '../../types/settings';

interface ValidationErrors {
  companyName?: string;
  email?: string;
  phone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  aboutUsUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

export default function SettingsManagement() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      setSettings(response.data);
    } catch (error) {
      toast.error(t('admin.settings.loadError'));
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      // Allow relative URLs (starting with /)
      if (url.startsWith('/')) return true;
      
      // Validate absolute URLs
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    // MuiTelInput handles validation, but we can add extra checks
    // Phone should be at least 10 characters with country code
    return phone.replace(/\s/g, '').length >= 10;
  };

  const validateSettings = (): boolean => {
    if (!settings) return false;

    const newErrors: ValidationErrors = {};

    // Company name is required
    if (!settings.companyName.trim()) {
      newErrors.companyName = t('admin.settings.validation.companyNameRequired');
    }

    // Validate email
    if (settings.email && !validateEmail(settings.email)) {
      newErrors.email = t('admin.settings.validation.invalidEmail');
    }

    // Validate phone
    if (settings.phone && !validatePhone(settings.phone)) {
      newErrors.phone = t('admin.settings.validation.invalidPhone');
    }

    // Validate URLs
    if (settings.facebookUrl && !validateUrl(settings.facebookUrl)) {
      newErrors.facebookUrl = t('admin.settings.validation.invalidUrl');
    }
    if (settings.instagramUrl && !validateUrl(settings.instagramUrl)) {
      newErrors.instagramUrl = t('admin.settings.validation.invalidUrl');
    }
    if (settings.twitterUrl && !validateUrl(settings.twitterUrl)) {
      newErrors.twitterUrl = t('admin.settings.validation.invalidUrl');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!settings) return;

    if (!validateSettings()) {
      toast.error(t('admin.settings.validation.fixErrors'));
      return;
    }

    try {
      setSaving(true);
      await settingsService.updateSettings(settings);
      toast.success(t('admin.settings.saveSuccess'));
      setErrors({});
    } catch (error) {
      toast.error(t('admin.settings.saveError'));
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Settings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    
    // Clear error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handlePhoneChange = (value: string) => {
    if (!settings) return;
    setSettings({ ...settings, phone: value });
    
    // Clear error when user changes phone
    if (errors.phone) {
      setErrors({ ...errors, phone: undefined });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return null;
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {t('admin.settings.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('admin.settings.saving') : t('admin.settings.save')}
        </Button>
      </Box>

      {hasErrors && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('admin.settings.validation.fixErrors')}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Company Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              {t('admin.settings.companyInfo')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label={t('admin.settings.companyName')}
              value={settings.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              fullWidth
              required
              error={!!errors.companyName}
              helperText={errors.companyName}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label={t('admin.settings.companyDescription')}
              value={settings.companyDescription}
              onChange={(e) => handleChange('companyDescription', e.target.value)}
              fullWidth
              multiline
              rows={3}
              helperText={t('admin.settings.optional')}
            />
          </Grid>

          {/* Contact Information */}
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              {t('admin.settings.contactInfo')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={t('admin.settings.email')}
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              fullWidth
              type="email"
              error={!!errors.email}
              helperText={errors.email || t('admin.settings.optional')}
              placeholder="info@company.com"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <MuiTelInput
              label={t('admin.settings.phone')}
              value={settings.phone}
              onChange={handlePhoneChange}
              defaultCountry="RO"
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone || t('admin.settings.optional')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={t('admin.settings.address')}
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              fullWidth
              helperText={t('admin.settings.optional')}
              placeholder="Bucovina, România"
            />
          </Grid>

          {/* Social Media */}
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              {t('admin.settings.socialMedia')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={t('admin.settings.facebook')}
              value={settings.facebookUrl}
              onChange={(e) => handleChange('facebookUrl', e.target.value)}
              fullWidth
              placeholder="https://facebook.com/yourpage"
              error={!!errors.facebookUrl}
              helperText={errors.facebookUrl || t('admin.settings.optional')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={t('admin.settings.instagram')}
              value={settings.instagramUrl}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              fullWidth
              placeholder="https://instagram.com/yourpage"
              error={!!errors.instagramUrl}
              helperText={errors.instagramUrl || t('admin.settings.optional')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={t('admin.settings.twitter')}
              value={settings.twitterUrl}
              onChange={(e) => handleChange('twitterUrl', e.target.value)}
              fullWidth
              placeholder="https://twitter.com/yourpage"
              error={!!errors.twitterUrl}
              helperText={errors.twitterUrl || t('admin.settings.optional')}
            />
          </Grid>

        </Grid>
      </Paper>
    </Box>
  );
}