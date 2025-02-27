"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-[#4F46E5] text-white p-4">
      <nav className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold">
            Job Search Agent
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              href="/jobs"
              className="px-4 py-2 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] transition-colors"
            >
              Jobs
            </Link>
            <Link
              href="/jobs/test"
              className="px-4 py-2 rounded-lg hover:bg-[#6366F1] transition-colors"
            >
              Test Page
            </Link>
            <Link
              href="/companies"
              className="px-4 py-2 rounded-lg hover:bg-[#6366F1] transition-colors"
            >
              Companies
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2 rounded-lg hover:bg-[#6366F1] transition-colors"
            >
              Profile
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {session?.user?.email && (
            <span className="text-sm">{session.user.email}</span>
          )}
          <button onClick={() => signOut()} className="text-sm hover:underline">
            → Logout
          </button>
        </div>
      </nav>
    </header>
  );
}
