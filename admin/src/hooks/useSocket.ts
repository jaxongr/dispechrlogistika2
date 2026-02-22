import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(`${WS_URL}/ws`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef;
}

export function useSocketEvent(event: string, handler: (data: any) => void) {
  const socketRef = useSocket();

  useEffect(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.on(event, handler);
      return () => { socket.off(event, handler); };
    }
  }, [event, handler]);
}
