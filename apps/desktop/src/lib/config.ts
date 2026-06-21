/** Base URL of the local CairnOS engine (apps/server). */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4319/api').replace(
  /\/$/,
  '',
);
