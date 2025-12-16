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
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Schedule,
  LocationOn,
  Euro,
  AccountBalance,
  ChevronLeft,
  ChevronRight,
  PlayCircleOutline,
} from '@mui/icons-material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { activityService } from '../services/activityService';
import { useAuth } from '../context/AuthContext';
import { BookingModal } from '../components/bookings';
import type { Activity } from '../types/activity';

// Custom Arrow Components
interface ArrowProps {
  onClick?: () => void;
}

const NextArrow = ({ onClick }: ArrowProps) => (
  <IconButton
    onClick={onClick}
    sx={{
      position: 'absolute',
      top: '50%',
      right: 16,
      transform: 'translateY(-50%)',
      zIndex: 2,
      bgcolor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      '&:hover': {
        bgcolor: 'rgba(0, 0, 0, 0.7)',
      },
    }}
  >
    <ChevronRight />
  </IconButton>
);

const PrevArrow = ({ onClick }: ArrowProps) => (
  <IconButton
    onClick={onClick}
    sx={{
      position: 'absolute',
      top: '50%',
      left: 16,
      transform: 'translateY(-50%)',
      zIndex: 2,
      bgcolor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      '&:hover': {
        bgcolor: 'rgba(0, 0, 0, 0.7)',
      },
    }}
  >
    <ChevronLeft />
  </IconButton>
);

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

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
      setError(t('activityDetail.loadError'));
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNowClick = () => {
    if (!isAuthenticated) {
      toast.error(t('activityDetail.loginRequired'));
      navigate('/login', { state: { from: `/activity/${id}` } });
      return;
    }

    if (!activity?.active) {
      toast.error(t('activityDetail.notAvailable'));
      return;
    }

    setBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setBookingModalOpen(false);
    // Optionally redirect to my bookings page
    // navigate('/my-bookings');
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
        <Alert severity="error">{error || t('activityDetail.notFound')}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/home')}
          sx={{ mt: 2 }}
        >
          {t('activityDetail.backToActivities')}
        </Button>
      </Container>
    );
  }

  // Combine images and videos for carousel
  const mediaItems = [
    ...activity.imageUrls.map(url => ({ type: 'image' as const, url })),
    ...activity.videoUrls.map(url => ({ type: 'video' as const, url })),
  ];

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: mediaItems.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    adaptiveHeight: false,
    dotsClass: 'slick-dots custom-dots',
  };

  return (
    <Container sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/home')}
        sx={{ mb: 3 }}
      >
        {t('activityDetail.backToActivities')}
      </Button>

      <Grid container spacing={4}>
        {/* Media Carousel Section */}
        <Grid size={{ xs: 12, md: 7 }}>
          {mediaItems.length > 0 ? (
            <Box
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                '& .slick-slider': {
                  borderRadius: 2,
                },
                '& .slick-slide': {
                  display: 'flex !important',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
                '& .custom-dots': {
                  bottom: 16,
                  '& li button:before': {
                    fontSize: 12,
                    color: 'white',
                    opacity: 0.5,
                  },
                  '& li.slick-active button:before': {
                    color: 'white',
                    opacity: 1,
                  },
                },
              }}
            >
              <Slider {...carouselSettings}>
                {mediaItems.map((item, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    {item.type === 'image' ? (
                      <Box
                        component="img"
                        src={item.url}
                        alt={`${activity.name} - ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: isMobile ? 300 : 500,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: isMobile ? 300 : 500,
                          bgcolor: 'black',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <video
                          controls
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                          src={item.url}
                        >
                          {t('activityDetail.videoNotSupported')}
                        </video>
                        {/* Video overlay indicator */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            pointerEvents: 'none',
                          }}
                        >
                          <PlayCircleOutline fontSize="small" />
                          <Typography variant="caption" fontWeight={600}>
                            {t('activityDetail.video')}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Slider>
            </Box>
          ) : (
            <Box
              component="img"
              src="https://placehold.co/600x400/e8f5e9/6a994e?text=No+Media+Available"
              alt={activity.name}
              sx={{ 
                width: '100%', 
                height: isMobile ? 300 : 500,
                objectFit: 'cover',
                borderRadius: 2 
              }}
            />
          )}

          {/* Media count indicator */}
          {mediaItems.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 2,
                justifyContent: 'center',
              }}
            >
              {activity.imageUrls.length > 0 && (
                <Chip
                  label={`${activity.imageUrls.length} ${activity.imageUrls.length === 1 ? t('activityDetail.photo') : t('activityDetail.photos')}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {activity.videoUrls.length > 0 && (
                <Chip
                  icon={<PlayCircleOutline />}
                  label={`${activity.videoUrls.length} ${activity.videoUrls.length === 1 ? t('activityDetail.videoSingular') : t('activityDetail.videos')}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Grid>

        {/* Details Section */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ position: { md: 'sticky' }, top: 20 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip label={activity.category.name} color="primary" />
              {activity.active && (
                <Chip 
                  label={t('activityDetail.available')} 
                  color="success" 
                  variant="outlined" 
                />
              )}
            </Box>

            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              {activity.name}
            </Typography>

            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }} color="text.secondary" component="p">
              {activity.description}
            </Typography>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom fontWeight="bold">
                  RON {activity.pricePerPerson}
                  <Typography component="span" variant="body1" color="text.secondary">
                    {' '}/{t('activityDetail.person')}
                  </Typography>
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule color="action" />
                    <Typography variant="body1">
                      <strong>{t('activityDetail.duration')}:</strong> {activity.duration}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person color="action" />
                    <Typography variant="body1">
                      <strong>{t('activityDetail.groupSize')}:</strong> {activity.minParticipants}-
                      {activity.maxParticipants} {t('activityDetail.participants')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="action" />
                    <Typography variant="body1">
                      <strong>{t('activityDetail.location')}:</strong> {activity.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance color="action" />
                    <Typography variant="body1">
                      <strong>{t('activityDetail.deposit')}:</strong> RON {activity.depositAmount.toFixed(2)} (
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
                  onClick={handleBookNowClick}
                  disabled={!activity.active}
                >
                  {t('booking.bookNow')}
                </Button>

                {!isAuthenticated && (
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                  >
                    {t('activityDetail.loginToBook')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Additional Information */}
      {activity.locationDetails && (
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                {t('activityDetail.locationDetails')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                {activity.locationDetails.city && (
                  <Typography variant="body1">
                    <strong>{t('activityDetail.city')}:</strong> {activity.locationDetails.city}
                  </Typography>
                )}
                {activity.locationDetails.address && (
                  <Typography variant="body1">
                    <strong>{t('activityDetail.address')}:</strong> {activity.locationDetails.address}
                  </Typography>
                )}
                {activity.locationDetails.postalCode && (
                  <Typography variant="body1">
                    <strong>{t('activityDetail.postalCode')}:</strong> {activity.locationDetails.postalCode}
                  </Typography>
                )}
                {activity.locationDetails.latitude && activity.locationDetails.longitude && (
                  <Typography variant="body1">
                    <strong>{t('activityDetail.coordinates')}:</strong> {activity.locationDetails.latitude.toFixed(6)}, {activity.locationDetails.longitude.toFixed(6)}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Booking Modal */}
      {activity && (
        <BookingModal
          open={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          activity={activity}
          onSuccess={handleBookingSuccess}
        />
      )}
    </Container>
  );
};

export default ActivityDetail;