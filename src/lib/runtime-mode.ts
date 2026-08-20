export function isExplicitDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV === 'test';
}

export function canUseBrowserDemoData(): boolean {
  if (typeof window === 'undefined') {
    return isExplicitDemoMode();
  }

  return isExplicitDemoMode() || window.location.hostname === 'localhost';
}
