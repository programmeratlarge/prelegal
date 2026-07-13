/** Shared fetch wrapper for all /api clients: JSON, cookies, typed errors. */

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new ApiError(response.status, body?.detail ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
