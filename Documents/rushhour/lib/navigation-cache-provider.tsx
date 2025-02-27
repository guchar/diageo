"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useContext, useRef, useEffect } from "react";

const Context = createContext<any>(null);

export function AppRouterCacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
  }, [pathname, searchParams]);

  return <Context.Provider value={null}>{children}</Context.Provider>;
}
