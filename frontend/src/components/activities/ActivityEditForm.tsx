/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/admin/ActivityEditForm.tsx
import { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  CloudUpload as UploadIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { mediaService } from '../../services/mediaService';
import { employeeService } from '../../services/employeeService';
import type { Activity, Category, LocationDetails } from '../../types/activity';
import type { Media } from '../../types/media';
import type { Employee } from '../../types/employee';

interface ActivityEditFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (activity: Partial<Activity>) => Promise<Activity>;
  activity: Activity;
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

const getInitialFormData = (activity: Activity): Partial<Activity> => {
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
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function ActivityEditForm({ open, onClose, onSave, activity, categories }: ActivityEditFormProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Partial<Activity>>(() => getInitialFormData(activity));
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Existing media management
  const [existingMedia, setExistingMedia] = useState<Media[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<number[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // New file management state
  const [newImageFiles, setNewImageFiles] = useState<FileWithPreview[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<FileWithPreview[]>([]);

  // Employee selection state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [employeeSelectionEnabled, setEmployeeSelectionEnabled] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch existing media when dialog opens
  useEffect(() => {
    if (open && activity.id) {
      fetchExistingMedia();
    }
  }, [open, activity.id]);

  const fetchExistingMedia = async () => {
    try {
      setLoadingMedia(true);
      const response = await mediaService.getMediaByActivity(activity.id);
      setExistingMedia(response.data);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Failed to load existing media');
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await employeeService.getAllEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleEnter = () => {
    setFormData(getInitialFormData(activity));
    setActiveTab(0);
    setNewImageFiles([]);
    setNewVideoFiles([]);
    setMediaToDelete([]);
    setUploadProgress(0);

    // Initialize employee selection state from activity
    setEmployeeSelectionEnabled(activity.employeeSelectionEnabled || false);
    setSelectedEmployeeIds(activity.assignedEmployees?.map(e => e.id) || []);

    // Load employees
    loadEmployees();
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
    setActiveTab(prev => Math.min(prev + 1, 3));
  };

  const handlePrevious = () => {
    setActiveTab(prev => Math.max(prev - 1, 0));
  };

  const handleEmployeeToggle = (employeeId: number) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Mark existing media for deletion
  const handleMarkMediaForDeletion = (mediaId: number) => {
    setMediaToDelete(prev => [...prev, mediaId]);
  };

  // Unmark media for deletion
  const handleUnmarkMediaForDeletion = (mediaId: number) => {
    setMediaToDelete(prev => prev.filter(id => id !== mediaId));
  };

  // Handle new image file selection
  const handleNewImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileWithPreview[] = Array.from(files).map(file => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });

    setNewImageFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  // Handle new video file selection
  const handleNewVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileWithPreview[] = Array.from(files).map(file => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('video/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });

    setNewVideoFiles(prev => [...prev, ...newFiles]);
    event.target.value = '';
  };

  // Remove new image file
  const handleRemoveNewImage = (index: number) => {
    setNewImageFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Remove new video file
  const handleRemoveNewVideo = (index: number) => {
    setNewVideoFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Delete marked media from server
  const deleteMarkedMedia = async () => {
    if (mediaToDelete.length === 0) return;

    const failedDeletes: number[] = [];

    for (const mediaId of mediaToDelete) {
      try {
        await mediaService.deleteMedia(mediaId);
      } catch (error) {
        console.error(`Failed to delete media ${mediaId}:`, error);
        failedDeletes.push(mediaId);
      }
    }

    if (failedDeletes.length > 0) {
      toast.error(`Failed to delete ${failedDeletes.length} media items`);
    } else if (mediaToDelete.length > 0) {
      toast.success(`${mediaToDelete.length} media items deleted`);
    }
  };

  // Upload new files to server
  const uploadNewFiles = async (activityId: number) => {
    const totalFiles = newImageFiles.length + newVideoFiles.length;
    if (totalFiles === 0) return;

    setUploadingFiles(true);
    let uploadedCount = 0;
    const failedUploads: string[] = [];

    try {
      // Upload new images
      for (const file of newImageFiles) {
        try {
          await mediaService.uploadFile(file, activityId, 'images');
          uploadedCount++;
          setUploadProgress((uploadedCount / totalFiles) * 100);
        } catch (error) {
          console.error(`Failed to upload image ${file.name}:`, error);
          failedUploads.push(file.name);
        }
      }

      // Upload new videos
      for (const file of newVideoFiles) {
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
        toast.success(`${uploadedCount} new files uploaded successfully`);
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
        employeeSelectionEnabled: employeeSelectionEnabled,
        employeeIds: employeeSelectionEnabled ? selectedEmployeeIds : []
      };

      // Delete marked media first
      await deleteMarkedMedia();

      // Update activity with employee assignments in one request
      const savedActivity = await onSave(dataToSend);
      
      // Upload new files if any
      if (newImageFiles.length > 0 || newVideoFiles.length > 0) {
        await uploadNewFiles(savedActivity.id);
      }
      
      // Clean up object URLs
      newImageFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      newVideoFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      
      onClose();
      toast.success(t('admin.messages.activityUpdated'));
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error(t('admin.messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || uploadingFiles;

  // Separate existing media by type
  const existingImages = existingMedia.filter(m => m.mediaType === 'IMAGE' && !mediaToDelete.includes(m.id));
  const existingVideos = existingMedia.filter(m => m.mediaType === 'VIDEO' && !mediaToDelete.includes(m.id));
  const markedForDeletion = existingMedia.filter(m => mediaToDelete.includes(m.id));

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
            {t('admin.editActivity')}
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

        {markedForDeletion.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
            {markedForDeletion.length} media item(s) will be permanently deleted when you save.
          </Alert>
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
                {(existingImages.length + existingVideos.length + newImageFiles.length + newVideoFiles.length > 0) && (
                  <Chip
                    label={existingImages.length + existingVideos.length + newImageFiles.length + newVideoFiles.length}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
            }
            id="activity-tab-2"
            disabled={isSubmitting}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t('admin.activitySteps.employees')}
                {selectedEmployeeIds.length > 0 && (
                  <Chip
                    label={selectedEmployeeIds.length}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
            }
            id="activity-tab-3"
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

            <TextField
              label={t('admin.activityFields.location')}
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              required
              fullWidth
              helperText={t('admin.activityFields.locationHelper')}
              disabled={isSubmitting}
            />

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
          {loadingMedia ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Existing Images Section */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ImageIcon color="primary" />
                  {t('admin.media.existingImages')}
                  {existingImages.length > 0 && (
                    <Chip label={existingImages.length} size="small" color="primary" />
                  )}
                </Typography>

                {existingImages.length > 0 ? (
                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                    <List>
                      {existingImages.map((media) => (
                        <ListItem
                          key={media.id}
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            borderBottom: 1,
                            borderColor: 'divider',
                          }}
                        >
                          <Box
                            component="img"
                            src={media.url}
                            alt={t('admin.media.activityMedia')}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 1,
                              mr: 2,
                            }}
                          />
                          <ListItemText
                            primary={`${t('admin.media.image')} #${media.id}`}
                            secondary={media.url.substring(media.url.lastIndexOf('/') + 1, media.url.lastIndexOf('/') + 30) + '...'}
                          />
                          <ListItemSecondaryAction>
                            {mediaToDelete.includes(media.id) ? (
                              <Button
                                size="small"
                                onClick={() => handleUnmarkMediaForDeletion(media.id)}
                                disabled={isSubmitting}
                              >
                                {t('admin.media.undo')}
                              </Button>
                            ) : (
                              <IconButton
                                edge="end"
                                onClick={() => handleMarkMediaForDeletion(media.id)}
                                color="error"
                                disabled={isSubmitting}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t('admin.media.noExistingImages')}
                  </Alert>
                )}
              </Box>

              {/* New Images Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageIcon color="secondary" />
                    {t('admin.media.addNewImages')}
                    {newImageFiles.length > 0 && (
                      <Chip label={newImageFiles.length} size="small" color="secondary" />
                    )}
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                    disabled={isSubmitting}
                  >
                    {t('admin.media.addImagesButton')}
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleNewImageSelect}
                    />
                  </Button>
                </Box>

                {newImageFiles.length > 0 && (
                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List>
                      {newImageFiles.map((file, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            borderBottom: index < newImageFiles.length - 1 ? 1 : 0,
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
                              onClick={() => handleRemoveNewImage(index)}
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
                )}
              </Box>

              <Divider />

              {/* Existing Videos Section */}
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <VideoIcon color="primary" />
                  {t('admin.media.existingVideos')}
                  {existingVideos.length > 0 && (
                    <Chip label={existingVideos.length} size="small" color="primary" />
                  )}
                </Typography>

                {existingVideos.length > 0 ? (
                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                    <List>
                      {existingVideos.map((media) => (
                        <ListItem
                          key={media.id}
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            borderBottom: 1,
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
                            primary={`${t('admin.media.video')} #${media.id}`}
                            secondary={media.url.substring(media.url.lastIndexOf('/') + 1, media.url.lastIndexOf('/') + 30) + '...'}
                          />
                          <ListItemSecondaryAction>
                            {mediaToDelete.includes(media.id) ? (
                              <Button
                                size="small"
                                onClick={() => handleUnmarkMediaForDeletion(media.id)}
                                disabled={isSubmitting}
                              >
                                {t('admin.media.undo')}
                              </Button>
                            ) : (
                              <IconButton
                                edge="end"
                                onClick={() => handleMarkMediaForDeletion(media.id)}
                                color="error"
                                disabled={isSubmitting}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t('admin.media.noExistingVideos')}
                  </Alert>
                )}
              </Box>

              {/* New Videos Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VideoIcon color="secondary" />
                    {t('admin.media.addNewVideos')}
                    {newVideoFiles.length > 0 && (
                      <Chip label={newVideoFiles.length} size="small" color="secondary" />
                    )}
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                    disabled={isSubmitting}
                  >
                    {t('admin.media.addVideosButton')}
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="video/*"
                      onChange={handleNewVideoSelect}
                    />
                  </Button>
                </Box>

                {newVideoFiles.length > 0 && (
                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List>
                      {newVideoFiles.map((file, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            borderBottom: index < newVideoFiles.length - 1 ? 1 : 0,
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
                              onClick={() => handleRemoveNewVideo(index)}
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
                )}
              </Box>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {loadingEmployees ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={employeeSelectionEnabled}
                    onChange={(e) => setEmployeeSelectionEnabled(e.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label={t('admin.activityFields.enableEmployeeSelection')}
              />

              <Typography variant="body2" color="text.secondary">
                {t('admin.activityFields.employeeSelectionHelp')}
              </Typography>

              {employeeSelectionEnabled ? (
                <>
                  <Divider />
                  <Typography variant="h6">
                    {t('admin.activityFields.selectEmployees')}
                  </Typography>

                  {employees.length === 0 ? (
                    <Alert severity="info">
                      {t('admin.activityFields.noEmployeesAvailable')}
                    </Alert>
                  ) : (
                    <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <List>
                        {employees.map((employee) => (
                          <ListItem key={employee.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedEmployeeIds.includes(employee.id)}
                                  onChange={() => handleEmployeeToggle(employee.id)}
                                  disabled={isSubmitting}
                                />
                              }
                              label={`${employee.firstName} ${employee.lastName} (${employee.username})`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  {t('admin.activityFields.employeeSelectionDisabledInfo')}
                </Alert>
              )}
            </Box>
          )}
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
          {activeTab === 3 ? (
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