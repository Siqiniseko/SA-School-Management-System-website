import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import landingStudents from "@/assets/landing-students.webp";
import landingSchoolyard from "@/assets/landing-schoolyard.jpg";
import landingExamHall from "@/assets/landing-exam-hall.jpg";
import {
  ArrowRight,
  Banknote,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";

const roles = [
  {
    title: "Administrators",
    copy: "Manage users, learners, subjects, classes, notices, and school timetables from one portal.",
    icon: ShieldCheck,
  },
  {
    title: "Teachers",
    copy: "Capture attendance and marks, publish learning material, upload records, and host virtual classes.",
    icon: BookOpenCheck,
  },
  {
    title: "Parents",
    copy: "Track learner progress, attendance, fees, payments, and printable receipts.",
    icon: Users,
  },
  {
    title: "Learners",
    copy: "View timetables, learning materials, attendance, and academic progress.",
    icon: GraduationCap,
  },
];

const capabilities = [
  { label: "Fee payments and slips", icon: Banknote },
  { label: "Attendance registers", icon: ClipboardCheck },
  { label: "Online class links", icon: Video },
  { label: "Records and materials", icon: FileText },
  { label: "Timetable planning", icon: CalendarCheck },
];

const campusImages = [
  {
    src: landingStudents,
    title: "Learner life",
    copy: "Daily school communication for learners, parents, and staff.",
  },
  {
    src: landingSchoolyard,
    title: "Campus operations",
    copy: "Classes, attendance, subjects, and school notices in one place.",
  },
  {
    src: landingExamHall,
    title: "Academic records",
    copy: "Marks, records, uploaded files, and progress tracking.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const portalHref = user ? `/dashboard/${user.role}` : "/login";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section
        className="relative overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${landingStudents})` }}
      >
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
          <header className="flex w-full max-w-[20rem] items-center justify-between gap-2 sm:max-w-none">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-400 font-bold text-slate-950">
                SA
              </span>
              <span className="hidden text-sm font-semibold uppercase text-white/90 sm:inline">
                School Management
              </span>
            </Link>
            <Button asChild size="sm" variant="outline" className="shrink-0 border-white/50 bg-white/10 px-2 text-xs text-white sm:min-h-9 sm:px-4 sm:text-sm">
              <Link href={portalHref}>{user ? "Dashboard" : "Portal Login"}</Link>
            </Button>
          </header>

          <div className="flex flex-1 items-center py-10">
            <div className="w-full min-w-0 max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase text-amber-300">
                South African school operations
              </p>
              <h1 className="max-w-[17rem] break-words text-3xl font-bold leading-tight sm:max-w-3xl sm:text-5xl sm:leading-[1.05]">
                SA School Management System
              </h1>
              <p className="mt-5 max-w-[20rem] text-base leading-7 text-white/85 sm:max-w-2xl">
                A working portal for administrators, teachers, learners, parents, and accountants to manage daily school work in one place.
              </p>
              <div className="mt-7 flex w-full max-w-[20rem] flex-col gap-3 sm:max-w-none sm:flex-row">
                <Button asChild size="lg" className="w-full bg-amber-400 text-slate-950 sm:w-auto">
                  <Link href={portalHref}>
                    {user ? "Open Dashboard" : "Enter Portal"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full border-white/50 bg-white/10 text-white sm:w-auto">
                  <Link href="/login">Use Demo Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:px-10">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3">
                <Icon className="h-5 w-5 text-emerald-700" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-background py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">School life, fully connected</p>
            <h2 className="mt-2 text-3xl font-bold">Built for real classrooms and school offices</h2>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {campusImages.map((image) => (
              <article key={image.title} className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <img src={image.src} alt={image.title} className="h-56 w-full object-cover" />
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{image.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{image.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">Built around school roles</p>
            <h2 className="mt-2 text-3xl font-bold">One system, five connected portals</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <article key={role.title} className="rounded-lg border bg-card p-5 shadow-sm">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{role.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{role.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Ready for daily work</p>
            <h2 className="mt-2 text-3xl font-bold">From payments to virtual lessons</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              The portal now includes parent payment receipts, editable profiles with photo uploads, teacher record uploads, and scheduled online classes.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Profile photos are uploaded through the app",
              "Teachers can attach record files",
              "Virtual classes can be marked live or completed",
              "Parents can print payment slips",
            ].map((item) => (
              <div key={item} className="rounded-lg border bg-background p-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">SA School Management System</p>
            <p className="text-sm text-white/65">School operations, records, payments, and learning portals.</p>
          </div>
          <Button asChild className="bg-amber-400 text-slate-950">
            <Link href={portalHref}>{user ? "Go to Dashboard" : "Login"}</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
