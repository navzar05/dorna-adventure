// src/context/ThemeContext.tsx
import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeContextProvider');
  }
  return context;
};

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    // Load from localStorage or default to light
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as PaletteMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode
                primary: {
                  main: '#2d6a4f',
                  light: '#52b788',
                  dark: '#1b4332',
                  contrastText: '#ffffff',
                },
                secondary: {
                  main: '#74c69d',
                  light: '#95d5b2',
                  dark: '#52b788',
                  contrastText: '#ffffff',
                },
                background: {
                  default: '#f8fdf9',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#1b4332',
                  secondary: '#2d6a4f',
                },
              }
            : {
                // Dark mode
                primary: {
                  main: '#52b788',
                  light: '#74c69d',
                  dark: '#2d6a4f',
                  contrastText: '#ffffff',
                },
                secondary: {
                  main: '#95d5b2',
                  light: '#b7e4c7',
                  dark: '#74c69d',
                  contrastText: '#1b4332',
                },
                background: {
                  default: '#0a1f1a',
                  paper: '#1b4332',
                },
                text: {
                  primary: '#d8f3dc',
                  secondary: '#95d5b2',
                },
              }),
          success: {
            main: '#40916c',
            light: '#52b788',
            dark: '#2d6a4f',
          },
          info: {
            main: '#74c69d',
            light: '#95d5b2',
            dark: '#52b788',
          },
          warning: {
            main: '#d4a574',
            light: '#e5c7a3',
            dark: '#b8935f',
          },
          error: {
            main: '#d64545',
            light: '#e57373',
            dark: '#b71c1c',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 700,
          },
          h3: {
            fontWeight: 600,
          },
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '10px 24px',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: mode === 'light' 
                    ? '0 4px 12px rgba(45, 106, 79, 0.15)'
                    : '0 4px 12px rgba(82, 183, 136, 0.25)',
                },
              },
              contained: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)'
                  : 'linear-gradient(135deg, #52b788 0%, #74c69d 100%)',
                '&:hover': {
                  background: mode === 'light'
                    ? 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)'
                    : 'linear-gradient(135deg, #40916c 0%, #52b788 100%)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === 'light'
                  ? '0 4px 20px rgba(45, 106, 79, 0.08)'
                  : '0 4px 20px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 8px 32px rgba(45, 106, 79, 0.12)'
                    : '0 8px 32px rgba(82, 183, 136, 0.2)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
              },
              colorPrimary: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #52b788 0%, #74c69d 100%)'
                  : 'linear-gradient(135deg, #74c69d 0%, #95d5b2 100%)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)'
                  : 'linear-gradient(135deg, #0a1f1a 0%, #1b4332 100%)',
                boxShadow: mode === 'light'
                  ? '0 2px 12px rgba(27, 67, 50, 0.15)'
                  : '0 2px 12px rgba(0, 0, 0, 0.5)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0 2px 12px rgba(45, 106, 79, 0.08)'
                  : '0 2px 12px rgba(0, 0, 0, 0.3)',
              },
              elevation3: {
                boxShadow: mode === 'light'
                  ? '0 4px 20px rgba(45, 106, 79, 0.12)'
                  : '0 4px 20px rgba(0, 0, 0, 0.4)',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};