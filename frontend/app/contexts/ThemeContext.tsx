import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppColors, updateAccentColors, updateNegativeColors, updateThemeColors } from '../components/AppColors';

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
  light: {
    accentDefault: string;
    accentDimmer: string;
    accentAlpha: string;
    negativeDefault: string;
    negativeDimmer: string;
    negativeDimmest: string;
  };
  dark: {
    accentDefault: string;
    accentDimmer: string;
    accentAlpha: string;
    negativeDefault: string;
    negativeDimmer: string;
    negativeDimmest: string;
  };
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
    light: {
      accentDefault: '#1B1B1B',
      accentDimmer: '#505050',
      accentAlpha: '#D9D9D9',
      negativeDefault: '#DB0500',
      negativeDimmer: '#FAD9D9',
      negativeDimmest: '#FDEFEF',
    },
    dark: {
      accentDefault: '#E5E5E5',
      accentDimmer: '#B8B8B8',
      accentAlpha: '#3A3A3A',
      negativeDefault: '#FF6B6B',
      negativeDimmer: '#4A2626',
      negativeDimmest: '#2A1818',
    },
  },
  pink: {
    name: 'pink',
    light: {
      accentDefault: '#E32CA2',
      accentDimmer: '#C80C85',
      accentAlpha: '#FCE9F5',
      negativeDefault: '#DB0500',
      negativeDimmer: '#FAD9D9',
      negativeDimmest: '#FDEFEF',
    },
    dark: {
      accentDefault: '#FF6FD8',
      accentDimmer: '#E854C0',
      accentAlpha: '#3D1F34',
      negativeDefault: '#FF6B6B',
      negativeDimmer: '#4A2626',
      negativeDimmest: '#2A1818',
    },
  },
  blue: {
    name: 'blue',
    light: {
      accentDefault: '#009BFF',
      accentDimmer: '#0681D1',
      accentAlpha: '#E5F5FF',
      negativeDefault: '#DB0500',
      negativeDimmer: '#FAD9D9',
      negativeDimmest: '#FDEFEF',
    },
    dark: {
      accentDefault: '#4DB8FF',
      accentDimmer: '#3AA0E6',
      accentAlpha: '#1A3444',
      negativeDefault: '#FF6B6B',
      negativeDimmer: '#4A2626',
      negativeDimmest: '#2A1818',
    },
  },
  green: {
    name: 'green',
    light: {
      accentDefault: '#009D00',
      accentDimmer: '#038703',
      accentAlpha: '#E5F5E5',
      negativeDefault: '#DB0500',
      negativeDimmer: '#FAD9D9',
      negativeDimmest: '#FDEFEF',
    },
    dark: {
      accentDefault: '#4ADE4A',
      accentDimmer: '#3BC43B',
      accentAlpha: '#1A3A1A',
      negativeDefault: '#FF6B6B',
      negativeDimmer: '#4A2626',
      negativeDimmest: '#2A1818',
    },
  },
  orange: {
    name: 'orange',
    light: {
      accentDefault: '#FF311E',
      accentDimmer: '#DA1B0A',
      accentAlpha: '#FFEAE8',
      negativeDefault: '#DB0500',
      negativeDimmer: '#FAD9D9',
      negativeDimmest: '#FDEFEF',
    },
    dark: {
      accentDefault: '#FF6B5A',
      accentDimmer: '#E8543F',
      accentAlpha: '#3D2420',
      negativeDefault: '#FF6B6B',
      negativeDimmer: '#4A2626',
      negativeDimmest: '#2A1818',
    },
  },
  purple: {
    name: 'purple',
    light: {
      accentDefault: '#5E007E',
      accentDimmer: '#410157',
      accentAlpha: '#EEE5F2',
      negativeDefault: '#DB0500',
      negativeDimmer: '#FAD9D9',
      negativeDimmest: '#FDEFEF',
    },
    dark: {
      accentDefault: '#C77FE0',
      accentDimmer: '#B366CC',
      accentAlpha: '#2F1A3A',
      negativeDefault: '#FF6B6B',
      negativeDimmer: '#4A2626',
      negativeDimmest: '#2A1818',
    },
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

    // Apply accent and negative colors based on mode
    const themeColors = mode === 'dark' ? theme.dark : theme.light;
    updateAccentColors(
      themeColors.accentDefault,
      themeColors.accentDimmer,
      themeColors.accentAlpha
    );
    updateNegativeColors(
      themeColors.negativeDefault,
      themeColors.negativeDimmer,
      themeColors.negativeDimmest
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
