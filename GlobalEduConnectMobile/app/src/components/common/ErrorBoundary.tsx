import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as StackTrace from 'stacktrace-js';
import { getColor } from '../../theme';
import { ThemeContextType, withTheme } from '../../contexts/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { AppState, AppStateStatus } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxStackTraceLines?: number;
  theme: ThemeContextType['theme']; // Injected from withTheme HOC
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  parsedStackTrace: string[];
  isExpanded: boolean;
  isClipboardAvailable: boolean;
}

class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Handle app state changes to potentially recover from errors when app comes to foreground
  private appStateSubscription: any;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      parsedStackTrace: [],
      isExpanded: false,
      isClipboardAvailable: Platform.OS !== 'web',
    };
  }
  
  componentDidMount() {
    // Subscribe to app state changes to potentially auto-recover
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
  }
  
  componentWillUnmount() {
    // Clean up app state subscription
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
  
  handleAppStateChange = (nextAppState: AppStateStatus) => {
    // When app comes back to active state, if there was an error
    // we'll try to reset the error state to allow recovery
    if (nextAppState === 'active' && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        parsedStackTrace: [],
      });
    }
  };
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state to indicate an error has occurred
    return {
      hasError: true,
      error,
      errorInfo: null,
      parsedStackTrace: [],
      isExpanded: false,
      isClipboardAvailable: Platform.OS !== 'web',
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Parse stack trace
    StackTrace.fromError(error)
      .then(stackframes => {
        const stackTraceLines = stackframes.map(frame => frame.toString());
        this.setState({
          errorInfo,
          parsedStackTrace: stackTraceLines,
        });
      })
      .catch(parseError => {
        console.error('Error parsing stack trace:', parseError);
        // If stacktrace parsing fails, still update state with error info
        this.setState({ errorInfo });
      });
    
    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }
  
  // Attempt to reset the error state
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      parsedStackTrace: [],
    });
  };
  
  // Toggle expanded state for stack trace
  toggleExpanded = () => {
    this.setState(prevState => ({
      isExpanded: !prevState.isExpanded,
    }));
  };
  
  // Copy error details to clipboard
  copyToClipboard = async () => {
    try {
      const { error, parsedStackTrace } = this.state;
      const errorText = error ? `${error.name}: ${error.message}\n\nStack Trace:\n${parsedStackTrace.join('\n')}` : 'No error details available';
      await Clipboard.setStringAsync(errorText);
      console.log('Error details copied to clipboard');
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };
  
  render() {
    const { hasError, error, parsedStackTrace, isExpanded, isClipboardAvailable } = this.state;
    const { children, fallback, maxStackTraceLines = 10, theme } = this.props;
    
    if (!hasError) {
      return children;
    }
    
    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }
    
    // Default error UI
    const errorMessage = error ? error.message : 'An unexpected error occurred';
    const errorName = error ? error.name : 'Error';
    
    // Limit the number of stack trace lines shown initially
    const displayedStackTrace = isExpanded
      ? parsedStackTrace
      : parsedStackTrace.slice(0, maxStackTraceLines);
    
    // Get colors from theme
    const backgroundColor = getColor(theme, 'background');
    const textColor = getColor(theme, 'text');
    const errorColor = getColor(theme, 'error');
    const borderColor = getColor(theme, 'border');
    const cardColor = getColor(theme, 'card');
    
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.errorCard, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.header}>
            <MaterialIcons name="error" size={24} color={errorColor} />
            <Text style={[styles.errorTitle, { color: errorColor }]}>
              {errorName}
            </Text>
          </View>
          
          <Text style={[styles.errorMessage, { color: textColor }]}>
            {errorMessage}
          </Text>
          
          {parsedStackTrace.length > 0 && (
            <View style={styles.stackTraceContainer}>
              <View style={styles.stackTraceHeader}>
                <Text style={[styles.stackTraceTitle, { color: textColor }]}>
                  Stack Trace
                </Text>
                
                <View style={styles.stackTraceActions}>
                  {isClipboardAvailable && (
                    <TouchableOpacity 
                      onPress={this.copyToClipboard}
                      style={styles.actionButton}
                    >
                      <MaterialIcons name="content-copy" size={18} color={textColor} />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    onPress={this.toggleExpanded}
                    style={styles.actionButton}
                  >
                    <MaterialIcons 
                      name={isExpanded ? 'expand-less' : 'expand-more'} 
                      size={18} 
                      color={textColor} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <ScrollView style={styles.stackTrace}>
                {displayedStackTrace.map((line, index) => (
                  <Text 
                    key={index}
                    style={[styles.stackTraceLine, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {line}
                  </Text>
                ))}
                
                {!isExpanded && parsedStackTrace.length > maxStackTraceLines && (
                  <TouchableOpacity onPress={this.toggleExpanded}>
                    <Text style={[styles.showMoreText, { color: getColor(theme, 'primary') }]}>
                      Show more... ({parsedStackTrace.length - maxStackTraceLines} more lines)
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: getColor(theme, 'primary') }]}
            onPress={this.resetError}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 16,
  },
  stackTraceContainer: {
    marginBottom: 16,
  },
  stackTraceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stackTraceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stackTraceActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  stackTrace: {
    maxHeight: 200,
  },
  stackTraceLine: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : Platform.OS === 'android' ? 'monospace' : 'Courier',
  },
  showMoreText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  retryButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Wrap component with ThemeContext
export const ErrorBoundary = withTheme(ErrorBoundaryComponent);

export default ErrorBoundary;