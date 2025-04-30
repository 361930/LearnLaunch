import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Animated,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

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

      // Set timeout to hide
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const getIconName = (): string => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'info':
      default:
        return 'information';
    }
  };

  const getBackgroundColor = (): string => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
      default:
        return theme.colors.info;
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: getBackgroundColor(),
            ...theme.shadows.md,
            transform: [{ translateY }],
            opacity,
          },
        ]}
        accessibilityLiveRegion="polite"
        accessible={true}
        accessibilityLabel={`${type} notification: ${message}`}
      >
        <View style={styles.contentContainer}>
          <MaterialCommunityIcons name={getIconName()} size={24} color="white" />
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <MaterialCommunityIcons name="close" size={20} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    width: width - 32,
    marginHorizontal: 16,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  message: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});

export default Toast;