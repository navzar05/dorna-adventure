/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/ActivityForm.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { mediaService } from '../services/mediaService'; // Import mediaService
import type { Activity, Category, LocationDetails } from '../types/activity';

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (activity: Partial<Activity>) => Promise<Activity>;
  activity?: Activity | null;
  categories: Category[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface FileWithPreview extends File {
  preview?: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`activity-tabpanel-${index}`}
      aria-labelledby={`activity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const getInitialFormData = (activity: Activity | null | undefined): Partial<Activity> => {
  if (activity) {
    return {
      ...activity,
      locationDetails: activity.locationDetails || {
        city: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        postalCode: '',
      }
    };
  }
  return {
    name: '',
    description: '',
    minParticipants: 1,
    maxParticipants: 10,
    pricePerPerson: 0,
    depositPercent: 20,
    durationMinutes: 60,
    location: '',
    locationDetails: {
      city: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
      postalCode: '',
    },
    active: true,
  };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function ActivityForm({ open, onClose, onSave, activity, categories }: ActivityFormProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Partial<Activity>>(() => getInitialFormData(activity));
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // File management state
  const [imageFiles, setImageFiles] = useState<FileWithPreview[]>([]);
  const [videoFiles, setVideoFiles] = useState<FileWithPreview[]>([]);

  const handleEnter = () => {
    setFormData(getInitialFormData(activity));
    setActiveTab(0);
    setImageFiles([]);
    setVideoFiles([]);
    setUploadProgress(0);
  };

  const handleChange = (field: keyof Activity, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationDetailsChange = (field: keyof LocationDetails, value: any) => {
    setFormData(prev => ({
      ...prev,
      locationDetails: {
        ...prev.locationDetails,
        [field]: value
      } as LocationDetails
    }));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNext = () => {
    setActiveTab(prev => Math.min(prev + 1, 2));
  };

  const handlePrevious = () => {
    setActiveTab(prev => Math.max(prev - 1, 0));
  };

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileWithPreview[] = Array.from(files).map(file => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });

    setImageFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  // Handle video file selection
  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileWithPreview[] = Array.from(files).map(file => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('video/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });

    setVideoFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  // Remove image file
  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Remove video file
  const handleRemoveVideo = (index: number) => {
    setVideoFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Upload files to server
  const uploadFiles = async (activityId: number) => {
    const totalFiles = imageFiles.length + videoFiles.length;
    if (totalFiles === 0) return;

    setUploadingFiles(true);
    let uploadedCount = 0;
    const failedUploads: string[] = [];

    try {
      // Upload images
      for (const file of imageFiles) {
        try {
          await mediaService.uploadFile(file, activityId, 'images');
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
        } catch (error) {
          console.error(`Failed to upload image ${file.name}:`, error);
          failedUploads.push(file.name);
        }
      }

      // Upload videos
      for (const file of videoFiles) {
        try {
          await mediaService.uploadFile(file, activityId, 'videos');
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
        } catch (error) {
          console.error(`Failed to upload video ${file.name}:`, error);
          failedUploads.push(file.name);
        }
      }

      // Show results
      if (failedUploads.length > 0) {
        toast.error(
          `${uploadedCount}/${totalFiles} files uploaded. Failed: ${failedUploads.join(', ')}`
        );
      } else if (uploadedCount > 0) {
        toast.success(`${uploadedCount} files uploaded successfully`);
      }
    } finally {
      setUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Prepare data for backend
      const dataToSend = {
        name: formData.name,
        description: formData.description,
        minParticipants: formData.minParticipants,
        maxParticipants: formData.maxParticipants,
        pricePerPerson: formData.pricePerPerson,
        depositPercent: formData.depositPercent,
        durationMinutes: formData.durationMinutes,
        location: formData.location,
        locationDetails: formData.locationDetails,
        categoryId: formData.category?.id,
        active: formData.active,
      };
      
      // Save activity first and get the saved activity with ID
      const savedActivity = await onSave(dataToSend);
      
      // Upload files if any
      if (imageFiles.length > 0 || videoFiles.length > 0) {
        await uploadFiles(savedActivity.id);
      }
      
      // Clean up object URLs
      imageFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      videoFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      
      onClose();
      toast.success(
        activity 
          ? t('admin.messages.activityUpdated') 
          : t('admin.messages.activityCreated')
      );
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error(t('admin.messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || uploadingFiles;

  return (
    <Dialog 
      open={open} 
      onClose={!isSubmitting ? onClose : undefined}
      maxWidth="md" 
      fullWidth
      TransitionProps={{
        onEnter: handleEnter,
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {activity ? t('admin.editActivity') : t('admin.addActivity')}
          </Typography>
          <IconButton onClick={onClose} edge="end" disabled={isSubmitting}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {uploadingFiles && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Uploading files... ({Math.round(uploadProgress)}%)
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          centered
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label={t('admin.activitySteps.basicInfo')} id="activity-tab-0" disabled={isSubmitting} />
          <Tab label={t('admin.activitySteps.details')} id="activity-tab-1" disabled={isSubmitting} />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t('admin.activitySteps.media')}
                {(imageFiles.length > 0 || videoFiles.length > 0) && (
                  <Chip 
                    label={imageFiles.length + videoFiles.length} 
                    size="small" 
                    color="primary"
                  />
                )}
              </Box>
            } 
            id="activity-tab-2"
            disabled={isSubmitting}
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('admin.activityFields.name')}
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              fullWidth
              autoFocus
              disabled={isSubmitting}
            />
            <TextField
              label={t('admin.activityFields.description')}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              multiline
              rows={4}
              fullWidth
              disabled={isSubmitting}
            />
            <TextField
              label={t('admin.activityFields.category')}
              value={formData.category?.id || ''}
              onChange={(e) => {
                const category = categories.find(c => c.id === Number(e.target.value));
                handleChange('category', category);
              }}
              select
              required
              fullWidth
              disabled={isSubmitting}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Pricing & Participants */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('admin.activityFields.minParticipants')}
                type="number"
                value={formData.minParticipants || 1}
                onChange={(e) => handleChange('minParticipants', Number(e.target.value))}
                required
                fullWidth
                inputProps={{ min: 1 }}
                disabled={isSubmitting}
              />
              <TextField
                label={t('admin.activityFields.maxParticipants')}
                type="number"
                value={formData.maxParticipants || 10}
                onChange={(e) => handleChange('maxParticipants', Number(e.target.value))}
                required
                fullWidth
                inputProps={{ min: 1 }}
                disabled={isSubmitting}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('admin.activityFields.pricePerPerson')}
                type="number"
                value={formData.pricePerPerson || 0}
                onChange={(e) => handleChange('pricePerPerson', Number(e.target.value))}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                disabled={isSubmitting}
              />
              <TextField
                label={t('admin.activityFields.depositPercent')}
                type="number"
                value={formData.depositPercent || 0}
                onChange={(e) => handleChange('depositPercent', Number(e.target.value))}
                required
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                disabled={isSubmitting}
              />
            </Box>
            
            <TextField
              label={t('admin.activityFields.durationMinutes')}
              type="number"
              value={formData.durationMinutes || 60}
              onChange={(e) => handleChange('durationMinutes', Number(e.target.value))}
              required
              fullWidth
              inputProps={{ min: 1 }}
              disabled={isSubmitting}
            />

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('admin.activityFields.locationSection')}
              </Typography>
            </Divider>

            {/* Location Summary */}
            <TextField
              label={t('admin.activityFields.location')}
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              required
              fullWidth
              helperText={t('admin.activityFields.locationHelper')}
              disabled={isSubmitting}
            />

            {/* Detailed Location */}
            <TextField
              label={t('admin.activityFields.city')}
              value={formData.locationDetails?.city || ''}
              onChange={(e) => handleLocationDetailsChange('city', e.target.value)}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label={t('admin.activityFields.address')}
              value={formData.locationDetails?.address || ''}
              onChange={(e) => handleLocationDetailsChange('address', e.target.value)}
              fullWidth
              disabled={isSubmitting}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('admin.activityFields.latitude')}
                type="number"
                value={formData.locationDetails?.latitude || ''}
                onChange={(e) => handleLocationDetailsChange('latitude', e.target.value ? Number(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 0.000001 }}
                helperText="Optional"
                disabled={isSubmitting}
              />
              <TextField
                label={t('admin.activityFields.longitude')}
                type="number"
                value={formData.locationDetails?.longitude || ''}
                onChange={(e) => handleLocationDetailsChange('longitude', e.target.value ? Number(e.target.value) : undefined)}
                fullWidth
                inputProps={{ step: 0.000001 }}
                helperText="Optional"
                disabled={isSubmitting}
              />
            </Box>

            <TextField
              label={t('admin.activityFields.postalCode')}
              value={formData.locationDetails?.postalCode || ''}
              onChange={(e) => handleLocationDetailsChange('postalCode', e.target.value)}
              fullWidth
              disabled={isSubmitting}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.active ?? true}
                  onChange={(e) => handleChange('active', e.target.checked)}
                  disabled={isSubmitting}
                />
              }
              label={t('admin.activityFields.active')}
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Images Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon color="primary" />
                  {t('admin.activityFields.images')}
                  {imageFiles.length > 0 && (
                    <Chip label={imageFiles.length} size="small" color="primary" />
                  )}
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  disabled={isSubmitting}
                >
                  {t('admin.activityFields.addImages')}
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </Button>
              </Box>

              {imageFiles.length > 0 ? (
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List>
                    {imageFiles.map((file, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: index < imageFiles.length - 1 ? 1 : 0,
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
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveImage(index)}
                            color="error"
                            disabled={isSubmitting}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ) : (
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
                    {t('admin.activityFields.noImages')}
                  </Typography>
                </Paper>
              )}
            </Box>

            <Divider />

            {/* Videos Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VideoIcon color="primary" />
                  {t('admin.activityFields.videos')}
                  {videoFiles.length > 0 && (
                    <Chip label={videoFiles.length} size="small" color="primary" />
                  )}
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  disabled={isSubmitting}
                >
                  {t('admin.activityFields.addVideos')}
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="video/*"
                    onChange={handleVideoSelect}
                  />
                </Button>
              </Box>

              {videoFiles.length > 0 ? (
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <List>
                    {videoFiles.map((file, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          borderBottom: index < videoFiles.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                        }}
                      >
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'action.selected',
                            borderRadius: 1,
                            mr: 2,
                          }}
                        >
                          <VideoIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                        </Box>
                        <ListItemText
                          primary={file.name}
                          secondary={formatFileSize(file.size)}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveVideo(index)}
                            color="error"
                            disabled={isSubmitting}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ) : (
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
                  <VideoIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('admin.activityFields.noVideos')}
                  </Typography>
                </Paper>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Note: Files will be uploaded when you save the activity.
            </Typography>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        <Button 
          onClick={handlePrevious} 
          disabled={activeTab === 0 || isSubmitting}
          variant="outlined"
        >
          {t('admin.previous')}
        </Button>
        <Box>
          <Button onClick={onClose} sx={{ mr: 1 }} disabled={isSubmitting}>
            {t('admin.cancel')}
          </Button>
          {activeTab === 2 ? (
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('common.loading') : t('admin.finish')}
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained" disabled={isSubmitting}>
              {t('admin.next')}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}