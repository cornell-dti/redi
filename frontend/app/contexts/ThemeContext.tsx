import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { updateAccentColors } from '../components/AppColors';

export type ThemeName =
  | 'default'
  | 'pink'
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple';

export interface Theme {
  name: ThemeName;
  accentDefault: string;
  accentDimmer: string;
  accentAlpha: string;
}

export const themes: Record<ThemeName, Theme> = {
  default: {
    name: 'default',
    accentDefault: '#1B1B1B',
    accentDimmer: '#505050',
    accentAlpha: '#D9D9D9',
  },
  pink: {
    name: 'pink',
    accentDefault: '#E32CA2',
    accentDimmer: '#C80C85',
    accentAlpha: '#FCE9F5',
  },
  blue: {
    name: 'blue',
    accentDefault: '#0062FB',
    accentDimmer: '#0051D1',
    accentAlpha: '#E5EFFE',
  },
  green: {
    name: 'green',
    accentDefault: '#008025',
    accentDimmer: '#00691E',
    accentAlpha: '#E5F2E9',
  },
  orange: {
    name: 'orange',
    accentDefault: '#EB4C1F',
    accentDimmer: '#BB3A15',
    accentAlpha: '#FDEDE8',
  },
  purple: {
    name: 'purple',
    accentDefault: '#550AB7',
    accentDimmer: '#3C0288',
    accentAlpha: '#EDE6F7',
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeName: ThemeName) => Promise<void>;
  themeVersion: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes.default);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && savedTheme in themes) {
        const theme = themes[savedTheme as ThemeName];
        setCurrentTheme(theme);
        updateAccentColors(
          theme.accentDefault,
          theme.accentDimmer,
          theme.accentAlpha
        );
        setThemeVersion((v) => v + 1);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (themeName: ThemeName) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeName);
      const theme = themes[themeName];
      setCurrentTheme(theme);
      updateAccentColors(
        theme.accentDefault,
        theme.accentDimmer,
        theme.accentAlpha
      );
      setThemeVersion((v) => v + 1);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themeVersion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook that forces a re-render when theme changes
// Use this in components that use AppColors in StyleSheet.create()
export function useThemeAware() {
  const { themeVersion } = useTheme();
  const [, setCounter] = useState(0);

  useEffect(() => {
    setCounter((c) => c + 1);
  }, [themeVersion]);

  return themeVersion;
}
