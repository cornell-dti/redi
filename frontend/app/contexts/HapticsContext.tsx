import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

interface HapticsContextType {
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => void;
}

const HapticsContext = createContext<HapticsContextType | undefined>(
  undefined
);

const STORAGE_KEY = '@redi_haptics_enabled';

export function HapticsProvider({ children }: { children: ReactNode }) {
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);

  // Load preference from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value !== null) {
        setHapticsEnabledState(value === 'true');
      }
    });
  }, []);

  const setHapticsEnabled = (value: boolean) => {
    setHapticsEnabledState(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value));
  };

  return (
    <HapticsContext.Provider value={{ hapticsEnabled, setHapticsEnabled }}>
      {children}
    </HapticsContext.Provider>
  );
}

export function useHaptics() {
  const context = useContext(HapticsContext);
  if (context === undefined) {
    throw new Error('useHaptics must be used within a HapticsProvider');
  }
  return context;
}
