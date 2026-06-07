import { redirect } from "next/navigation";

// Root sends everyone to the dashboard; proxy.ts bounces unauthenticated
// users to /login.
export default function Home() {
  redirect("/dashboard");
}
