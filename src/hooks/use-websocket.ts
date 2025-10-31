import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocketNotifications(onBalanceUpdate?: (balance: string) => void) {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) return;

    let reconnectTimeout: NodeJS.Timeout;
    const maxReconnectDelay = 5000;
    let reconnectAttempts = 0;

    const connect = () => {
      // Get CSRF token from cookie - this is more reliable than session ID
      // as it's specifically made available to JavaScript
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (!csrfToken) {
        console.error('No CSRF token found for WebSocket authentication');
        return;
      }

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Connect to WebSocket with CSRF token for authentication
      const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${csrfToken}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        reconnectAttempts = 0; // Reset attempts on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          switch (message.type) {
            case 'transaction_update': {
              const { type, transaction } = message.data;
              import('@/utils/transaction').then(({ getFlashMessageForTransaction }) => {
                const flash = getFlashMessageForTransaction(transaction);
                toast({
                  description: flash.message,
                  variant: flash.type === 'success' ? 'default' : 
                          flash.type === 'error' ? 'destructive' :
                          flash.type === 'warning' ? 'default' : 'default',
                });
              });
              break;
            }

            case 'balance_update':
              console.log('Balance update received:', message.data.balance);
              onBalanceUpdate?.(message.data.balance);
              break;

            case 'notification':
              toast({
                description: message.data.message,
                variant: message.data.type === 'success' ? 'default' :
                        message.data.type === 'error' ? 'destructive' :
                        message.data.type === 'warning' ? 'default' : 'default',
              });
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        // Don't reconnect if closing was intentional or component is unmounting
        if (!isAuthenticated) return;

        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
        console.log(`Attempting to reconnect in ${delay}ms...`);
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts++;
          connect();
        }, delay);
      };
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null; // Prevent reconnection attempts
        ws.close();
      }
    };
  }, [isAuthenticated, onBalanceUpdate]);

  return wsRef.current;
}