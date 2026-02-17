import { supabaseBrowser } from "@/lib/supabaseBrowser";

type FetchOptions = RequestInit & { headers?: Record<string, string> };

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(path, { ...options, headers });
}
