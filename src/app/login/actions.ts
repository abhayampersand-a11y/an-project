"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_SECRET, SESSION_COOKIE, checkCredentials } from "@/lib/auth";

export type LoginState = { error?: string };

/** Server Action: validate static credentials and set the session cookie. */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!checkCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, AUTH_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  redirect("/dashboard");
}

/** Server Action: clear the session cookie and return to login. */
export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
