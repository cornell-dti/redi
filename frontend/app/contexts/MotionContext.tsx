import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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

  return (
    <MotionContext.Provider
      value={{ animationEnabled, setAnimationEnabled }}
    >
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (context === undefined) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
}
