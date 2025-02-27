import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Session } from "next-auth";

export async function auth(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function isAuthenticated() {
  const session = await auth();
  return !!session;
}
