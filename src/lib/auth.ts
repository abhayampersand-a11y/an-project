import "server-only";
import { cookies } from "next/headers";

/**
 * Static credential auth (demo-grade).
 *
 * Credentials and the session token live in environment variables, NOT in
 * source. Set them in `.env.local` for local dev and in the Vercel project
 * settings for production. See `.env.example`.
 */
export const SESSION_COOKIE = "dash_session";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
// The value stored in the session cookie. Anyone presenting this token is
// considered logged in, so keep it secret. Falls back to a dev value.
export const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-only-secret-change-me";

/** Returns true if the submitted credentials match the configured ones. */
export function checkCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/** Reads the session cookie and returns whether the request is authenticated. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === AUTH_SECRET;
}
