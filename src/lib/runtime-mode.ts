/**
 * Runtime fixtures are test-only. Consumer-facing development and production
 * both use real Supabase data so local testing exercises the actual product.
 */
export function isExplicitDemoMode(): boolean {
  return process.env.NODE_ENV === 'test';
}

export function canUseBrowserDemoData(): boolean {
  return process.env.NODE_ENV === 'test';
}
