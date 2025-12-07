/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { Category } from '../types/activity';

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
    active: true, // FIXED: Default to true so backend doesn't complain about null
  };
};

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents (e.g., ă -> a)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export default function CategoryForm({ open, onClose, onSave, category }: CategoryFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Category>>(() => getInitialFormData(category));
  const [loading, setLoading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false); // New state to track manual edits

  const handleEnter = () => {
    setFormData(getInitialFormData(category));
    setSlugManuallyEdited(false);
  };

  const handleChange = (field: keyof Category, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug from name ONLY if user hasn't manually edited the slug
      if (field === 'name' && !slugManuallyEdited) {
         updated.slug = generateSlug(value);
      }
      
      return updated;
    });
  };

  // Specific handler for Slug to mark it as manually edited
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({ ...prev, slug: e.target.value }));
  };

  const handleSubmit = async () => {
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
            onChange={handleSlugChange} // Use specific handler
            required
            fullWidth
            helperText="URL-friendly identifier (e.g., water-sports)"
          />
          <TextField
            label={t('admin.categoryFields.displayOrder')}
            type="number"
            value={formData.displayOrder || 0}
            onChange={(e) => handleChange('displayOrder', Number(e.target.value))}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.active ?? true} // FIXED: Uncommented
                onChange={(e) => handleChange('active', e.target.checked)} // FIXED: Uncommented
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
          disabled={loading}
        >
          {loading ? t('common.loading') : t('admin.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}