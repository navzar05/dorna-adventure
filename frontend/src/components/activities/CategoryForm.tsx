// src/components/admin/CategoryForm.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
  Alert,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { 
  Close as CloseIcon,
  Info as InfoIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { Category } from '../../types/activity';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category>) => Promise<void>;
  category?: Category | null;
}

const getInitialFormData = (category: Category | null | undefined): Partial<Category> => {
  if (category) {
    return category;
  }
  return {
    name: '',
    description: '',
    slug: '',
    displayOrder: 0,
    active: true,
    maxParticipantsPerGuide: 30, // Default value
  };
};

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export default function CategoryForm({ open, onClose, onSave, category }: CategoryFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Category>>(() => getInitialFormData(category));
  const [loading, setLoading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleEnter = () => {
    setFormData(getInitialFormData(category));
    setSlugManuallyEdited(false);
  };

  const handleChange = (field: keyof Category, value: string | number | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'name' && !slugManuallyEdited) {
         updated.slug = generateSlug(value as string);
      }
      
      return updated;
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({ ...prev, slug: e.target.value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name?.trim()) {
      toast.error(t('admin.validation.categoryNameRequired'));
      return;
    }
    
    if (!formData.slug?.trim()) {
      toast.error(t('admin.validation.categorySlugRequired'));
      return;
    }

    if (!formData.maxParticipantsPerGuide || formData.maxParticipantsPerGuide < 1) {
      toast.error(t('admin.validation.maxParticipantsRequired'));
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
      toast.success(
        category 
          ? t('admin.messages.categoryUpdated') 
          : t('admin.messages.categoryCreated')
      );
    } catch {
      toast.error(t('admin.messages.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      TransitionProps={{
        onEnter: handleEnter,
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {category ? t('admin.editCategory') : t('admin.addCategory')}
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={t('admin.categoryFields.name')}
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            fullWidth
            autoFocus
          />
          
          <TextField
            label={t('admin.categoryFields.description')}
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          
          <TextField
            label={t('admin.categoryFields.slug')}
            value={formData.slug || ''}
            onChange={handleSlugChange}
            required
            fullWidth
            helperText={t('admin.categoryFields.slugHelp')}
          />

          {/* Max Participants Per Guide Field */}
          <Box>
            <TextField
              label={t('admin.categoryFields.maxParticipantsPerGuide')}
              type="number"
              value={formData.maxParticipantsPerGuide || 30}
              onChange={(e) => handleChange('maxParticipantsPerGuide', Number(e.target.value))}
              required
              fullWidth
              inputProps={{ min: 1, max: 100 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PeopleIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip 
                      title={t('admin.categoryFields.maxParticipantsHelp')}
                      placement="top"
                      arrow
                    >
                      <InfoIcon color="action" sx={{ cursor: 'help' }} />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            
            <Alert severity="info" sx={{ mt: 1 }} icon={<InfoIcon />}>
              <Typography variant="body2">
                {t('admin.categoryFields.maxParticipantsExplanation')}
              </Typography>
            </Alert>
          </Box>

          <TextField
            label={t('admin.categoryFields.displayOrder')}
            type="number"
            value={formData.displayOrder || 0}
            onChange={(e) => handleChange('displayOrder', Number(e.target.value))}
            fullWidth
            inputProps={{ min: 0 }}
            helperText={t('admin.categoryFields.displayOrderHelp')}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.active ?? true}
                onChange={(e) => handleChange('active', e.target.checked)}
              />
            }
            label={t('admin.categoryFields.active')}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          {t('admin.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading || !formData.name || !formData.slug}
        >
          {loading ? t('common.loading') : t('admin.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}