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
            const resp = await axios.post<{ accessToken: string }>(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );
            if (resp.data.accessToken) {
              setAccessToken(resp.data.accessToken);
              localStorage.setItem("accessToken", resp.data.accessToken);
            }
          } catch (e) {
            setAccessToken(null);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
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

