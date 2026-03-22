/**
 * Parses a raw QR code value.
 * Expected format: shifttrack://qr/{station_id}/{token}
 */
export interface ParsedQRValue {
  stationId: string;
  token: string;
}

export function parseQRValue(raw: string): ParsedQRValue | null {
  const PREFIX = "shifttrack://qr/";
  if (!raw.startsWith(PREFIX)) return null;

  const rest = raw.slice(PREFIX.length);
  const parts = rest.split("/");
  if (parts.length !== 2) return null;

  const [stationId, token] = parts;
  if (!isUUID(stationId) || !isUUID(token)) return null;

  return { stationId, token };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(value: string): boolean {
  return UUID_RE.test(value);
}
