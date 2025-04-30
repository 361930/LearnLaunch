import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="error-boundary-actions">
              <button
                className="error-boundary-button"
                onClick={() => {
                  // Check if offline
                  if (!navigator.onLine) {
                    alert('You are currently offline. Please connect to the internet and try again.');
                    return;
                  }
                  
                  // Try to reload the page to recover
                  window.location.reload();
                }}
              >
                Try Again
              </button>
              <button
                className="error-boundary-button secondary"
                onClick={() => {
                  // Go back to home page
                  window.location.href = '/';
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            .error-boundary-container {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              padding: 20px;
              background-color: #f9fafb;
            }
            
            .error-boundary-content {
              max-width: 500px;
              padding: 30px;
              border-radius: 8px;
              background-color: white;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            
            .error-boundary-title {
              margin-bottom: 16px;
              font-size: 24px;
              color: #1f2937;
            }
            
            .error-boundary-message {
              margin-bottom: 24px;
              color: #6b7280;
            }
            
            .error-boundary-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
            }
            
            .error-boundary-button {
              padding: 10px 20px;
              background-color: #4f46e5;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: background-color 0.2s;
            }
            
            .error-boundary-button:hover {
              background-color: #4338ca;
            }
            
            .error-boundary-button.secondary {
              background-color: #e5e7eb;
              color: #4b5563;
            }
            
            .error-boundary-button.secondary:hover {
              background-color: #d1d5db;
            }
            
            @media (prefers-color-scheme: dark) {
              .error-boundary-container {
                background-color: #1f2937;
              }
              
              .error-boundary-content {
                background-color: #111827;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              }
              
              .error-boundary-title {
                color: #f3f4f6;
              }
              
              .error-boundary-message {
                color: #9ca3af;
              }
              
              .error-boundary-button.secondary {
                background-color: #374151;
                color: #e5e7eb;
              }
              
              .error-boundary-button.secondary:hover {
                background-color: #4b5563;
              }
            }
          `}} />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;