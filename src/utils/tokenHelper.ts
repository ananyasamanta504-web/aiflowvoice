/**
 * FlowVoice Token and WebSocket helper
 */

export function generateMockToken(roomName: string, participantName: string): string {
  // Generates a mock token structure that client-side components can use for UI validation
  // or local mock sandbox testing when not connecting to a live cluster
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: participantName || 'guest_user',
      name: participantName || 'Guest User',
      iss: 'flowvoice_frontend',
      room: roomName || 'flowvoice-room-1',
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      exp: Math.floor(Date.now() / 1000) + 3600 * 24,
    })
  );
  const sig = btoa('flowvoice_signature_hash');
  return `${header}.${payload}.${sig}`;
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      return JSON.parse(atob(parts[1]));
    }
  } catch {
    return null;
  }
  return null;
}
