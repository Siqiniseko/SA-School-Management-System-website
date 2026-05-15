import React from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, User } from "lucide-react";

export function Topbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="font-medium text-sm text-muted-foreground capitalize">
        {user.role} Portal
      </div>
      <div className="flex items-center gap-4">
        <Link href="/profile" className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={user.fullName} className="h-full w-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <span className="font-medium">{user.fullName}</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </div>
    </header>
  );
}
