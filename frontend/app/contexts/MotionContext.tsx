import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface MotionContextType {
  animationEnabled: boolean;
  setAnimationEnabled: (value: boolean) => void;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

const STORAGE_KEY = '@redi_animation_enabled';

export function MotionProvider({ children }: { children: ReactNode }) {
  const [animationEnabled, setAnimationEnabledState] = useState(true);

  // Load preference from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value !== null) {
        setAnimationEnabledState(value === 'true');
      }
    });
  }, []);

  const setAnimationEnabled = (value: boolean) => {
    setAnimationEnabledState(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value));
  };

  const value = useMemo(
    () => ({ animationEnabled, setAnimationEnabled }),
    [animationEnabled]
  );

  return (
    <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
  );
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (context === undefined) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
}
