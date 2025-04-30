import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Animated, StyleSheet, View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { getColor, getShadow } from '../theme';

// Toast types
export type ToastType = 'info' | 'success' | 'warning' | 'error';

// Toast configuration
export interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Toast context type
interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  hideToast: () => void;
}

// Create context
const ToastContext = createContext<ToastContextType | null>(null);

// Toast provider props
interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // Animation state values
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // Toast state
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState<ToastConfig>({
    type: 'info',
    message: '',
  });
  
  // Timeout reference
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get theme
  const { theme } = useTheme();
  
  // Show the toast
  const showToast = (config: ToastConfig) => {
    // Clear any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    // Update toast config
    setToast({
      ...config,
      duration: config.duration || 3000, // Default duration: 3 seconds
    });
    
    // Show the toast
    setVisible(true);
    
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto-hide after duration (if not an error toast)
    if (config.type !== 'error') {
      hideTimeoutRef.current = setTimeout(() => {
        hideToast();
      }, config.duration || 3000);
    }
  };
  
  // Hide the toast
  const hideToast = () => {
    // Only proceed if toast is visible
    if (!visible) return;
    
    // Animate out
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
    
    // Clear timeout if it exists
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);
  
  // Get toast icon based on type
  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'info':
        return 'info-outline';
      case 'success':
        return 'check-circle-outline';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error-outline';
      default:
        return 'info-outline';
    }
  };
  
  // Get toast background color based on type
  const getToastBackgroundColor = (type: ToastType): string => {
    switch (type) {
      case 'info':
        return getColor(theme, 'info');
      case 'success':
        return getColor(theme, 'success');
      case 'warning':
        return getColor(theme, 'warning');
      case 'error':
        return getColor(theme, 'error');
      default:
        return getColor(theme, 'info');
    }
  };
  
  // Build toast styles
  const toastStyles: ViewStyle = {
    ...styles.toast,
    ...getShadow(theme, 'md'),
    backgroundColor: getColor(theme, 'background'),
    borderLeftColor: getToastBackgroundColor(toast.type),
  };
  
  const iconColor = getToastBackgroundColor(toast.type);
  const textColor = getColor(theme, 'text');
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast component */}
      {visible && (
        <Animated.View 
          style={[
            toastStyles,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <View style={styles.toastContent}>
            <MaterialIcons 
              name={getToastIcon(toast.type)} 
              size={24} 
              color={iconColor} 
              style={styles.icon}
            />
            
            <Text 
              style={[
                styles.message,
                { color: textColor },
              ]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
            
            {toast.action && (
              <TouchableOpacity 
                onPress={() => {
                  toast.action?.onPress();
                  hideToast();
                }}
                style={styles.actionButton}
              >
                <Text 
                  style={[
                    styles.actionText,
                    { color: iconColor },
                  ]}
                >
                  {toast.action.label}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              onPress={hideToast}
              style={styles.closeButton}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <MaterialIcons 
                name="close" 
                size={20} 
                color={getColor(theme, 'textSecondary')} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

// Custom hook for using toast
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

// Styles
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 40, // Provide space for the status bar
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 8,
    borderLeftWidth: 4,
    overflow: 'hidden',
    minHeight: 54,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default ToastContext;