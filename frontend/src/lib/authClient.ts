export interface AuthUser {
  id: number;
  email: string;
  created_at: string;
}

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new AuthError(response.status, body?.detail ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function signup(email: string, password: string): Promise<AuthUser> {
  return request<AuthUser>("/api/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signin(email: string, password: string): Promise<AuthUser> {
  return request<AuthUser>("/api/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signout(): Promise<void> {
  return request<void>("/api/signout", { method: "POST" });
}

export function me(): Promise<AuthUser> {
  return request<AuthUser>("/api/me");
}
