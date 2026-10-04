import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Session } from "./types";
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__
    ? Platform.OS === "web"
      ? typeof window !== "undefined"
        ? window.location.origin + "/api/v1"
        : "http://localhost:5183/api/v1"
      : Platform.OS === "ios"
        ? "http://localhost:8080/api/v1"
        : "http://10.0.2.2:8080/api/v1"
    : "")
).replace(/\/$/, "");
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || "").replace(
  /\/$/,
  "",
);
let session: Session | null = null;
let revision = 0;
let refreshPending: { revision: number; promise: Promise<void> } | null = null;
let storageWrite: Promise<void> = Promise.resolve();
const listeners = new Set<(s: Session | null) => void>();
export const onSession = (listener: (s: Session | null) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const currentSession = () => session;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
// Preview sessions are memory-only; Android credentials use the encrypted keystore.
export async function setSession(next: Session | null) {
  revision++;
  session = next;
  listeners.forEach((fn) => fn(next));
  if (Platform.OS !== "web") {
    storageWrite = storageWrite
      .catch(() => {})
      .then(() =>
        next
          ? SecureStore.setItemAsync("paseo.session", JSON.stringify(next))
          : SecureStore.deleteItemAsync("paseo.session"),
      );
    await storageWrite;
  }
}
export async function restoreSession() {
  if (Platform.OS === "web") return;
  const version = revision;
  try {
    const saved = await SecureStore.getItemAsync("paseo.session");
    if (!saved || version !== revision) return;
    const parsed = JSON.parse(saved) as Session;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user?.id) {
      await setSession(null);
      return;
    }
    session = parsed;
    listeners.forEach((fn) => fn(session));
    await refresh();
  } catch (error) {
    if (
      version === revision &&
      (!(error instanceof ApiError) ||
        error.status === 401 ||
        error.status === 403)
    )
      await setSession(null);
    // A temporary offline state must not erase a valid saved refresh token.
  }
}
async function refresh() {
  const before = session,
    version = revision;
  if (refreshPending?.revision === version) return refreshPending.promise;
  if (!before) throw new ApiError(401, "Inicia sesión para continuar.");
  const promise = (async () => {
    const next = await raw<Session>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: before.refreshToken }),
      },
      false,
    );
    if (version !== revision) throw new ApiError(401, "La sesión cambió.");
    await setSession(next);
  })().finally(() => {
    if (refreshPending?.revision === version) refreshPending = null;
  });
  refreshPending = { revision: version, promise };
  return promise;
}
async function raw<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  if (!API_URL)
    throw new ApiError(0, "Falta configurar la dirección del servidor.");
  if (!__DEV__ && !API_URL.startsWith("https://"))
    throw new ApiError(0, "La app publicada necesita una conexión HTTPS.");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    path === "/jarvis/chat" ? 60000 : 20000,
  );
  try {
    const response = await fetch(API_URL + path, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(authenticated && session
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {}),
        ...options.headers,
      },
    });
    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      throw new ApiError(
        response.status,
        "El servidor devolvió una respuesta no válida.",
      );
    }
    if (!response.ok)
      throw new ApiError(
        response.status,
        body?.error?.message ||
          body?.message ||
          "No pudimos completar la solicitud.",
      );
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      0,
      "No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const version = revision,
    owner = session?.user.id;
  try {
    return await raw<T>(path, options);
  } catch (e) {
    if (
      e instanceof ApiError &&
      e.status === 401 &&
      owner &&
      session?.user.id === owner &&
      !path.startsWith("/auth/")
    ) {
      if (version === revision) {
        try {
          await refresh();
        } catch (error) {
          if (
            version === revision &&
            error instanceof ApiError &&
            [401, 403].includes(error.status)
          )
            await setSession(null);
          throw error;
        }
      }
      if (session?.user.id !== owner)
        throw new ApiError(401, "La sesión cambió.");
      return raw<T>(path, options);
    }
    throw e;
  }
}
export const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export async function logout() {
  const token = session?.refreshToken;
  await setSession(null);
  if (token)
    try {
      await post("/auth/logout", { refreshToken: token });
    } catch {
      /* Local credentials have already been removed. */
    }
}
