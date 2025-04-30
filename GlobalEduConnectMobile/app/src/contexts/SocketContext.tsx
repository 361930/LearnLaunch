import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import secureStorage from '../utils/secureStorage';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  joinClassRoom: (classId: number) => void;
  leaveClassRoom: (classId: number) => void;
  sendClassMessage: (classId: number, message: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Initialize socket connection when authenticated
  useEffect(() => {
    let socketInstance: Socket | null = null;

    const connectSocket = async () => {
      try {
        setConnecting(true);
        setError(null);

        // Get authentication token
        const token = await secureStorage.getItem('auth_token');
        
        if (!token || !isAuthenticated) {
          // Don't connect if not authenticated
          setConnecting(false);
          return;
        }

        // Create socket instance with auth
        socketInstance = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'], 
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        // Set up event handlers
        socketInstance.on('connect', () => {
          console.log('Socket connected');
          setConnected(true);
          setConnecting(false);
          setError(null);
        });

        socketInstance.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setConnected(false);
          setConnecting(false);
          setError(err);
          
          // Show error toast only on web (mobile already has NetInfo alerts)
          if (Platform.OS === 'web') {
            showToast({
              type: 'error',
              message: 'Connection error. Please check your internet connection.',
            });
          }
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setConnected(false);
          
          if (reason === 'io server disconnect') {
            // Server disconnected us, need to reconnect manually
            socketInstance?.connect();
          }
        });

        socketInstance.on('error', (err) => {
          console.error('Socket error:', err);
          setError(err);
          showToast({
            type: 'error',
            message: err.message || 'Connection error occurred',
          });
        });

        // Set socket in state
        setSocket(socketInstance);
      } catch (err) {
        console.error('Error setting up socket:', err);
        setConnecting(false);
        setConnected(false);
        setError(err instanceof Error ? err : new Error('Unknown socket error'));
      }
    };

    if (isAuthenticated && user) {
      connectSocket();
    }

    // Cleanup function
    return () => {
      if (socketInstance) {
        console.log('Disconnecting socket');
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [isAuthenticated, user, showToast]);

  // Join a class chat room
  const joinClassRoom = useCallback((classId: number) => {
    if (!socket || !connected) {
      showToast({
        type: 'error',
        message: 'Socket not connected. Cannot join room.',
      });
      return;
    }

    const roomId = `class_${classId}`;
    socket.emit('join_room', { roomId });
    
    console.log(`Joining room: ${roomId}`);
  }, [socket, connected, showToast]);

  // Leave a class chat room
  const leaveClassRoom = useCallback((classId: number) => {
    if (!socket || !connected) return;

    const roomId = `class_${classId}`;
    socket.emit('leave_room', { roomId });
    
    console.log(`Leaving room: ${roomId}`);
  }, [socket, connected]);

  // Send a message to a class chat
  const sendClassMessage = useCallback((classId: number, message: string) => {
    if (!socket || !connected) {
      showToast({
        type: 'error',
        message: 'Socket not connected. Cannot send message.',
      });
      return;
    }

    if (!message.trim()) {
      showToast({
        type: 'error',
        message: 'Cannot send empty message',
      });
      return;
    }

    const roomId = `class_${classId}`;
    socket.emit('send_message', { roomId, message });
    
    console.log(`Message sent to room ${roomId}: ${message}`);
  }, [socket, connected, showToast]);

  // Socket context value
  const value = useMemo(() => ({
    socket,
    connected,
    connecting,
    error,
    joinClassRoom,
    leaveClassRoom,
    sendClassMessage,
  }), [
    socket,
    connected,
    connecting,
    error,
    joinClassRoom,
    leaveClassRoom,
    sendClassMessage,
  ]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}