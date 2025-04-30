import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Animated, View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ANIMATION } from '../config/constants';
import { useTheme } from './ThemeContext';

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast position
type ToastPosition = 'top' | 'bottom';

// Toast data
interface ToastData {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
  position?: ToastPosition;
}

// Context value
interface ToastContextValue {
  showToast: (options: Omit<ToastData, 'id'>) => void;
  hideToast: (id?: number) => void;
}

// Create context
const ToastContext = createContext<ToastContextValue | null>(null);

// Toast provider props
interface ToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  defaultPosition = 'top',
  defaultDuration = 3000,
}: ToastProviderProps) {
  // Theme
  const { colors, isDark } = useTheme();
  
  // State for active toasts
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  // Animation value
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // ID counter for unique toast IDs
  const toastIdCounter = useRef(0);
  
  // Show toast
  const showToast = useCallback(({
    type,
    message,
    duration = defaultDuration,
    position = defaultPosition,
  }: Omit<ToastData, 'id'>) => {
    // Create toast with unique ID
    const id = toastIdCounter.current++;
    const newToast: ToastData = {
      id,
      type,
      message,
      duration,
      position,
    };
    
    // Add toast to state
    setToasts(currentToasts => [...currentToasts, newToast]);
    
    // Auto-hide toast after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
    
    // Animate toast in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATION.SHORT,
      useNativeDriver: true,
    }).start();
    
    return id;
  }, [fadeAnim, defaultDuration, defaultPosition]);
  
  // Hide toast
  const hideToast = useCallback((id?: number) => {
    // Animate out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: ANIMATION.SHORT,
      useNativeDriver: true,
    }).start(() => {
      // Remove toast from state
      setToasts(currentToasts => 
        id !== undefined
          ? currentToasts.filter(toast => toast.id !== id)
          : currentToasts.slice(1) // Remove oldest toast if no ID specified
      );
    });
  }, [fadeAnim]);
  
  // Get icon for toast type
  const getIconForType = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };
  
  // Get background color for toast type
  const getBackgroundColorForType = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.info;
    }
  };
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast container */}
      {toasts.map(toast => (
        <Animated.View
          key={toast.id}
          style={[
            styles.container,
            toast.position === 'top' ? styles.top : styles.bottom,
            {
              backgroundColor: getBackgroundColorForType(toast.type),
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [toast.position === 'top' ? -100 : 100, 0],
                  }),
                },
              ],
            },
            isDark ? styles.darkShadow : styles.lightShadow,
          ]}
        >
          <TouchableOpacity
            style={styles.content}
            activeOpacity={0.8}
            onPress={() => hideToast(toast.id)}
          >
            <MaterialIcons
              name={getIconForType(toast.type)}
              size={24}
              color={colors.white}
              style={styles.icon}
            />
            <Text style={styles.message}>{toast.message}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => hideToast(toast.id)}
            >
              <MaterialIcons
                name="close"
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    padding: 0,
    borderRadius: 8,
    zIndex: 9999,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  top: {
    top: 50,
  },
  bottom: {
    bottom: 50,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  lightShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});