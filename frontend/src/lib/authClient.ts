import { ApiError, request } from "./apiClient";

export interface AuthUser {
  id: number;
  email: string;
  created_at: string;
}

export { ApiError as AuthError };

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
