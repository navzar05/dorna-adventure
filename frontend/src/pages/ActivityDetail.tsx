// src/pages/ActivityDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Schedule,
  LocationOn,
  Euro,
  AccountBalance,
} from '@mui/icons-material';
import { activityService } from '../services/activityService';
import type { Activity } from '../types/activity';

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchActivity(parseInt(id));
    }
  }, [id]);

  const fetchActivity = async (activityId: number) => {
    try {
      setLoading(true);
      const response = await activityService.getActivityById(activityId);
      setActivity(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load activity details. Please try again later.');
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !activity) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Activity not found'}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/home')}
          sx={{ mt: 2 }}
        >
          Back to Activities
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/home')}
        sx={{ mb: 3 }}
      >
        Back to Activities
      </Button>

      <Grid container spacing={4}>
        {/* Images Section */}
        <Grid size={{ xs: 12, md: 7 }}>
          {activity.imageUrls.length > 0 ? (
            <ImageList cols={1} gap={8}>
              {activity.imageUrls.map((url, index) => (
                <ImageListItem key={index}>
                  <img
                    src={url}
                    alt={`${activity.name} - ${index + 1}`}
                    loading="lazy"
                    style={{ borderRadius: 8, maxHeight: 500, objectFit: 'cover' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          ) : (
            <Box
              component="img"
              src="https://via.placeholder.com/600x400?text=No+Image"
              alt={activity.name}
              sx={{ width: '100%', borderRadius: 2 }}
            />
          )}
        </Grid>

        {/* Details Section */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip label={activity.category.name} color="primary" />
              {activity.active && <Chip label="Available" color="success" variant="outlined" />}
            </Box>

            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              {activity.name}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {activity.description}
            </Typography>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
                  €{activity.pricePerPerson}
                  <Typography component="span" variant="body1" color="text.secondary">
                    {' '}/person
                  </Typography>
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule color="action" />
                    <Typography variant="body1">
                      <strong>Duration:</strong> {activity.duration}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="action" />
                    <Typography variant="body1">
                      <strong>Group Size:</strong> {activity.minParticipants}-
                      {activity.maxParticipants} participants
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="action" />
                    <Typography variant="body1">
                      <strong>Location:</strong> {activity.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance color="action" />
                    <Typography variant="body1">
                      <strong>Deposit:</strong> €{activity.depositAmount.toFixed(2)} (
                      {activity.depositPercent}%)
                    </Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3 }}
                  startIcon={<Euro />}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Videos Section */}
      {activity.videoUrls.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Videos
          </Typography>
          <Grid container spacing={2}>
            {activity.videoUrls.map((url, index) => (
              <Grid size={{ xs: 12, md: 6 }} key={index}>
                <video
                  controls
                  style={{ width: '100%', borderRadius: 8 }}
                  src={url}
                >
                  Your browser does not support the video tag.
                </video>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default ActivityDetail;