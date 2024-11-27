import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { StreamSocket } from '../types/socket';

export const useSocket = (): StreamSocket | null => {
  const { user } = useAuth();
  const socketRef = useRef<StreamSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectSocket = useCallback(() => {
    if (!user) return;

    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    if (socketRef.current?.connected) {
      return;
    }

    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token')
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: false,
      multiplex: true
    }) as StreamSocket;

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      reconnectAttempts.current = 0;
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        socketRef.current?.disconnect();
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Reconnect manually if the server dropped the connection
        setTimeout(() => {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            socketRef.current?.connect();
          }
        }, 1000);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    const cleanup = connectSocket();
    return () => {
      cleanup?.();
    };
  }, [connectSocket]);

  return socketRef.current;
};

export default useSocket;
