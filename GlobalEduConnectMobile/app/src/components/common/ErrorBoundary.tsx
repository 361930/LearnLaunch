import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColor, getShadow } from '../../theme';
import { lightTheme } from '../../theme';

// Error keys in AsyncStorage
const ERROR_STORAGE_KEY = 'gec_error_logs';
const MAX_STORED_ERRORS = 10;

// Props for the ErrorBoundary component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  reset?: () => void;
}

// State for the ErrorBoundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorHistory: ErrorLogEntry[];
  showErrorDetails: boolean;
}

// Error log entry structure
interface ErrorLogEntry {
  timestamp: number;
  message: string;
  stack?: string;
  componentStack?: string;
}

/**
 * ErrorBoundary component for catching and displaying errors
 * 
 * Features:
 * - Catches errors in child components
 * - Displays user-friendly error messages
 * - Allows error reporting
 * - Provides error details for developers
 * - Stores error history for debugging
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorHistory: [],
      showErrorDetails: false,
    };
  }

  // React error boundary lifecycle method
  static getDerivedStateFromError(_: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  // React error boundary lifecycle method
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error in AsyncStorage
    this.storeError(error, errorInfo);
  }

  // Store error in AsyncStorage for later analysis
  async storeError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      // Create new error log entry
      const newError: ErrorLogEntry = {
        timestamp: Date.now(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };

      // Get existing errors
      let storedErrors: ErrorLogEntry[] = [];
      const storedErrorsJson = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
      
      if (storedErrorsJson) {
        storedErrors = JSON.parse(storedErrorsJson);
      }

      // Add new error and limit the number of stored errors
      const updatedErrors = [newError, ...storedErrors].slice(0, MAX_STORED_ERRORS);
      
      // Save updated errors
      await AsyncStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(updatedErrors));
      
      // Update state
      this.setState({ errorHistory: updatedErrors });
    } catch (storageError) {
      console.error('Failed to store error:', storageError);
    }
  }

  // Load error history from AsyncStorage
  async loadErrorHistory(): Promise<void> {
    try {
      const storedErrorsJson = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
      
      if (storedErrorsJson) {
        const storedErrors: ErrorLogEntry[] = JSON.parse(storedErrorsJson);
        this.setState({ errorHistory: storedErrors });
      }
    } catch (error) {
      console.error('Failed to load error history:', error);
    }
  }

  // Clear error history from AsyncStorage
  async clearErrorHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
      this.setState({ errorHistory: [] });
    } catch (error) {
      console.error('Failed to clear error history:', error);
    }
  }

  // Reset the error boundary
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    });

    // Call reset callback if provided
    if (this.props.reset) {
      this.props.reset();
    }
  };

  // Toggle error details visibility
  toggleErrorDetails = (): void => {
    this.setState(prevState => ({
      showErrorDetails: !prevState.showErrorDetails,
    }));
  };

  // Format error stack for display
  formatErrorStack(stack?: string): string {
    if (!stack) return 'No stack trace available';
    
    return stack
      .split('\n')
      .slice(0, 10) // Limit to first 10 lines
      .join('\n');
  }

  // Render error UI
  renderError(): ReactNode {
    const { error, errorInfo, showErrorDetails } = this.state;
    const theme = lightTheme; // Always use light theme for error UI

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <View style={styles.container}>
        <View style={[styles.errorCard, getShadow(theme, 'md')]}>
          <MaterialIcons 
            name="error-outline" 
            size={48} 
            color={getColor(theme, 'error')}
            style={styles.icon}
          />
          
          <Text style={styles.title}>Something went wrong</Text>
          
          <Text style={styles.message}>
            {error?.message || 'An unexpected error occurred in the application.'}
          </Text>
          
          <View style={styles.actions}>
            <Button 
              mode="contained" 
              onPress={this.resetErrorBoundary}
              style={[styles.button, { backgroundColor: getColor(theme, 'primary') }]}
              labelStyle={styles.buttonText}
            >
              Try Again
            </Button>
            
            <Button 
              mode="outlined" 
              onPress={this.toggleErrorDetails}
              style={styles.button}
              labelStyle={{ color: getColor(theme, 'primary') }}
            >
              {showErrorDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </View>
          
          {showErrorDetails && (
            <ScrollView 
              style={styles.detailsContainer}
              contentContainerStyle={styles.detailsContent}
            >
              <Text style={styles.detailsTitle}>Error Details:</Text>
              
              {error && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Error:</Text>
                  <Text style={styles.detailsText}>{error.name}: {error.message}</Text>
                </View>
              )}
              
              {error?.stack && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Stack:</Text>
                  <Text style={styles.detailsCode}>
                    {this.formatErrorStack(error.stack)}
                  </Text>
                </View>
              )}
              
              {errorInfo?.componentStack && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsLabel}>Component Stack:</Text>
                  <Text style={styles.detailsCode}>
                    {this.formatErrorStack(errorInfo.componentStack)}
                  </Text>
                </View>
              )}
              
              {__DEV__ && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => this.clearErrorHistory()}
                >
                  <Text style={styles.clearButtonText}>Clear Error History</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    );
  }

  render(): ReactNode {
    const { hasError } = this.state;
    
    if (hasError) {
      return this.renderError();
    }
    
    return this.props.children;
  }
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  errorCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  button: {
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  detailsContainer: {
    maxHeight: 300,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 8,
  },
  detailsContent: {
    padding: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: '#4B5563',
  },
  detailsCode: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 4,
  },
  clearButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ErrorBoundary;