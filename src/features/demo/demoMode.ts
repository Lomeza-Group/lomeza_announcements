export const isDemoModeEnabled =
  import.meta.env.MODE === 'prototype' ||
  (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
