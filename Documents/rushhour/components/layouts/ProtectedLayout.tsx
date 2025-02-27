"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // Temporarily bypass auth for debugging
  return <div className="min-h-screen bg-background">{children}</div>;
}
