/**
 * Centralized API configuration for ZentroMart AI Voice Assistant.
 *
 * Automatically resolves API and static audio URLs for:
 * 1. Production deployments on Vercel connecting to Render backend:
 *    https://zentromart-ai-backend.onrender.com
 * 2. Local development connecting via Vite proxy or custom VITE_API_BASE_URL.
 *
 * NOTE: API keys (Gemini, Gnani) are strictly maintained on the backend.
 * Never expose secrets in client-side Vite environment variables.
 */

export const PRODUCTION_DEFAULT_BASE_URL = "https://zentromart-ai-backend.onrender.com";

const envBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();

export const API_BASE_URL: string = (
  envBaseUrl || (import.meta.env.PROD ? PRODUCTION_DEFAULT_BASE_URL : "")
).replace(/\/+$/, "");

/**
 * Builds an absolute URL for any API endpoint path.
 *
 * Examples:
 *   apiUrl("/api/health") -> "https://zentromart-ai-backend.onrender.com/api/health" (prod)
 *   apiUrl("/api/health") -> "/api/health" (dev with proxy)
 */
export function apiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Resolves audio URLs (such as /static/audio/call_01.wav) against the Render backend.
 * Handles relative paths, absolute URLs, and blob/data URIs gracefully.
 */
export function resolveAudioUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  const base = API_BASE_URL || (import.meta.env.PROD ? PRODUCTION_DEFAULT_BASE_URL : "");
  return `${base}${cleanPath}`;
}
