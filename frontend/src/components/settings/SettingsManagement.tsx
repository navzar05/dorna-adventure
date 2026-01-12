// src/components/admin/SettingsManagement.tsx
import React from 'react';
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
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { MuiTelInput } from 'mui-tel-input';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import MDEditor from '@uiw/react-md-editor';
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

interface FileWithPreview extends File {
  preview?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function SettingsManagement() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [currentTab, setCurrentTab] = useState(0);

  // Media file management
  const [mediaFiles, setMediaFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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

      // Upload new media files first
      const uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        setUploadingFiles(true);
        const totalFiles = mediaFiles.length;
        let uploadedCount = 0;
        const failedUploads: string[] = [];

        for (const file of mediaFiles) {
          try {
            const response = await settingsService.uploadAboutUsMedia(file);
            uploadedUrls.push(response.data.url);
            uploadedCount++;
            setUploadProgress((uploadedCount / totalFiles) * 100);
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            failedUploads.push(file.name);
          }
        }

        setUploadingFiles(false);
        setUploadProgress(0);

        if (failedUploads.length > 0) {
          toast.error(
            `${uploadedCount}/${totalFiles} files uploaded. Failed: ${failedUploads.join(', ')}`
          );
        } else if (uploadedCount > 0) {
          toast.success(`${uploadedCount} ${t('admin.messages.filesUploadedSuccessfully')}`);
        }
      }

      // Combine existing URLs with newly uploaded ones
      const allMediaUrls = [
        ...(settings.aboutUsMediaUrls || []),
        ...uploadedUrls,
      ];

      // Save settings with all media URLs
      await settingsService.updateSettings({
        ...settings,
        aboutUsMediaUrls: allMediaUrls,
      });

      // Clean up object URLs
      mediaFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });

      // Clear uploaded files and refresh settings
      setMediaFiles([]);
      await fetchSettings();

      toast.success(t('admin.settings.saveSuccess'));
      setErrors({});
    } catch (error) {
      toast.error(t('admin.settings.saveError'));
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
      setUploadingFiles(false);
      setUploadProgress(0);
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

  // Handle media file selection
  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileWithPreview[] = Array.from(files).map(file => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });

    setMediaFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  // Remove media file from new uploads
  const handleRemoveNewMedia = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Remove existing media URL
  const handleRemoveExistingMedia = (index: number) => {
    if (!settings) return;
    const updatedUrls = settings.aboutUsMediaUrls.filter((_, i) => i !== index);
    setSettings({ ...settings, aboutUsMediaUrls: updatedUrls });
  };

  // Handle markdown editor change
  const handleEditorChange = (value?: string) => {
    if (!settings) return;
    setSettings({ ...settings, aboutUsContent: value || '' });
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
          disabled={saving || uploadingFiles}
        >
          {saving || uploadingFiles ? t('admin.settings.saving') : t('admin.settings.save')}
        </Button>
      </Box>

      {hasErrors && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('admin.settings.validation.fixErrors')}
        </Alert>
      )}

      {uploadingFiles && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            {t('admin.messages.uploadingFiles')} ({Math.round(uploadProgress)}%)
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      <Paper sx={{ p: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('admin.settings.generalTab')} />
          <Tab label={t('admin.settings.aboutUsTab')} />
        </Tabs>

        {currentTab === 0 && (
          <Box sx={{ py: 3 }}>
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
          </Box>
        )}

        {currentTab === 1 && (
          <Box sx={{ py: 3 }}>
            <Grid container spacing={3}>
            {/* About Us Title */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                {t('admin.settings.aboutUsSection')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label={t('admin.settings.aboutUsTitle')}
                value={settings.aboutUsTitle || ''}
                onChange={(e) => handleChange('aboutUsTitle', e.target.value)}
                fullWidth
                helperText={t('admin.settings.optional')}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('admin.settings.aboutUsContent')}
              </Typography>
              <Box 
                data-color-mode={theme.palette.mode}
                sx={{
                  '& .w-md-editor': {
                    backgroundColor: `${theme.palette.background.paper} !important`,
                    color: `${theme.palette.text.primary} !important`,
                  },
                  '& .w-md-editor-toolbar': {
                    backgroundColor: `${theme.palette.background.default} !important`,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  '& .w-md-editor-toolbar button': {
                    color: `${theme.palette.text.primary} !important`,
                  },
                  '& .w-md-editor-toolbar button:hover': {
                    backgroundColor: `${theme.palette.action.hover} !important`,
                  },
                  '& .w-md-editor-text-pre > code': {
                    color: `${theme.palette.text.primary} !important`,
                  },
                  '& .w-md-editor-preview': {
                    backgroundColor: `${theme.palette.background.paper} !important`,
                    color: `${theme.palette.text.primary} !important`,
                  },
                  '& .wmde-markdown': {
                    backgroundColor: `${theme.palette.background.paper} !important`,
                    color: `${theme.palette.text.primary} !important`,
                  },
                  '& .wmde-markdown *': {
                    color: `${theme.palette.text.primary} !important`,
                  },
                  '& .w-md-editor-bar': {
                    backgroundColor: `${theme.palette.divider} !important`,
                  },
                  // Fix textarea placeholder
                  '& .w-md-editor-text-input::placeholder': {
                    color: `${theme.palette.text.secondary} !important`,
                    opacity: 0.7,
                  },
                }}
              >
                <MDEditor
                  value={settings.aboutUsContent || ''}
                  onChange={handleEditorChange}
                  height={400}
                  preview="live"
                  hideToolbar={false}
                  enableScroll={true}
                  visibleDragbar={true}
                  textareaProps={{
                    placeholder: 'Enter your content here using Markdown formatting...'
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('admin.settings.optional')} - Supports Markdown formatting
              </Typography>
            </Grid>

            {/* Media Section */}
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon color="primary" />
                  {t('admin.settings.aboutUsMedia')}
                  {(mediaFiles.length + (settings.aboutUsMediaUrls?.length || 0)) > 0 && (
                    <Chip
                      label={mediaFiles.length + (settings.aboutUsMediaUrls?.length || 0)}
                      size="small"
                      color="primary"
                    />
                  )}
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  disabled={saving || uploadingFiles}
                >
                  {t('admin.settings.addImages')}
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleMediaSelect}
                  />
                </Button>
              </Box>
              <Divider sx={{ mb: 2, mt: 1 }} />
            </Grid>

            {/* New Files to Upload */}
            {mediaFiles.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  {t('admin.settings.newMedia')} ({mediaFiles.length})
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List>
                    {mediaFiles.map((file, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: index < mediaFiles.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                        }}
                      >
                        {file.preview && (
                          <Box
                            component="img"
                            src={file.preview}
                            alt={file.name}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 1,
                              mr: 2,
                            }}
                          />
                        )}
                        <ListItemText
                          primary={file.name}
                          secondary={formatFileSize(file.size)}
                        />
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveNewMedia(index)}
                          color="error"
                          disabled={saving || uploadingFiles}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}

            {/* Existing Media */}
            {settings.aboutUsMediaUrls && settings.aboutUsMediaUrls.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('admin.settings.existingMedia')} ({settings.aboutUsMediaUrls.length})
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List>
                    {settings.aboutUsMediaUrls.map((url, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: index < settings.aboutUsMediaUrls!.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                        }}
                      >
                        <Box
                          component="img"
                          src={url}
                          alt={`Media ${index + 1}`}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            mr: 2,
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <ListItemText
                          primary={url.split('/').pop() || url}
                          secondary={url}
                        />
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveExistingMedia(index)}
                          color="error"
                          disabled={saving || uploadingFiles}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}

            {/* Empty State */}
            {mediaFiles.length === 0 && (!settings.aboutUsMediaUrls || settings.aboutUsMediaUrls.length === 0) && (
              <Grid size={{ xs: 12 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'action.hover',
                    border: '2px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <ImageIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.settings.noMediaUrls')}
                  </Typography>
                </Paper>
              </Grid>
            )}
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
}