import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the URL of your Socket.IO server
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  lastError: Error | null;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  emit: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
  lastError: null,
  connect: () => {},
  disconnect: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  emit: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to socket when context is mounted if user is authenticated
  useEffect(() => {
    if (user) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [user]);

  // Function to connect to socket.io server
  const connect = async () => {
    if (socket?.connected) return;

    try {
      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Connect with auth token
      const socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: {
          token
        },
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Set up event listeners
      socketInstance.on('connect', () => {
        setIsConnected(true);
        setLastError(null);
        reconnectAttempts.current = 0;
        console.log('Socket connected successfully');
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setLastError(err);
        
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          showToast(
            'Unable to establish real-time connection. Chat will work in offline mode.',
            'error'
          );
          socketInstance.disconnect();
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // The server has forced the disconnect, need to reconnect manually
          socketInstance.connect();
        }
      });

      socketInstance.on('error', (err) => {
        console.error('Socket error:', err);
        setLastError(new Error(err.message || 'Unknown socket error'));
        showToast('Connection error: ' + (err.message || 'Unknown error'), 'error');
      });

      setSocket(socketInstance);
    } catch (err) {
      console.error('Error setting up socket connection:', err);
      setLastError(err instanceof Error ? err : new Error('Unknown error setting up socket'));
      showToast('Failed to connect to chat server', 'error');
    }
  };

  // Function to disconnect from socket
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Function to join a room (typically a class discussion)
  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', { roomId });
      console.log('Joined room:', roomId);
    } else {
      console.warn('Cannot join room: socket not connected');
    }
  };

  // Function to leave a room
  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_room', { roomId });
      console.log('Left room:', roomId);
    }
  };

  // Function to emit events
  const emit = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`);
      setLastError(new Error('Not connected to chat server'));
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastError,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        emit,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketContext;