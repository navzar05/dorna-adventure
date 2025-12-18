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
import { employeeService } from '../services/employeeService';
import { ActivityForm, ActivityEditForm, CategoryForm } from '../components/activities';
import { EmployeeForm } from '../components/employees';
import { AdminWorkHoursManagement } from '../components/workHours';
import { BookingManagement } from '../components/bookings';
import type { Activity, Category } from '../types/activity';
import type { Employee } from '../types/employee';
import { SettingsManagement } from '../components/settings';

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

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  useEffect(() => {
    fetchActivities();
    fetchCategories();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await employeeService.getAllEmployees();
      setEmployees(response.data);
    } catch {
      toast.error(t('admin.messages.error'));
    } finally {
      setEmployeesLoading(false);
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
      valueFormatter: (value) => `RON ${value}`,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEmployeeSave = async (data: any) => {
  try {
    console.log("Saving employee data:", data);
    
    if (selectedEmployee) {
      // Update existing employee
      await employeeService.updateEmployee(selectedEmployee.id, data);
      toast.success(t('admin.employees.updated'));
    } else {
      // Create new employee
      await employeeService.createEmployee(data);
      toast.success(t('admin.employees.created'));
    }
    
    fetchEmployees();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error saving employee:", error);
    toast.error(error.response?.data?.error || error.response?.data?.message || t('admin.messages.error'));
  }
};

  const handleEmployeeDelete = async (id: number) => {
    if (window.confirm(t('admin.messages.confirmDelete'))) {
      try {
        await employeeService.deleteEmployee(id);
        toast.success(t('admin.employees.deleted'));
        fetchEmployees();
      } catch  {
        toast.error(t('admin.messages.error'));
      }
    }
  };

  const employeeColumns: GridColDef<Employee>[] = [
    { field: 'username', headerName: t('admin.employees.username'), width: 150 },
    { field: 'email', headerName: t('admin.employees.email'), flex: 1, minWidth: 200 },
    { field: 'firstName', headerName: t('admin.employees.firstName'), width: 150 },
    { field: 'lastName', headerName: t('admin.employees.lastName'), width: 150 },
    { field: 'phoneNumber', headerName: t('admin.employees.phoneNumber'), width: 150 },
    { field: 'enabled', headerName: t('admin.employees.enabled'), type: 'boolean', width: 100 },
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
            setSelectedEmployee(params.row);
            setEmployeeFormOpen(true);
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label={t('admin.delete')}
          onClick={() => handleEmployeeDelete(params.row.id)}
        />,
      ],
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        {t('admin.title')}
      </Typography>

      <Paper sx={{p: 2}}>
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t('admin.activities')} />
          <Tab label={t('admin.categories')} />
          <Tab label={t('admin.employees.title')} />
          {/* <Tab label={t('admin.workHours.title')} /> */}
          <Tab label={t('workHours.employeeManagement')} /> 
          <Tab label={t('admin.bookings.title')} />
          <Tab label={t('admin.settings.title')} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
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

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedEmployee(null);
                setEmployeeFormOpen(true);
              }}
            >
              {t('admin.employees.add')}
            </Button>
          </Box>

          <DataGrid
            rows={employees}
            columns={employeeColumns}
            loading={employeesLoading}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            autoHeight
          />
        </TabPanel>

        {/* Work Hours Tab */}
        {/* <TabPanel value={tabValue} index={3}>
          <WorkHoursForm />
        </TabPanel> */}

        <TabPanel value={tabValue} index={3}>
          <AdminWorkHoursManagement />
        </TabPanel>

        {/* Update Bookings tab index to 5 */}
        <TabPanel value={tabValue} index={4}>
          <BookingManagement />
        </TabPanel>

        {/* Update Settings tab index to 6 */}
        <TabPanel value={tabValue} index={5}>
          <SettingsManagement/>
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

      <EmployeeForm
        open={employeeFormOpen}
        onClose={() => {
          setEmployeeFormOpen(false);
          setSelectedEmployee(null);
        }}
        onSave={handleEmployeeSave}
        employee={selectedEmployee}
      />
    </Container>
  );
}