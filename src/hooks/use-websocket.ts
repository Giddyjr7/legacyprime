// WebSocket functionality temporarily disabled per user request.
// This file now exports a no-op hook to preserve imports and avoid console noise.
export function useWebSocketNotifications(_onBalanceUpdate?: (balance: string) => void) {
  // No operation — returns null to match previous API shape.
  return null as WebSocket | null;
}