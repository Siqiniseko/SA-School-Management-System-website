import React from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { 
  Users, BookOpen, Calendar, Bell, Banknote, FileText,
  BarChart, LayoutDashboard, GraduationCap, ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  let links: { label: string; href: string; icon: React.ElementType }[] = [];

  switch (user.role) {
    case "admin":
      links = [
        { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Learners", href: "/admin/learners", icon: GraduationCap },
        { label: "Classes", href: "/admin/classes", icon: BookOpen },
        { label: "Subjects", href: "/admin/subjects", icon: FileText },
        { label: "Timetable", href: "/admin/timetable", icon: Calendar },
        { label: "Notifications", href: "/admin/notifications", icon: Bell },
      ];
      break;
    case "teacher":
      links = [
        { label: "Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
        { label: "Attendance", href: "/teacher/attendance", icon: ClipboardCheck },
        { label: "Marks", href: "/teacher/marks", icon: BarChart },
        { label: "Materials", href: "/teacher/materials", icon: FileText },
        { label: "Notifications", href: "/teacher/notifications", icon: Bell },
      ];
      break;
    case "learner":
      links = [
        { label: "Dashboard", href: "/dashboard/learner", icon: LayoutDashboard },
        { label: "Progress", href: "/learner/progress", icon: BarChart },
        { label: "Timetable", href: "/learner/timetable", icon: Calendar },
        { label: "Attendance", href: "/learner/attendance", icon: ClipboardCheck },
        { label: "Materials", href: "/learner/materials", icon: FileText },
      ];
      break;
    case "parent":
      links = [
        { label: "Dashboard", href: "/dashboard/parent", icon: LayoutDashboard },
        { label: "Fees", href: "/parent/fees", icon: Banknote },
        { label: "Progress", href: "/parent/progress", icon: BarChart },
        { label: "Attendance", href: "/parent/attendance", icon: ClipboardCheck },
        { label: "Payments", href: "/parent/payments", icon: FileText },
      ];
      break;
    case "accountant":
      links = [
        { label: "Dashboard", href: "/dashboard/accountant", icon: LayoutDashboard },
        { label: "Fees", href: "/accountant/fees", icon: Banknote },
        { label: "Payments", href: "/accountant/payments", icon: FileText },
        { label: "Reports", href: "/accountant/reports", icon: BarChart },
      ];
      break;
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-[100dvh] flex flex-col text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
          SA
        </div>
        <h2 className="font-bold text-lg leading-tight">School<br/>Management</h2>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || location.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
        &copy; {new Date().getFullYear()} SA Schools
      </div>
    </aside>
  );
}
