// src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { 
  Container, 
  Grid,
  Typography, 
  Box, 
  CircularProgress,
  Alert
} from '@mui/material';
import ActivityCard from '../components/ActivityCard';
import { activityService } from '../services/activityService';
import type { Activity } from '../types/activity';

const Home = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activityService.getAllActivities();
      setActivities(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load activities. Please try again later.');
      console.error('Error fetching activities:', err);
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
          minHeight: '80vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Discover Amazing Activities
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Find your next adventure from our curated selection
        </Typography>
      </Box>

      {activities.length === 0 ? (
        <Alert severity="info">No activities available at the moment.</Alert>
      ) : (
        <Grid container spacing={3}>
          {activities.map((activity) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={activity.id}>
              <ActivityCard activity={activity} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Home;