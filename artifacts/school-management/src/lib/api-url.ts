const DEFAULT_PRODUCTION_API_URL = "https://sa-school-api.onrender.com";

const configuredApiUrl =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_URL : "");

export const apiBaseUrl = configuredApiUrl.trim().replace(/\/+$/, "");

export function apiUrl(path: string): string {
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}
