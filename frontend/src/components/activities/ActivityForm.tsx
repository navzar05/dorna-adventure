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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  CloudUpload as UploadIcon,
  LocationOn as LocationIcon,
  Check as CheckIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { mediaService } from '../../services/mediaService';
import { employeeService } from '../../services/employeeService';
import type { Activity, Category, LocationDetails, ActivityTimeSlot } from '../../types/activity';
import type { Employee } from '../../types/employee';

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
    timeSlots: [],
  };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Parse Google Maps URL to extract coordinates
const parseGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
  try {
    // Clean the URL
    url = url.trim();

    // Pattern 1: Standard Google Maps with coordinates in URL
    // https://www.google.com/maps/place/.../@45.6526806,25.6012134,13z
    const pattern1 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match1 = url.match(pattern1);
    if (match1) {
      return {
        lat: parseFloat(match1[1]),
        lng: parseFloat(match1[2]),
      };
    }

    // Pattern 2: Query format
    // https://maps.google.com/?q=45.6526806,25.6012134
    const pattern2 = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match2 = url.match(pattern2);
    if (match2) {
      return {
        lat: parseFloat(match2[1]),
        lng: parseFloat(match2[2]),
      };
    }

    // Pattern 3: Direct coordinates
    // https://www.google.com/maps/@45.6526806,25.6012134,13z
    const pattern3 = /maps\/@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match3 = url.match(pattern3);
    if (match3) {
      return {
        lat: parseFloat(match3[1]),
        lng: parseFloat(match3[2]),
      };
    }

    // Pattern 4: Place ID format
    // https://www.google.com/maps/place/.../@45.6526806,25.6012134
    const pattern4 = /place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match4 = url.match(pattern4);
    if (match4) {
      return {
        lat: parseFloat(match4[1]),
        lng: parseFloat(match4[2]),
      };
    }

    // Pattern 5: Coordinates after /maps/
    // https://maps.app.goo.gl/... or https://goo.gl/maps/...
    const pattern5 = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const match5 = url.match(pattern5);
    if (match5) {
      return {
        lat: parseFloat(match5[1]),
        lng: parseFloat(match5[2]),
      };
    }

    return null;
  } catch {
    return null;
  }
};

// Reverse geocode coordinates to get address details
const reverseGeocode = async (lat: number, lng: number): Promise<Partial<LocationDetails> | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const address = data.address;

    return {
      city: address.city || address.town || address.village || address.municipality || '',
      address: data.display_name || '',
      latitude: lat,
      longitude: lng,
      postalCode: address.postcode || '',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
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

  // Location parsing state
  const [mapsUrl, setMapsUrl] = useState('');
  const [parsingLocation, setParsingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Time slot management state
  const [timeSlots, setTimeSlots] = useState<ActivityTimeSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<ActivityTimeSlot | null>(null);

  // Employee assignment state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [employeeSelectionEnabled, setEmployeeSelectionEnabled] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const handleEnter = () => {
    setFormData(getInitialFormData(activity));
    setActiveTab(0);
    setImageFiles([]);
    setVideoFiles([]);
    setUploadProgress(0);
    setMapsUrl('');
    setLocationError('');
    setTimeSlots(activity?.timeSlots || []);
    setEditingSlot(null);
    setEmployeeSelectionEnabled(activity?.employeeSelectionEnabled || false);
    setSelectedEmployeeIds(activity?.assignedEmployees?.map(e => e.id) || []);
    loadEmployees();
  };

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await employeeService.getAllEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error(t('errors.loadEmployeesFailed'));
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleChange = (field: keyof Activity, value: any) => {
    // This preserves white spaces, enters, and tabs
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
    setActiveTab(prev => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setActiveTab(prev => Math.max(prev - 1, 0));
  };

  // Parse Google Maps URL and extract location
  const handleParseLocation = async () => {
    if (!mapsUrl.trim()) {
      setLocationError(t('admin.location.urlRequired'));
      return;
    }

    setParsingLocation(true);
    setLocationError('');

    try {
      const coords = parseGoogleMapsUrl(mapsUrl);
      
      if (!coords) {
        setLocationError(t('admin.location.invalidUrl'));
        setParsingLocation(false);
        return;
      }

      const locationDetails = await reverseGeocode(coords.lat, coords.lng);

      if (!locationDetails) {
        setLocationError(t('admin.location.geocodeFailed'));
        setParsingLocation(false);
        return;
      }

      // Update form data with parsed location
      setFormData(prev => ({
        ...prev,
        location: locationDetails.city || '',
        locationDetails: {
          city: locationDetails.city || '',
          address: locationDetails.address || '',
          latitude: locationDetails.latitude,
          longitude: locationDetails.longitude,
          postalCode: locationDetails.postalCode || '',
        } as LocationDetails,
      }));

      toast.success(t('admin.location.parseSuccess'));
      setMapsUrl('');
    } catch (error) {
      console.error('Error parsing location:', error);
      setLocationError(t('admin.location.parseError'));
    } finally {
      setParsingLocation(false);
    }
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

  // Time slot handlers
  const handleAddTimeSlot = () => {
    const newSlot: ActivityTimeSlot = {
      startTime: '09:00',
      endTime: '17:00',
      active: true,
    };
    setEditingSlot(newSlot);
  };

  const handleSaveTimeSlot = () => {
    if (!editingSlot) return;

    // Validation
    if (editingSlot.startTime >= editingSlot.endTime) {
      toast.error('Start time must be before end time');
      return;
    }

    if (editingSlot.id) {
      // Update existing slot
      setTimeSlots(prev =>
        prev.map(slot => (slot.id === editingSlot.id ? editingSlot : slot))
      );
    } else {
      // Add new slot with temporary ID
      setTimeSlots(prev => [...prev, { ...editingSlot, id: Date.now() }]);
    }

    setEditingSlot(null);
  };

  const handleEditTimeSlot = (slot: ActivityTimeSlot) => {
    setEditingSlot({ ...slot });
  };

  const handleDeleteTimeSlot = (slotId: number | undefined) => {
    if (!slotId) return;
    setTimeSlots(prev => prev.filter(slot => slot.id !== slotId));
  };

  const handleCancelEditSlot = () => {
    setEditingSlot(null);
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
          `${uploadedCount}/${totalFiles} ${t('admin.messages.filesUploaded')}. ${t('admin.messages.failedFiles')}: ${failedUploads.join(', ')}`
        );
      } else if (uploadedCount > 0) {
        toast.success(`${uploadedCount} ${t('admin.messages.filesUploadedSuccessfully')}`);
      }
    } finally {
      setUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.description) {
      toast.error(t('admin.validation.requiredFields'));
      return;
    }

    if (formData.minParticipants! < 1 || formData.maxParticipants! < 1) {
      toast.error(t('admin.validation.participantsPositive'));
      return;
    }

    if (formData.minParticipants! > formData.maxParticipants!) {
      toast.error(t('admin.validation.minMaxParticipants'));
      return;
    }

    if (formData.pricePerPerson! < 0) {
      toast.error(t('admin.validation.pricePositive'));
      return;
    }

    if (formData.depositPercent! < 0 || formData.depositPercent! > 100) {
      toast.error(t('admin.validation.depositRange'));
      return;
    }

    if (formData.durationMinutes! < 1) {
      toast.error(t('admin.validation.durationPositive'));
      return;
    }

    try {
      setLoading(true);

      // Prepare data for backend
      const dataToSend = {
        name: formData.name,
        description: formData.description, // This contains the white spaces
        minParticipants: formData.minParticipants,
        maxParticipants: formData.maxParticipants,
        pricePerPerson: formData.pricePerPerson,
        depositPercent: formData.depositPercent,
        durationMinutes: formData.durationMinutes,
        location: formData.location,
        locationDetails: formData.locationDetails,
        categoryId: formData.category?.id,
        active: formData.active,
        timeSlots: timeSlots,
        employeeSelectionEnabled: employeeSelectionEnabled,
        employeeIds: employeeSelectionEnabled ? selectedEmployeeIds : []
    };

      // Save activity with employee assignments in one request
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

    console.log('Final form data to submit:', formData)
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
              {t('admin.messages.uploadingFiles')} ({Math.round(uploadProgress)}%)
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
                Schedule
                {timeSlots.length > 0 && (
                  <Chip
                    label={timeSlots.length}
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
            id="activity-tab-3"
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
            id="activity-tab-4"
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
            {/* Description Field - preserves whitespace via multiline prop */}
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
                value={formData.minParticipants ?? ''}
                onChange={(e) => handleChange('minParticipants', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                required
                fullWidth
                inputProps={{ min: 1 }}
                disabled={isSubmitting}
              />
              <TextField
                label={t('admin.activityFields.maxParticipants')}
                type="number"
                value={formData.maxParticipants ?? ''}
                onChange={(e) => handleChange('maxParticipants', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
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
                value={formData.pricePerPerson ?? ''}
                onChange={(e) => handleChange('pricePerPerson', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                disabled={isSubmitting}
              />
              <TextField
                label={t('admin.activityFields.depositPercent')}
                type="number"
                value={formData.depositPercent ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  handleChange('depositPercent', val === '' ? '' : Math.min(100, Math.max(0, val)));
                }}
                required
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                disabled={isSubmitting}
              />
            </Box>
            
            <TextField
              label={t('admin.activityFields.durationMinutes')}
              type="number"
              value={formData.durationMinutes ?? ''}
              onChange={(e) => handleChange('durationMinutes', e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
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

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                <LocationIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                {t('admin.location.parseFromMaps')}
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  {t('admin.location.howToGetUrl')}
                </Typography>
                <Box component="ol" sx={{ mt: 1, mb: 0, pl: 2, fontSize: '0.75rem' }}>
                  <li>{t('admin.location.step1')}</li>
                  <li>{t('admin.location.step2')}</li>
                  <li>{t('admin.location.step3')}</li>
                </Box>
              </Alert>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="https://www.google.com/maps/@47.1585,27.6014,15z"
                  value={mapsUrl}
                  onChange={(e) => {
                    setMapsUrl(e.target.value);
                    setLocationError('');
                  }}
                  fullWidth
                  size="small"
                  disabled={parsingLocation || isSubmitting}
                  error={!!locationError}
                  helperText={locationError}
                  multiline
                  maxRows={2}
                />
                <Button
                  variant="contained"
                  onClick={handleParseLocation}
                  disabled={parsingLocation || isSubmitting || !mapsUrl.trim()}
                  startIcon={parsingLocation ? <CircularProgress size={16} /> : <CheckIcon />}
                  sx={{ minWidth: 100 }}
                >
                  {t('admin.location.parse')}
                </Button>
              </Box>
            </Paper>

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

            {/* Detailed Location - Read-only after parsing */}
            <Alert severity="info" icon={<LocationIcon />}>
              {t('admin.location.autoFilled')}
            </Alert>

            <TextField
              label={t('admin.activityFields.city')}
              value={formData.locationDetails?.city || ''}
              onChange={(e) => handleLocationDetailsChange('city', e.target.value)}
              required
              fullWidth
              disabled={isSubmitting}
              InputProps={{ readOnly: true }}
            />

            <TextField
              label={t('admin.activityFields.address')}
              value={formData.locationDetails?.address || ''}
              onChange={(e) => handleLocationDetailsChange('address', e.target.value)}
              fullWidth
              disabled={isSubmitting}
              multiline
              rows={2}
              InputProps={{ readOnly: true }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('admin.activityFields.latitude')}
                type="number"
                value={formData.locationDetails?.latitude ?? ''}
                fullWidth
                inputProps={{ step: 0.000001 }}
                disabled={isSubmitting}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label={t('admin.activityFields.longitude')}
                type="number"
                value={formData.locationDetails?.longitude ?? ''}
                fullWidth
                inputProps={{ step: 0.000001 }}
                disabled={isSubmitting}
                InputProps={{ readOnly: true }}
              />
            </Box>

            <TextField
              label={t('admin.activityFields.postalCode')}
              value={formData.locationDetails?.postalCode || ''}
              fullWidth
              disabled={isSubmitting}
              InputProps={{ readOnly: true }}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Activity Time Slots</Typography>
              <Button
                variant="contained"
                onClick={handleAddTimeSlot}
                disabled={isSubmitting || editingSlot !== null}
              >
                Add Time Slot
              </Button>
            </Box>

            <Alert severity="info">
              Define when this activity can start and by when it must finish. Activities can only begin at the exact start time specified, and must complete before the end time. If no time slots are set, the activity can be booked at any time.
            </Alert>

            {editingSlot && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" gutterBottom>
                  {editingSlot.id ? 'Edit Time Slot' : 'New Time Slot'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Start Time"
                      type="time"
                      value={editingSlot.startTime}
                      onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Time"
                      type="time"
                      value={editingSlot.endTime}
                      onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editingSlot.active}
                        onChange={(e) => setEditingSlot({ ...editingSlot, active: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button onClick={handleCancelEditSlot} variant="outlined">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTimeSlot} variant="contained">
                      Save
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {timeSlots.length > 0 ? (
              <Paper variant="outlined">
                <List>
                  {timeSlots.map((slot, index) => (
                    <ListItem
                      key={slot.id}
                      sx={{
                        borderBottom: index < timeSlots.length - 1 ? 1 : 0,
                        borderColor: 'divider',
                      }}
                    >
                      <ListItemText
                        primary={`${slot.startTime} - ${slot.endTime}`}
                        secondary={slot.active ? 'Active' : 'Inactive'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditTimeSlot(slot)}
                          disabled={isSubmitting || editingSlot !== null}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteTimeSlot(slot.id)}
                          color="error"
                          disabled={isSubmitting || editingSlot !== null}
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
                <Typography variant="body2" color="text.secondary">
                  No time slots defined. Activity can be booked at any time.
                </Typography>
              </Paper>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
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
              {t('admin.activityFields.mediaNote')}
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
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
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                {t('admin.activityFields.employeeSelectionHelp')}
              </Typography>
            </Box>

            {employeeSelectionEnabled && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('admin.activityFields.selectEmployees')}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {loadingEmployees ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : employees.length === 0 ? (
                  <Alert severity="info">
                    {t('admin.activityFields.noEmployeesAvailable')}
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {employees.map((employee) => (
                      <FormControlLabel
                        key={employee.id}
                        control={
                          <Checkbox
                            checked={selectedEmployeeIds.includes(employee.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployeeIds(prev => [...prev, employee.id]);
                              } else {
                                setSelectedEmployeeIds(prev => prev.filter(id => id !== employee.id));
                              }
                            }}
                            disabled={isSubmitting}
                          />
                        }
                        label={`${employee.firstName} ${employee.lastName} (${employee.username})`}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {!employeeSelectionEnabled && (
              <Alert severity="info">
                {t('admin.activityFields.employeeSelectionDisabledInfo')}
              </Alert>
            )}
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
          {activeTab === 4 ? (
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