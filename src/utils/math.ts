export function formatTime(totalSeconds: number): string {
  const floorSec = Math.floor(Math.max(0, totalSeconds));
  const minutes = Math.floor(floorSec / 60);
  const seconds = floorSec % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
