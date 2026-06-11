export function createRequestId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `salora-mobile-${Date.now().toString(36)}-${random}`;
}
