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
                // Light mode - Very light green & Warm accent
                primary: {
                  main: '#a7c957', // Light sage green
                  light: '#d4e09b', // Very light green
                  dark: '#6a994e', // Medium green
                  contrastText: '#1a1a1a',
                },
                secondary: {
                  main: '#f4a261', // Warm terracotta
                  light: '#f8b88b', // Light terracotta
                  dark: '#e76f51', // Darker orange
                  contrastText: '#1a1a1a',
                },
                background: {
                  default: '#fafafa',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#1a1a1a',
                  secondary: '#4a4a4a',
                },
              }
            : {
                // Dark mode - Very dark backgrounds
                primary: {
                  main: '#6a994e', // Medium green
                  light: '#a7c957', // Light sage green
                  dark: '#386641', // Dark green
                  contrastText: '#ffffff',
                },
                secondary: {
                  main: '#f4a261', // Warm terracotta
                  light: '#f8b88b', // Light terracotta
                  dark: '#e76f51', // Darker orange
                  contrastText: '#1a1a1a',
                },
                background: {
                  default: '#0d1b0d', // Very dark green-black
                  paper: '#1a2a1a', // Dark green-gray
                },
                text: {
                  primary: '#e8f5e9',
                  secondary: '#c8e6c9',
                },
              }),
          success: {
            main: '#4caf50',
            light: '#81c784',
            dark: '#388e3c',
          },
          info: {
            main: '#29b6f6',
            light: '#4fc3f7',
            dark: '#0288d1',
          },
          warning: {
            main: '#ffa726',
            light: '#ffb74d',
            dark: '#f57c00',
          },
          error: {
            main: '#ef5350',
            light: '#e57373',
            dark: '#c62828',
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
                    ? '0 4px 12px rgba(167, 201, 87, 0.3)'
                    : '0 4px 12px rgba(106, 153, 78, 0.4)',
                },
              },
              contained: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #a7c957 0%, #d4e09b 100%)'
                  : 'linear-gradient(135deg, #386641 0%, #6a994e 100%)',
                '&:hover': {
                  background: mode === 'light'
                    ? 'linear-gradient(135deg, #6a994e 0%, #a7c957 100%)'
                    : 'linear-gradient(135deg, #1b3a1b 0%, #386641 100%)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === 'light'
                  ? '0 4px 20px rgba(0, 0, 0, 0.08)'
                  : '0 4px 20px rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 8px 32px rgba(167, 201, 87, 0.2)'
                    : '0 8px 32px rgba(106, 153, 78, 0.3)',
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
                  ? 'linear-gradient(135deg, #a7c957 0%, #d4e09b 100%)'
                  : 'linear-gradient(135deg, #6a994e 0%, #a7c957 100%)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                background: mode === 'light'
                  ? 'linear-gradient(135deg, #6a994e 0%, #a7c957 100%)'
                  : 'linear-gradient(135deg, #0d1b0d 0%, #1a2a1a 100%)',
                boxShadow: mode === 'light'
                  ? '0 2px 12px rgba(106, 153, 78, 0.2)'
                  : '0 2px 12px rgba(0, 0, 0, 0.5)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              elevation1: {
                boxShadow: mode === 'light'
                  ? '0 2px 12px rgba(0, 0, 0, 0.08)'
                  : '0 2px 12px rgba(0, 0, 0, 0.4)',
              },
              elevation3: {
                boxShadow: mode === 'light'
                  ? '0 4px 20px rgba(0, 0, 0, 0.12)'
                  : '0 4px 20px rgba(0, 0, 0, 0.5)',
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