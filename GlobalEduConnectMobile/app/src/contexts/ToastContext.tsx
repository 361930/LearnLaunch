import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast from '../components/common/Toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextProps>({
  showToast: () => {},
  hideToast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [visible, setVisible] = useState(false);
  const toastCounter = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3000) => {
      // If there's already a toast, hide it first
      if (visible) {
        setVisible(false);
        // Small delay to ensure smooth transition
        setTimeout(() => {
          setToast({
            id: `toast-${toastCounter.current++}`,
            message,
            type,
            duration,
          });
          setVisible(true);
        }, 300);
      } else {
        setToast({
          id: `toast-${toastCounter.current++}`,
          message,
          type,
          duration,
        });
        setVisible(true);
      }
    },
    [visible]
  );

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          visible={visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastContext;