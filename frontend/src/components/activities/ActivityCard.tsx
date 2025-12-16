// src/components/ActivityCard.tsx
import { useState } from 'react';
import { 
  Card, 
  CardActionArea, // <--- 1. Import this
  CardMedia, 
  CardContent, 
  CardActions, 
  Typography, 
  Chip, 
  Button, 
  Box, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Person, 
  Schedule, 
  LocationOn, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import type { Activity, Category } from '../../types/activity';
import { activityService } from '../../services/activityService';
import { categoryService } from '../../services/categoryService';
import ActivityEditForm from './ActivityEditForm'; 
import { useAuth } from '../../context/AuthContext';

interface ActivityCardProps {
  activity: Activity;
  onRefresh?: () => void;
}

const ActivityCard = ({ activity, onRefresh }: ActivityCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {isAdmin } = useAuth();

  // --- State ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // --- Handlers ---

  const handleViewDetails = () => {
    navigate(`/activities/${activity.id}`);
  };

  // DELETE LOGIC
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the card click from triggering
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setLoadingAction(true);
      await activityService.deleteActivity(activity.id);
      toast.success(t('admin.messages.activityDeleted', 'Activity deleted successfully'));
      setDeleteDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(t('admin.messages.error', 'An error occurred'));
    } finally {
      setLoadingAction(false);
    }
  };

  // EDIT LOGIC
  const handleEditClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the card click from triggering
    try {
      if (categories.length === 0) {
        const response = await categoryService.getAllCategories();
        setCategories(response.data);
      }
      setEditFormOpen(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load categories for editing');
    }
  };

  const handleSaveEdit = async (updatedActivityData: Partial<Activity>) => {
    const response = await activityService.updateActivity(activity.id, updatedActivityData);
    if (onRefresh) onRefresh();
    return response.data;
  };

  return (
    <>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 40px rgba(45, 106, 79, 0.2)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #52b788 0%, #74c69d 100%)',
            zIndex: 1,
          }
        }}
      >
        {/* 2. Wrap Media and Content in CardActionArea */}
        <CardActionArea 
          onClick={handleViewDetails}
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'stretch',
            justifyContent: 'flex-start'
          }}
        >
          <CardMedia
            component="img"
            height="220"
            image={activity.imageUrls?.[0] || 'https://via.placeholder.com/400x220/52b788/ffffff?text=Activity'}
            alt={activity.name}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent sx={{ flexGrow: 1, pt: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
              <Typography gutterBottom variant="h6" component="h2" sx={{ mb: 0, fontWeight: 600 }}>
                {activity.name}
              </Typography>
              <Chip 
                label={activity.category?.name || 'General'} 
                size="small" 
                color="primary"
                sx={{ fontWeight: 500 }}
              />
            </Box>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.6,
              }}
            >
              {activity.description}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {activity.location}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {activity.durationMinutes} min
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {activity.minParticipants}-{activity.maxParticipants} {t('activity.participants')}
                </Typography>
              </Box>
            </Box>

            <Typography 
              variant="h5" 
              sx={{ 
                mt: 2, 
                fontWeight: 700,
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              RON {activity.pricePerPerson}
              <Typography component="span" variant="body2" color="text.secondary">
                {t('activity.perPerson')}
              </Typography>
            </Typography>
          </CardContent>
        </CardActionArea>

        {/* 3. CardActions stay OUTSIDE the ActionArea so buttons don't trigger the card click */}
        <CardActions sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleViewDetails}
            sx={{ flex: 1 }}
          >
            {t('activity.viewDetails')}
          </Button>

          {/* ADMIN BUTTONS */}
          {isAdmin && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={t('admin.editActivity', 'Edit')}>
                <IconButton 
                  size="small" 
                  color="primary" 
                  sx={{ border: 1, borderColor: 'primary.main', borderRadius: 1 }}
                  onClick={handleEditClick}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('admin.deleteActivity', 'Delete')}>
                <IconButton 
                  size="small" 
                  color="error" 
                  sx={{ border: 1, borderColor: 'error.main', borderRadius: 1 }}
                  onClick={handleDeleteClick}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </CardActions>
      </Card>

      {/* --- Delete Confirmation Dialog --- */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          {t('admin.confirmDelete', 'Confirm Deletion')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t('admin.confirmDeleteMessage', 'Are you sure you want to delete this activity? This action cannot be undone.')}
            <br />
            <strong>{activity.name}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loadingAction}>
            {t('admin.cancel', 'Cancel')}
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus disabled={loadingAction}>
            {t('admin.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Edit Form Dialog --- */}
      {editFormOpen && (
        <ActivityEditForm 
          open={editFormOpen}
          onClose={() => setEditFormOpen(false)}
          onSave={handleSaveEdit}
          activity={activity}
          categories={categories}
        />
      )}
    </>
  );
};

export default ActivityCard;