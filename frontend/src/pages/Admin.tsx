// src/pages/Admin.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { activityService } from '../services/activityService';
import { categoryService } from '../services/categoryService';
import ActivityForm from '../components/ActivityForm';
import ActivityEditForm from '../components/ActivityEditForm';
import CategoryForm from '../components/CategoryForm';
import type { Activity, Category } from '../types/activity';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Admin() {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    fetchActivities();
    fetchCategories();
  }, []);

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await activityService.getAllActivities();
      setActivities(response.data);
    } catch  {
      toast.error(t('admin.messages.error'));
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryService.getAllCategories();
      setCategories(response.data);
    } catch {
      toast.error(t('admin.messages.error'));
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleActivitySave = async (activity: Partial<Activity>): Promise<Activity> => {
    if (selectedActivity) {
      // Update existing activity
      const response = await activityService.updateActivity(selectedActivity.id, activity);
      await fetchActivities();
      return response.data;
    } else {
      // Create new activity
      const response = await activityService.createActivity(activity);
      await fetchActivities();
      return response.data;
    }
  };

  const handleActivityDelete = async (id: number) => {
    if (window.confirm(t('admin.messages.confirmDelete'))) {
      try {
        await activityService.deleteActivity(id);
        toast.success(t('admin.messages.activityDeleted'));
        fetchActivities();
      } catch {
        toast.error(t('admin.messages.error'));
      }
    }
  };

  const handleCategorySave = async (category: Partial<Category>) => {
    if (selectedCategory) {
      await categoryService.updateCategory(selectedCategory.id, category);
    } else {
      await categoryService.createCategory(category);
    }
    fetchCategories();
  };

  const handleCategoryDelete = async (id: number) => {
    if (window.confirm(t('admin.messages.confirmDelete'))) {
      try {
        await categoryService.deleteCategory(id);
        toast.success(t('admin.messages.categoryDeleted'));
        fetchCategories();
      } catch {
        toast.error(t('admin.messages.error'));
      }
    }
  };

  const activityColumns: GridColDef<Activity>[] = [
    { field: 'id', headerName: t('admin.dataGrid.id'), width: 70 },
    { 
      field: 'name', 
      headerName: t('admin.dataGrid.name'), 
      flex: 1, 
      minWidth: 200 
    },
    {
      field: 'category',
      headerName: t('admin.dataGrid.category'),
      width: 150,
      valueGetter: (value: Category) => value?.name || '',
    },
    {
      field: 'pricePerPerson',
      headerName: t('admin.dataGrid.price'),
      width: 120,
      valueFormatter: (value) => `€${value}`,
    },
    {
      field: 'participants',
      headerName: t('admin.dataGrid.participants'),
      width: 130,
      valueGetter: (_value, row) => `${row.minParticipants}-${row.maxParticipants}`,
    },
    {
      field: 'duration',
      headerName: t('admin.dataGrid.duration'),
      width: 120,
    },
    {
      field: 'location',
      headerName: t('admin.dataGrid.location'),
      width: 150,
    },
    {
      field: 'active',
      headerName: t('admin.dataGrid.active'),
      type: 'boolean',
      width: 100,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('admin.dataGrid.actions'),
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label={t('admin.edit')}
          onClick={() => {
            setSelectedActivity(params.row);
            setActivityFormOpen(true);
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label={t('admin.delete')}
          onClick={() => handleActivityDelete(params.row.id)}
        />,
      ],
    },
  ];

  const categoryColumns: GridColDef<Category>[] = [
    { field: 'id', headerName: t('admin.dataGrid.id'), width: 70 },
    { 
      field: 'name', 
      headerName: t('admin.dataGrid.name'), 
      flex: 1, 
      minWidth: 200 
    },
    {
      field: 'slug',
      headerName: t('admin.dataGrid.slug'),
      width: 150,
    },
    {
      field: 'displayOrder',
      headerName: t('admin.dataGrid.order'),
      width: 100,
    },
    {
      field: 'active',
      headerName: t('admin.dataGrid.active'),
      type: 'boolean',
      width: 100,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: t('admin.dataGrid.actions'),
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label={t('admin.edit')}
          onClick={() => {
            setSelectedCategory(params.row);
            setCategoryFormOpen(true);
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label={t('admin.delete')}
          onClick={() => handleCategoryDelete(params.row.id)}
        />,
      ],
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        {t('admin.title')}
      </Typography>

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('admin.activities')} />
          <Tab label={t('admin.categories')} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedActivity(null);
                setActivityFormOpen(true);
              }}
            >
              {t('admin.addActivity')}
            </Button>
          </Box>

          <DataGrid
            rows={activities}
            columns={activityColumns}
            loading={activitiesLoading}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            autoHeight
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedCategory(null);
                setCategoryFormOpen(true);
              }}
            >
              {t('admin.addCategory')}
            </Button>
          </Box>

          <DataGrid
            rows={categories}
            columns={categoryColumns}
            loading={categoriesLoading}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            autoHeight
          />
        </TabPanel>
      </Paper>

      <ActivityForm
        open={activityFormOpen}
        onClose={() => {
          setActivityFormOpen(false);
          setSelectedActivity(null);
        }}
        onSave={handleActivitySave}
        activity={selectedActivity}
        categories={categories}
      />

      <CategoryForm
        open={categoryFormOpen}
        onClose={() => {
          setCategoryFormOpen(false);
          setSelectedCategory(null);
        }}
        onSave={handleCategorySave}
        category={selectedCategory}
      />

      {selectedActivity ? (
      <ActivityEditForm
        open={activityFormOpen}
        onClose={() => {
          setActivityFormOpen(false);
          setSelectedActivity(null);
        }}
        onSave={handleActivitySave}
        activity={selectedActivity}
        categories={categories}
      />
    ) : (
      <ActivityForm
        open={activityFormOpen}
        onClose={() => {
          setActivityFormOpen(false);
          setSelectedActivity(null);
        }}
        onSave={handleActivitySave}
        activity={null}
        categories={categories}
      />
    )}
    </Container>
  );
}