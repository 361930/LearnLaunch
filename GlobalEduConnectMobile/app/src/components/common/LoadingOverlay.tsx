import React from 'react';
import { StyleSheet, View, Modal, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  transparent = true,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: transparent
              ? theme.colors.overlay
              : theme.colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor: theme.colors.surface,
              ...theme.shadows.lg,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.spinner}
          />
          {message && (
            <Text
              style={[
                styles.message,
                {
                  color: theme.colors.text,
                  ...theme.typography.body1,
                },
              ]}
              accessibilityLiveRegion="polite"
            >
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
  },
});

export default LoadingOverlay;