"use client";

import PublicNavbar from "@/components/PublicNavbar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-grow">{children}</main>
    </div>
  );
}
