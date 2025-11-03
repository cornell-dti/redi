import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
} from 'react';
import Toast from '../components/ui/Toast';

interface ToastOptions {
  icon?: React.ReactNode;
  label: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastOptions, setToastOptions] = useState<ToastOptions>({
    label: '',
  });

  const showToast = (options: ToastOptions) => {
    setToastOptions(options);
    setVisible(true);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={visible}
        icon={toastOptions.icon}
        label={toastOptions.label}
        duration={toastOptions.duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
