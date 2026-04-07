import React from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useLocation } from "wouter";

export function Topbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="font-medium text-sm text-muted-foreground capitalize">
        {user.role} Portal
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-4 h-4" />
          </div>
          <span className="font-medium">{user.fullName}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </div>
    </header>
  );
}
