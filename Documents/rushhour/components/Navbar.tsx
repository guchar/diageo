"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const isLoggedIn = pathname !== "/login"; // Simple check, replace with actual auth logic

  const handleLogout = () => {
    // Implement actual logout logic here
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push("/login");
  };

  return (
    <nav className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            Job Search Agent
          </Link>
          {isLoggedIn && (
            <div className="hidden md:flex space-x-4">
              <NavLink href="/jobs" active={pathname === "/jobs"}>
                Jobs
              </NavLink>
              <NavLink href="/companies" active={pathname === "/companies"}>
                Companies
              </NavLink>
              <NavLink href="/profile" active={pathname === "/profile"}>
                Profile
              </NavLink>
            </div>
          )}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) => (
  <Link
    href={href}
    className={`px-3 py-2 rounded-md text-sm font-medium ${
      active
        ? "bg-primary-foreground text-primary"
        : "hover:bg-primary-foreground/10"
    }`}
  >
    {children}
  </Link>
);

export default Navbar;
