import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminLearners from "@/pages/admin/learners";
import AdminClasses from "@/pages/admin/classes";
import TeacherDashboard from "@/pages/teacher/dashboard";
import LearnerDashboard from "@/pages/learner/dashboard";
import ParentDashboard from "@/pages/parent/dashboard";
import AccountantDashboard from "@/pages/accountant/dashboard";

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={`/dashboard/${user.role}`} />;
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

export default function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to={`/dashboard/${user.role}`} /> : <Login />}
      </Route>

      <Route path="/">
        {user ? <Redirect to={`/dashboard/${user.role}`} /> : <Redirect to="/login" />}
      </Route>

      <Route path="/dashboard/admin">
        <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute component={AdminUsers} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/learners">
        <ProtectedRoute component={AdminLearners} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/classes">
        <ProtectedRoute component={AdminClasses} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/subjects">
        <ProtectedRoute component={() => <div className="p-6">Subjects Management</div>} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/timetable">
        <ProtectedRoute component={() => <div className="p-6">Timetable Management</div>} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/notifications">
        <ProtectedRoute component={() => <div className="p-6">Notifications</div>} allowedRoles={["admin"]} />
      </Route>

      <Route path="/dashboard/teacher">
        <ProtectedRoute component={TeacherDashboard} allowedRoles={["teacher"]} />
      </Route>

      <Route path="/dashboard/learner">
        <ProtectedRoute component={LearnerDashboard} allowedRoles={["learner"]} />
      </Route>

      <Route path="/dashboard/parent">
        <ProtectedRoute component={ParentDashboard} allowedRoles={["parent"]} />
      </Route>

      <Route path="/dashboard/accountant">
        <ProtectedRoute component={AccountantDashboard} allowedRoles={["accountant"]} />
      </Route>

      <Route path="/:rest*">
        {user ? <Redirect to={`/dashboard/${user.role}`} /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}
