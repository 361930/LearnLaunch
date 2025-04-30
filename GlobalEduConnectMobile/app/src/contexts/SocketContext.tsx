import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config/constants';
import secureStorage from '../utils/secureStorage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  reconnect: () => void;
  disconnect: () => void;
  sendPrivateMessage: (recipientId: number, message: string) => void;
  sendClassMessage: (classId: number, message: string) => void;
  sendTypingIndicator: (data: { recipient_id?: number; class_id?: number }) => void;
  sendTypingStopped: (data: { recipient_id?: number; class_id?: number }) => void;
  subscribeToNotifications: (channels: string[]) => void;
  unsubscribeFromNotifications: (channels: string[]) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const [networkAvailable, setNetworkAvailable] = useState<boolean>(true);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Initialize Socket.IO connection
  const initializeSocket = async () => {
    try {
      // Only proceed if user is logged in
      if (!user) {
        return;
      }
      
      // Get auth token from secure storage
      const token = await secureStorage.getItem('auth_token');
      
      if (!token) {
        console.warn('No authentication token found for socket connection');
        return;
      }
      
      // Connect to WebSocket server with auth token
      const newSocket = io(`${API_URL}`, {
        path: '/ws',
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });
      
      // Register event handlers
      setupSocketEventHandlers(newSocket);
      
      // Store socket reference
      socketRef.current = newSocket;
      setSocket(newSocket);
      
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
          setIsConnected(false);
        }
      };
    } catch (error) {
      console.error('Socket initialization error:', error);
      showToast({
        type: 'error',
        message: 'Failed to connect to chat service',
      });
    }
  };
  
  // Setup Socket.IO event handlers
  const setupSocketEventHandlers = (socket: Socket) => {
    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setReconnectAttempt(0);
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
      
      // Show message for certain disconnect reasons
      if (reason === 'io server disconnect') {
        showToast({
          type: 'warning',
          message: 'Disconnected from server',
        });
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setIsConnected(false);
      
      // Show error message
      if (reconnectAttempt === 0) {
        showToast({
          type: 'error',
          message: 'Connection error: ' + error.message,
        });
      }
      
      setReconnectAttempt((prev) => prev + 1);
    });
    
    // Server error events
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      showToast({
        type: 'error',
        message: error.message || 'An error occurred',
      });
    });
    
    // Add other event listeners as needed for your app
    // For example, message events, notifications, etc.
  };
  
  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const newNetworkState = Boolean(state.isConnected);
      setNetworkAvailable(newNetworkState);
      
      // If reconnecting to network and socket is disconnected, try to reconnect
      if (newNetworkState && socketRef.current && !socketRef.current.connected) {
        reconnect();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Initialize socket when user changes
  useEffect(() => {
    const cleanup = initializeSocket();
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [user]);
  
  // Reconnect function
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      initializeSocket();
    }
  };
  
  // Disconnect function
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      setIsConnected(false);
    }
  };
  
  // Send private message
  const sendPrivateMessage = (recipientId: number, message: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      showToast({
        type: 'error',
        message: 'Not connected to chat service',
      });
      return;
    }
    
    socketRef.current.emit('private-message', {
      recipient_id: recipientId,
      message,
    });
  };
  
  // Send class message
  const sendClassMessage = (classId: number, message: string) => {
    if (!socketRef.current || !socketRef.current.connected) {
      showToast({
        type: 'error',
        message: 'Not connected to chat service',
      });
      return;
    }
    
    socketRef.current.emit('class-message', {
      class_id: classId,
      message,
    });
  };
  
  // Send typing indicator
  const sendTypingIndicator = (data: { recipient_id?: number; class_id?: number }) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', data);
    }
  };
  
  // Send typing stopped
  const sendTypingStopped = (data: { recipient_id?: number; class_id?: number }) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing-stopped', data);
    }
  };
  
  // Subscribe to notification channels
  const subscribeToNotifications = (channels: string[]) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe-notifications', { channels });
    }
  };
  
  // Unsubscribe from notification channels
  const unsubscribeFromNotifications = (channels: string[]) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('unsubscribe-notifications', { channels });
    }
  };
  
  const contextValue: SocketContextType = {
    socket,
    isConnected,
    reconnect,
    disconnect,
    sendPrivateMessage,
    sendClassMessage,
    sendTypingIndicator,
    sendTypingStopped,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };
  
  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for using the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};

export default SocketContext;