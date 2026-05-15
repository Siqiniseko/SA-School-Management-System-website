import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Login from "@/pages/login";
import LandingPage from "@/pages/landing";
import ProfilePage from "@/pages/profile";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminLearners from "@/pages/admin/learners";
import AdminClasses from "@/pages/admin/classes";
import AdminSubjects from "@/pages/admin/subjects";
import AdminTimetable from "@/pages/admin/timetable";
import AdminNotifications from "@/pages/admin/notifications";

import TeacherDashboard from "@/pages/teacher/dashboard";
import TeacherAttendance from "@/pages/teacher/attendance";
import TeacherMarks from "@/pages/teacher/marks";
import TeacherMaterials from "@/pages/teacher/materials";
import TeacherNotifications from "@/pages/teacher/notifications";
import TeacherRecords from "@/pages/teacher/records";
import TeacherVirtualClasses from "@/pages/teacher/virtual-classes";

import LearnerDashboard from "@/pages/learner/dashboard";
import LearnerProgress from "@/pages/learner/progress";
import LearnerTimetable from "@/pages/learner/timetable";
import LearnerAttendance from "@/pages/learner/attendance";
import LearnerMaterials from "@/pages/learner/materials";

import ParentDashboard from "@/pages/parent/dashboard";
import ParentFees from "@/pages/parent/fees";
import ParentProgress from "@/pages/parent/progress";
import ParentAttendance from "@/pages/parent/attendance";
import ParentPayments from "@/pages/parent/payments";

import AccountantDashboard from "@/pages/accountant/dashboard";
import AccountantFees from "@/pages/accountant/fees";
import AccountantPayments from "@/pages/accountant/payments";
import AccountantReports from "@/pages/accountant/reports";

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={"/dashboard/" + user.role} />;
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
        {user ? <Redirect to={"/dashboard/" + user.role} /> : <Login />}
      </Route>

      <Route path="/">
        <LandingPage />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>

      {/* Admin routes */}
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
        <ProtectedRoute component={AdminSubjects} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/timetable">
        <ProtectedRoute component={AdminTimetable} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/notifications">
        <ProtectedRoute component={AdminNotifications} allowedRoles={["admin"]} />
      </Route>

      {/* Teacher routes */}
      <Route path="/dashboard/teacher">
        <ProtectedRoute component={TeacherDashboard} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/attendance">
        <ProtectedRoute component={TeacherAttendance} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/marks">
        <ProtectedRoute component={TeacherMarks} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/materials">
        <ProtectedRoute component={TeacherMaterials} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/records">
        <ProtectedRoute component={TeacherRecords} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/virtual-classes">
        <ProtectedRoute component={TeacherVirtualClasses} allowedRoles={["teacher"]} />
      </Route>
      <Route path="/teacher/notifications">
        <ProtectedRoute component={TeacherNotifications} allowedRoles={["teacher"]} />
      </Route>

      {/* Learner routes */}
      <Route path="/dashboard/learner">
        <ProtectedRoute component={LearnerDashboard} allowedRoles={["learner"]} />
      </Route>
      <Route path="/learner/progress">
        <ProtectedRoute component={LearnerProgress} allowedRoles={["learner"]} />
      </Route>
      <Route path="/learner/timetable">
        <ProtectedRoute component={LearnerTimetable} allowedRoles={["learner"]} />
      </Route>
      <Route path="/learner/attendance">
        <ProtectedRoute component={LearnerAttendance} allowedRoles={["learner"]} />
      </Route>
      <Route path="/learner/materials">
        <ProtectedRoute component={LearnerMaterials} allowedRoles={["learner"]} />
      </Route>

      {/* Parent routes */}
      <Route path="/dashboard/parent">
        <ProtectedRoute component={ParentDashboard} allowedRoles={["parent"]} />
      </Route>
      <Route path="/parent/fees">
        <ProtectedRoute component={ParentFees} allowedRoles={["parent"]} />
      </Route>
      <Route path="/parent/progress">
        <ProtectedRoute component={ParentProgress} allowedRoles={["parent"]} />
      </Route>
      <Route path="/parent/attendance">
        <ProtectedRoute component={ParentAttendance} allowedRoles={["parent"]} />
      </Route>
      <Route path="/parent/payments">
        <ProtectedRoute component={ParentPayments} allowedRoles={["parent"]} />
      </Route>

      {/* Accountant routes */}
      <Route path="/dashboard/accountant">
        <ProtectedRoute component={AccountantDashboard} allowedRoles={["accountant"]} />
      </Route>
      <Route path="/accountant/fees">
        <ProtectedRoute component={AccountantFees} allowedRoles={["accountant"]} />
      </Route>
      <Route path="/accountant/payments">
        <ProtectedRoute component={AccountantPayments} allowedRoles={["accountant"]} />
      </Route>
      <Route path="/accountant/reports">
        <ProtectedRoute component={AccountantReports} allowedRoles={["accountant"]} />
      </Route>

      <Route path="/:rest*">
        {user ? <Redirect to={"/dashboard/" + user.role} /> : <LandingPage />}
      </Route>
    </Switch>
  );
}
