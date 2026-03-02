import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private url = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

  connect() {
    if (this.socket) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('🔗 WebSocket Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 WebSocket Disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (data: any) => void) {
    if (!this.socket) this.connect();
    this.socket?.on(event, callback);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback?: (data: any) => void) {
    this.socket?.off(event, callback);
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, data: any) {
    if (!this.socket) this.connect();
    this.socket?.emit(event, data);
  }
}

export const socketClient = new SocketClient();
