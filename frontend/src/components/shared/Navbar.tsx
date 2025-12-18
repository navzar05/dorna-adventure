// src/components/Navbar.tsx
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import {
  CalendarMonth as BookingsIcon,
  Explore as ActivitiesIcon,
  AdminPanelSettings as AdminIcon,
  AccessTime as ClockIcon
} from '@mui/icons-material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';

// Import dayjs and locales
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/en';
import 'dayjs/locale/ro';

// Enable relativeTime plugin
dayjs.extend(relativeTime);

const Navbar = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, logout, isAdmin, isEmployee } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [anchorElLang, setAnchorElLang] = React.useState<null | HTMLElement>(null);

  // Set dayjs locale when language changes
  React.useEffect(() => {
    dayjs.locale(i18n.language);
  }, [i18n.language]);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleOpenLangMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElLang(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleCloseLangMenu = () => {
    setAnchorElLang(null);
  };

  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/login');
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    handleCloseUserMenu();
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    dayjs.locale(lang); // Set dayjs locale immediately
    handleCloseLangMenu();
  };

  const currentLanguage = i18n.language;

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Desktop Logo */}
          <Box
            component="img"
            src="/logo.png"
            alt="Dorna Adventure Logo"
            sx={{
              display: { xs: 'none', md: 'flex' },
              height: 80,
              width: 'auto',
              mr: 2,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          />
          <Typography
            variant="h6"
            noWrap
            component="a"
            onClick={() => navigate('/')}
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            {t('nav.appName')}
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/home'); }}>
                <Typography sx={{ textAlign: 'center' }}>{t('nav.activities')}</Typography>
              </MenuItem>
              {!isAuthenticated && (
                <>
                  <MenuItem key="login" onClick={() => { handleCloseNavMenu(); navigate('/login'); }}>
                    <Typography sx={{ textAlign: 'center' }}>{t('nav.login')}</Typography>
                  </MenuItem>
                  <MenuItem key="register" onClick={() => { handleCloseNavMenu(); navigate('/register'); }}>
                    <Typography sx={{ textAlign: 'center' }}>{t('nav.register')}</Typography>
                  </MenuItem>
                </>
              )}
              {isAuthenticated && (
                <MenuItem component={Link} to="/my-bookings" onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{t('nav.myBookings')}</Typography>
                </MenuItem>
              )}
              {isAdmin && (
                <MenuItem key="admin" onClick={() => { handleCloseNavMenu(); navigate('/admin'); }}>
                  <Typography sx={{ textAlign: 'center' }}>{t('admin.title')}</Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <Box
            component="img"
            src="/logo.png"
            alt="Dorna Adventure Logo"
            sx={{
              display: { xs: 'flex', md: 'none' },
              height: 76,
              width: 'auto',
              mr: 1,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          />
          {/* <Typography
            variant="h6"
            noWrap
            component="a"
            onClick={() => navigate('/')}
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Dorna
          </Typography> */}

          {/* Desktop Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button
              onClick={() => navigate('/home')}
              color="inherit"
              startIcon={<ActivitiesIcon />}
              sx={{ 
                my: 2,
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {t('nav.activities')}
            </Button>
            {isAuthenticated && (
              <Button
                onClick={() => navigate('/my-bookings')}
                color="inherit"
                startIcon={<BookingsIcon />}
                sx={{ 
                  my: 2,
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('nav.myBookings')}
              </Button>
            )}
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                color="inherit"
                startIcon={<AdminIcon />}
                sx={{ 
                  my: 2,
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('admin.title')}
              </Button>
            )}
            {isEmployee && (
              <Button
                onClick={() => navigate('/my-work-hours')}
                color="inherit"
                startIcon={<ClockIcon />}
                sx={{ 
                  my: 2,
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('admin.workHours.title')}
              </Button>
            )}
          </Box>

          {/* Language Toggle */}
          <Box sx={{ mr: 1 }}>
            <Tooltip title="Language / Limbă">
              <IconButton onClick={handleOpenLangMenu} color="inherit">
                <LanguageIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorElLang}
              open={Boolean(anchorElLang)}
              onClose={handleCloseLangMenu}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem 
                onClick={() => changeLanguage('en')}
                selected={currentLanguage === 'en'}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🇬🇧 English
                </Box>
              </MenuItem>
              <MenuItem 
                onClick={() => changeLanguage('ro')}
                selected={currentLanguage === 'ro'}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🇷🇴 Română
                </Box>
              </MenuItem>
            </Menu>
          </Box>

          {/* Theme Toggle Button */}
          <Box sx={{ mr: 2 }}>
            <Tooltip title={mode === 'light' ? t('theme.dark') : t('theme.light')}>
              <IconButton onClick={toggleColorMode} color="inherit">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* User Menu */}
          {isAuthenticated ? (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar 
                    alt='User'
                    sx={{ 
                      bgcolor: 'secondary.main',
                      color: 'primary.dark' 
                    }}
                  >
                    U
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={() => handleMenuClick('/account')}>
                  <Typography sx={{ textAlign: 'center' }}>{t('nav.account')}</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Typography sx={{ textAlign: 'center' }}>{t('nav.logout')}</Typography>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                variant="outlined"
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                {t('nav.login')}
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/register')}
                variant="contained"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                {t('nav.register')}
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;