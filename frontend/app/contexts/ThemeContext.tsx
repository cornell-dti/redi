import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppColors, updateAccentColors, updateThemeColors } from '../components/AppColors';

export type ThemeName =
  | 'default'
  | 'pink'
  | 'blue'
  | 'green'
  | 'orange'
  | 'purple';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  accentDefault: string;
  accentDimmer: string;
  accentAlpha: string;
}

// Dark mode color palette
const darkModeColors = {
  backgroundDefault: '#121212',
  backgroundDimmer: '#1E1E1E',
  backgroundDimmest: '#2A2A2A',
  foregroundDefault: '#E5E5E5',
  foregroundDimmer: '#999999',
  overlayDark: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(255, 255, 255, 0.12)',
  borderDefault: '#333333',
  borderDimmer: '#444444',
};

// Light mode color palette
const lightModeColors = {
  backgroundDefault: '#FFFFFF',
  backgroundDimmer: '#F4F4F4',
  backgroundDimmest: '#E5E5E5',
  foregroundDefault: '#1F1F1F',
  foregroundDimmer: '#7A7A7A',
  overlayDark: 'rgba(0, 0, 0, 0.35)',
  overlayLight: 'rgba(255, 255, 255, 0.08)',
  borderDefault: '#E0E0E0',
  borderDimmer: '#DDDDDD',
};

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
    accentDefault: '#009BFF',
    accentDimmer: '#0681D1',
    accentAlpha: '#E5F5FF',
  },
  green: {
    name: 'green',
    accentDefault: '#009D00',
    accentDimmer: '#038703',
    accentAlpha: '#E5F5E5',
  },
  orange: {
    name: 'orange',
    accentDefault: '#FF311E',
    accentDimmer: '#DA1B0A',
    accentAlpha: '#FFEAE8',
  },
  purple: {
    name: 'purple',
    accentDefault: '#5E007E',
    accentDimmer: '#410157',
    accentAlpha: '#EEE5F2',
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  themeMode: ThemeMode;
  setTheme: (themeName: ThemeName) => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  themeVersion: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';
const MODE_STORAGE_KEY = '@app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode}) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes.default);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    loadTheme();
  }, []);

  const applyTheme = (theme: Theme, mode: ThemeMode) => {
    console.log('🎨 Applying theme:', theme.name, 'Mode:', mode);

    // Apply mode colors (light/dark)
    const modeColors = mode === 'dark' ? darkModeColors : lightModeColors;
    console.log('🌈 Mode colors:', modeColors);
    updateThemeColors(modeColors);

    // Apply accent colors
    updateAccentColors(
      theme.accentDefault,
      theme.accentDimmer,
      theme.accentAlpha
    );

    console.log('✅ Theme applied. Background:', AppColors.backgroundDefault);
    setThemeVersion((v) => v + 1);
  };

  const loadTheme = async () => {
    try {
      const [savedTheme, savedMode] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(MODE_STORAGE_KEY),
      ]);

      const theme = savedTheme && savedTheme in themes
        ? themes[savedTheme as ThemeName]
        : themes.default;
      const mode = (savedMode as ThemeMode) || 'light';

      setCurrentTheme(theme);
      setThemeMode(mode);
      applyTheme(theme, mode);
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (themeName: ThemeName) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeName);
      const theme = themes[themeName];
      setCurrentTheme(theme);
      applyTheme(theme, themeMode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const setMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(MODE_STORAGE_KEY, mode);
      setThemeMode(mode);
      applyTheme(currentTheme, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themeMode, setTheme, setMode, themeVersion }}>
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
