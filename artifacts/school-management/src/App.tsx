import React from "react";
import { AuthProvider } from "@/lib/auth";
import AppRoutes from "./AppRoutes";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
