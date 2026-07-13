"use client";

import { createContext, useContext } from "react";
import { AuthUser } from "./authClient";

export const AuthUserContext = createContext<AuthUser | null>(null);

/** The signed-in user, published by AuthGate for anything inside it. */
export function useAuthUser(): AuthUser | null {
  return useContext(AuthUserContext);
}
