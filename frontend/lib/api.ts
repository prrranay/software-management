import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

api.interceptors.request.use((config) => {
  if (accessToken && !config.headers?.Authorization) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const original = err.config;

    if (status === 401 && !original?._retry) {
      original._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            const resp = await fetch("/api/auth/refresh", {
              method: "POST",
              credentials: "include",
            });
            if (!resp.ok) {
              setAccessToken(null);
              return;
            }
            const data = (await resp.json()) as { accessToken?: string };
            if (data.accessToken) {
              setAccessToken(data.accessToken);
            }
          } finally {
            isRefreshing = false;
          }
        })();
      }

      await refreshPromise;
      return api(original);
    }

    throw err;
  },
);

