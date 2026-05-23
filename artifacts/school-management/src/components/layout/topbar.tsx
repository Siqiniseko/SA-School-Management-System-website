import React from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, Menu, User } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b bg-card px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="truncate text-sm font-medium capitalize text-muted-foreground">
          {user.role} Portal
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-1 sm:gap-3">
        <Link href="/profile" className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted sm:px-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <span className="hidden max-w-[9rem] truncate font-medium sm:inline lg:max-w-[14rem]">{user.fullName}</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
