// src/pages/Home.tsx
import { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Grid, // Note: In MUI v6+, Grid size props are used on the item
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ActivityCard } from '../components/activities';
import { activityService } from '../services/activityService';
import { categoryService } from '../services/categoryService'; // Import Category Service
import type { Activity, Category } from '../types/activity';

const ITEMS_PER_PAGE = 6;

const Home = () => {
  const { t } = useTranslation();
  
  // Data State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch both activities and categories in parallel
      const [activitiesRes, categoriesRes] = await Promise.all([
        activityService.getAllActivities(),
        categoryService.getAllCategories()
      ]);

      setActivities(activitiesRes.data);
      setCategories(categoriesRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering Logic ---
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // 1. Search Filter (checks Name and Description)
      const matchesSearch = 
        activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Category Filter
      const matchesCategory = 
        selectedCategoryId === 'all' || 
        activity.category?.id === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [activities, searchQuery, selectedCategoryId]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  
  const paginatedActivities = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredActivities, page]);

  // --- Handlers ---
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to page 1 when filter changes
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCategoryChange = (event: any) => {
    setSelectedCategoryId(event.target.value);
    setPage(1); // Reset to page 1 when filter changes
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Optional: Scroll to top of list when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {/* Header Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          fontWeight="bold"
          sx={{
            background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('home.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {t('home.subtitle')}
        </Typography>
      </Box>

      {/* Filters Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} justifyContent="center">
          {/* Search Bar */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder={t('home.searchPlaceholder', 'Search activities...')}
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>

          {/* Category Filter */}
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth sx={{ bgcolor: 'background.paper' }}>
              <InputLabel id="category-select-label">
                {t('home.filterCategory', 'Category')}
              </InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={selectedCategoryId}
                label={t('home.filterCategory', 'Category')}
                onChange={handleCategoryChange}
              >
                <MenuItem value="all">
                  <em>{t('home.allCategories', 'All Categories')}</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Results Section */}
      {filteredActivities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {t('home.noResults', t('home.notFound'))}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedActivities.map((activity) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={activity.id}>
                <ActivityCard activity={activity} onRefresh={fetchInitialData}/>
              </Grid>
            ))}
          </Grid>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Home;