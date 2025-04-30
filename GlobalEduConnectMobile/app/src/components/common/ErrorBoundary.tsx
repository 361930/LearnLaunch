import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from 'react-native-vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Save error to AsyncStorage for reporting next time app is online
    this.saveErrorToStorage(error, errorInfo);
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    // If props change and resetOnPropsChange is true, reset the error state
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      this.props.children !== prevProps.children
    ) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  async saveErrorToStorage(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      // Get existing errors
      const existingErrorsString = await AsyncStorage.getItem('app_errors');
      const existingErrors = existingErrorsString 
        ? JSON.parse(existingErrorsString) 
        : [];
      
      // Add new error with timestamp
      const newError = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
      
      // Keep last 10 errors only (to avoid storage overuse)
      const updatedErrors = [newError, ...existingErrors].slice(0, 10);
      
      // Save back to storage
      await AsyncStorage.setItem('app_errors', JSON.stringify(updatedErrors));
    } catch (e) {
      console.error('Failed to save error to storage:', e);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportError = async (): Promise<void> => {
    // In a real app, you would send the error to your backend
    // For now, we'll just show a console message
    console.log('Reporting error:', this.state.error);
    
    // Show confirmation alert
    alert('Thank you for reporting this issue. Our team will look into it.');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use that
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <MaterialCommunityIcons 
              name="alert-circle-outline" 
              size={80} 
              color="#F44336" 
            />
            
            <Text style={styles.title}>Something went wrong</Text>
            
            <Text style={styles.message}>
              The application has encountered an unexpected error.
            </Text>
            
            <View style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Error:</Text>
              <Text style={styles.errorText}>
                {this.state.error?.message || 'Unknown error'}
              </Text>
              
              {__DEV__ && this.state.errorInfo && (
                <>
                  <Text style={styles.errorTitle}>Component Stack:</Text>
                  <Text style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </>
              )}
            </View>
            
            <View style={styles.actions}>
              <Button 
                mode="contained" 
                onPress={this.handleReset}
                style={styles.button}
              >
                Try Again
              </Button>
              
              <Button 
                mode="outlined" 
                onPress={this.handleReportError}
                style={styles.button}
              >
                Report Problem
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  errorDetails: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  button: {
    marginHorizontal: 10,
  },
});

export default ErrorBoundary;