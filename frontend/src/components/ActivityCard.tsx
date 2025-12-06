// src/components/ActivityCard.tsx
import { Card, CardMedia, CardContent, CardActions, Typography, Chip, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Person, Schedule, LocationOn } from '@mui/icons-material';
import type { Activity } from '../types/activity';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityCard = ({ activity }: ActivityCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/activities/${activity.id}`);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        }
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={activity.imageUrls[0] || 'https://placehold.co/400x200'}
        alt={activity.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Typography gutterBottom variant="h6" component="h2" sx={{ mb: 0 }}>
            {activity.name}
          </Typography>
          <Chip 
            label={activity.category.name} 
            size="small" 
            color="primary" 
            variant="outlined"
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
          }}
        >
          {activity.description}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {activity.location}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {activity.duration}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {activity.minParticipants}-{activity.maxParticipants} participants
            </Typography>
          </Box>
        </Box>

        <Typography 
          variant="h5" 
          color="primary" 
          sx={{ mt: 2, fontWeight: 'bold' }}
        >
          €{activity.pricePerPerson}
          <Typography component="span" variant="body2" color="text.secondary">
            {' '}/person
          </Typography>
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default ActivityCard;